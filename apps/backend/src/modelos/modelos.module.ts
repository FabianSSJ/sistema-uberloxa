import { Module } from '@nestjs/common';
import { ModelosService } from './modelos.service';
import { ModelosController } from './modelos.controller';

@Module({
  providers: [ModelosService],
  controllers: [ModelosController]
})
export class ModelosModule {}
