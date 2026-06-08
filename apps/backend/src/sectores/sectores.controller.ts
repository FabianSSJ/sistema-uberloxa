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

@ApiTags('Sectores')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // TODO: Descomentar cuando hagamos el Login
@Controller('sectores')
export class SectoresController {
  constructor(private readonly sectoresService: SectoresService) {}

  @Post()
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
  @ApiOperation({ summary: 'Eliminar un sector y desvincular sus clientes' })
  @ApiResponse({ status: 200, description: 'Sector eliminado y métricas de clientes afectados.' })
  @ApiResponse({ status: 404, description: 'Sector no encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sectoresService.remove(id);
  }
}
