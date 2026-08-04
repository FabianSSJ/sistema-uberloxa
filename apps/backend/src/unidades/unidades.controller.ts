import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { UnidadesService } from './unidades.service';
import { CreateUnidadDto } from './dto/create-unidad.dto';
import { UpdateUnidadDto } from './dto/update-unidad.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModulesGuard } from '../auth/guards/modules.guard';
import { RequireModule } from '../auth/decorators/modules.decorator';
import { EstadoUnidad } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard, ModulesGuard)
@RequireModule('unidades')
@Controller('unidades')
export class UnidadesController {
  constructor(private readonly unidadesService: UnidadesService) {}

  @Post()
  create(@Body() createUnidadDto: CreateUnidadDto) {
    return this.unidadesService.create(createUnidadDto);
  }

  // La Charlie (modulo 'carreras') necesita LEER las unidades para despachar, por eso se permiten ambos.
  @Get()
  @RequireModule('unidades', 'carreras')
  findAll() {
    return this.unidadesService.findAll();
  }

  @Get(':id')
  @RequireModule('unidades', 'carreras')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.unidadesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUnidadDto: UpdateUnidadDto) {
    return this.unidadesService.update(id, updateUnidadDto);
  }

  // La Charlie (modulo 'carreras') tambien necesita cambiar el estado operativo de la unidad,
  // por eso este endpoint permite ambos modulos (override del @RequireModule de la clase).
  @Patch(':id/estado')
  @RequireModule('unidades', 'carreras')
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Body('estado') estado: EstadoUnidad) {
    return this.unidadesService.cambiarEstado(id, estado);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.unidadesService.remove(id);
  }
}
