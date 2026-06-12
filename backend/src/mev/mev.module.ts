import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MevService } from './mev.service';
import { MevController } from './mev.controller';
import { MevDetectorService } from './mev-detector.service';
import { MevEvent } from './entities/mev-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MevEvent])],
  providers: [MevService, MevDetectorService],
  controllers: [MevController],
  exports: [MevService],
})
export class MevModule {}
