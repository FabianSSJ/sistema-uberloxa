import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SectoresService } from './sectores.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Sectores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sectores')
export class SectoresController {
  constructor(private readonly sectoresService: SectoresService) {}

  // Lectura: cualquier usuario autenticado (Charlie la necesita para el combo de sector al
  // crear/editar un cliente). Escritura: solo administración — no hay ningún flujo de UI donde
  // Charlie deba crear/editar/borrar sectores.
  @Post()
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Crear un nuevo sector' })
  @ApiResponse({ status: 201, description: 'El sector ha sido creado.' })
  @ApiResponse({ status: 409, description: 'El nombre del sector ya existe.' })
  create(@Body() createSectorDto: CreateSectorDto) {
    return this.sectoresService.create(createSectorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los sectores' })
  findAll() {
    return this.sectoresService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un sector por ID' })
  @ApiResponse({ status: 404, description: 'Sector no encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sectoresService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar un sector' })
  @ApiResponse({ status: 404, description: 'Sector no encontrado.' })
  @ApiResponse({ status: 409, description: 'El nombre del sector ya existe.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSectorDto: UpdateSectorDto,
  ) {
    return this.sectoresService.update(id, updateSectorDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar un sector y desvincular sus clientes' })
  @ApiResponse({ status: 200, description: 'Sector eliminado y métricas de clientes afectados.' })
  @ApiResponse({ status: 404, description: 'Sector no encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sectoresService.remove(id);
  }
}
