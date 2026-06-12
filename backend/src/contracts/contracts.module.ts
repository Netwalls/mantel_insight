import { Module, Global } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';

@Global()
@Module({
  providers: [ContractsService],
  controllers: [ContractsController],
  exports: [ContractsService],
})
export class ContractsModule {}
