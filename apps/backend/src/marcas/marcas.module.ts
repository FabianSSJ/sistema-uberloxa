import { Module } from '@nestjs/common';
import { MarcasService } from './marcas.service';
import { MarcasController } from './marcas.controller';

@Module({
  providers: [MarcasService],
  controllers: [MarcasController]
})
export class MarcasModule {}
