import { Module } from '@nestjs/common';
import { SectoresService } from './sectores.service';
import { SectoresController } from './sectores.controller';

@Module({
  controllers: [SectoresController],
  providers: [SectoresService],
  exports: [SectoresService], // Exported in case other modules need sector logic
})
export class SectoresModule {}
