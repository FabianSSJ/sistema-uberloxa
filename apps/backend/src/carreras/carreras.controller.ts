import { Controller, Get, Post, Body, Param, ParseIntPipe, Patch, UseGuards, Req, Delete, UnauthorizedException } from '@nestjs/common';
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
  create(@Body() createCarreraDto: CreateCarreraDto, @Req() req: any) {
    const userId = req.user?.sub;
    return this.carrerasService.create(createCarreraDto, userId);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.carrerasService.findAll(req.user);
  }

  @Get('recent')
  findRecent(@Req() req: any) {
    return this.carrerasService.findRecent(req.user);
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

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    if (req.user?.rol !== 'SUPERADMIN') {
      throw new UnauthorizedException('Solo el superadministrador puede eliminar carreras permanentemente.');
    }
    return this.carrerasService.remove(id);
  }
}
