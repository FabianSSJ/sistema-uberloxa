import { Controller, Get, Post, Body, Param, ParseIntPipe, Patch, Query, UseGuards, Req, Delete, ForbiddenException } from '@nestjs/common';
import { CarrerasService } from './carreras.service';
import { CreateCarreraDto } from './dto/create-carrera.dto';
import { FindCarrerasQueryDto } from './dto/find-carreras-query.dto';
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
  findAll(@Req() req: any, @Query() query: FindCarrerasQueryDto) {
    return this.carrerasService.findAll(req.user, {
      desde: query.desde ? new Date(query.desde) : undefined,
      hasta: query.hasta ? new Date(query.hasta) : undefined,
      cursor: query.cursor,
      take: query.take,
    });
  }

  @Get('recent')
  findRecent(@Req() req: any) {
    return this.carrerasService.findRecent(req.user);
  }

  @Get('panel')
  findPanel(@Req() req: any) {
    return this.carrerasService.findPanel(req.user);
  }

  @Patch(':id/completar')
  completar(
    @Param('id', ParseIntPipe) id: number,
    @Body('unidadId') unidadId: number | undefined,
    @Req() req: any,
  ) {
    return this.carrerasService.completar(id, unidadId, req.user);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.carrerasService.cancelar(id, req.user);
  }

  @Patch(':id/perder')
  perder(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.carrerasService.perder(id, req.user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.carrerasService.findOne(id, req.user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    if (req.user?.rol !== 'SUPERADMIN') {
      throw new ForbiddenException('Solo el superadministrador puede eliminar carreras permanentemente.');
    }
    return this.carrerasService.remove(id);
  }
}
