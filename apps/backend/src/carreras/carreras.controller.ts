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

  @Get('panel-completo')
  findPanelCompleto(@Req() req: any) {
    return this.carrerasService.findPanelCompleto(req.user);
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
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    // SUPERADMIN borra cualquier carrera, en cualquier estado. Cualquier otro rol solo
    // puede borrar una carrera PROPIA y mientras sigue PENDIENTE (sin resolver) — cubre
    // el "me equivoqué, la puse 2 veces" sin abrir la puerta a borrar registros ya
    // resueltos, que son los que alimentan reportes y estadísticas históricas.
    if (req.user?.rol !== 'SUPERADMIN') {
      const carrera = await this.carrerasService.findOne(id, req.user); // ya valida ownership para CHARLIE (404 si es de otra)
      if (carrera.creadoPorId !== req.user?.sub) {
        throw new ForbiddenException('Solo podés eliminar carreras que vos mismo creaste.');
      }
      if (carrera.estado !== 'pendiente') {
        throw new ForbiddenException('Solo se puede eliminar una carrera mientras está pendiente (sin resolver).');
      }
    }
    return this.carrerasService.remove(id);
  }
}
