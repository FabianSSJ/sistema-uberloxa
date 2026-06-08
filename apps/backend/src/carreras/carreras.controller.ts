import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { CarrerasService } from './carreras.service';
import { CreateCarreraDto } from './dto/create-carrera.dto';
import { AssignUnidadDto } from './dto/assign-unidad.dto';
import { UpdateEstadoCarreraDto } from './dto/update-estado-carrera.dto';

@Controller('carreras')
export class CarrerasController {
  constructor(private readonly carrerasService: CarrerasService) {}

  @Post()
  create(@Body() createCarreraDto: CreateCarreraDto) {
    // TODO: Obtener el ID del usuario del token cuando se implemente Auth
    return this.carrerasService.create(createCarreraDto, 1);
  }

  @Get()
  findAll() {
    return this.carrerasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.carrerasService.findOne(id);
  }

  @Patch(':id/asignar')
  assignUnidad(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignUnidadDto: AssignUnidadDto,
  ) {
    return this.carrerasService.assignUnidad(id, assignUnidadDto);
  }

  @Patch(':id/estado')
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEstadoDto: UpdateEstadoCarreraDto,
  ) {
    return this.carrerasService.updateEstado(id, updateEstadoDto);
  }
}
