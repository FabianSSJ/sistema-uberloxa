import { Controller, Get, Post, Body, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { CarrerasService } from './carreras.service';
import { CreateCarreraDto } from './dto/create-carrera.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModulesGuard } from '../auth/guards/modules.guard';
import { RequireModule } from '../auth/decorators/modules.decorator';

@UseGuards(JwtAuthGuard, ModulesGuard)
@RequireModule('carreras')
@Controller('carreras')
export class CarrerasController {
  constructor(private readonly carrerasService: CarrerasService) {}

  @Post()
  create(@Body() createCarreraDto: CreateCarreraDto) {
    return this.carrerasService.create(createCarreraDto);
  }

  @Get()
  findAll() {
    return this.carrerasService.findAll();
  }

  @Get('recent')
  findRecent() {
    return this.carrerasService.findRecent();
  }

  @Patch(':id/completar')
  completar(
    @Param('id', ParseIntPipe) id: number,
    @Body('unidadId') unidadId?: number,
  ) {
    return this.carrerasService.completar(id, unidadId);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id', ParseIntPipe) id: number) {
    return this.carrerasService.cancelar(id);
  }

  @Patch(':id/perder')
  perder(@Param('id', ParseIntPipe) id: number) {
    return this.carrerasService.perder(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.carrerasService.findOne(id);
  }
}
