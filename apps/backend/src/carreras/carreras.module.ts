import { Module } from '@nestjs/common';
import { CarrerasService } from './carreras.service';
import { CarrerasController } from './carreras.controller';

@Module({
  providers: [CarrerasService],
  controllers: [CarrerasController]
})
export class CarrerasModule {}
