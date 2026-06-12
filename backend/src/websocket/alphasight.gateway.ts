import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SignalsService } from '../signals/signals.service';
import { AgentsService } from '../agents/agents.service';
import { WalletsService } from '../wallets/wallets.service';
import { MevService } from '../mev/mev.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/realtime',
})
export class AlphaSightGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger('AlphaSightGateway');
  private connectedClients = 0;

  constructor(
    private signalsService: SignalsService,
    private agentsService: AgentsService,
    private walletsService: WalletsService,
    private mevService: MevService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(`Client connected: ${client.id} (total: ${this.connectedClients})`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(`Client disconnected: ${client.id} (total: ${this.connectedClients})`);
  }

  @SubscribeMessage('subscribe:feed')
  async handleFeedSubscription(client: Socket) {
    const recentSignals = await this.signalsService.findAll(10);
    client.emit('initial:feed', recentSignals);
    this.logger.debug(`Client ${client.id} subscribed to feed`);
  }

  @SubscribeMessage('subscribe:dashboard')
  async handleDashboardSubscription(client: Socket) {
    const [signals, walletStats, mevStats, agentStatuses] = await Promise.all([
      this.signalsService.findAll(5),
      this.walletsService.getEcosystemStats(),
      this.mevService.getMevStats(),
      Promise.resolve(this.agentsService.getAllStatuses()),
    ]);

    client.emit('initial:dashboard', { signals, walletStats, mevStats, agentStatuses });
  }

  @SubscribeMessage('subscribe:agents')
  handleAgentSubscription(client: Socket) {
    client.emit('initial:agents', this.agentsService.getAllStatuses());
  }

  // Broadcast events triggered by the system

  @OnEvent('signal.generated')
  broadcastNewSignal(signal: any) {
    this.server.emit('signal:new', signal);
    this.logger.debug(`Broadcast new signal: ${signal.type}`);
  }

  @OnEvent('wallet.event.recorded')
  broadcastWalletEvent({ wallet, event }: any) {
    this.server.emit('wallet:event', { wallet, event });
  }

  @OnEvent('mev.event.detected')
  broadcastMevEvent(event: any) {
    this.server.emit('mev:event', event);
  }

  @OnEvent('agent.status.updated')
  broadcastAgentStatus(status: any) {
    this.server.emit('agent:status', status);
  }

  @OnEvent('agent.verdict.recorded')
  broadcastAgentVerdict(data: any) {
    this.server.emit('agent:verdict', data);
  }

  @OnEvent('watcher.exit.detected')
  broadcastExitDetected(data: any) {
    this.server.emit('watcher:exit', data);
  }

  @OnEvent('hunter.mev.detected')
  broadcastHunterAlert(data: any) {
    this.server.emit('hunter:mev', data);
  }

  @OnEvent('analyst.verdict.complete')
  broadcastAnalystVerdict(data: any) {
    this.server.emit('analyst:verdict', data);
  }

  getConnectedClients(): number {
    return this.connectedClients;
  }
}
