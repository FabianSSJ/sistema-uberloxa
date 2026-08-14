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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModulesGuard } from '../auth/guards/modules.guard';
import { RequireModule } from '../auth/decorators/modules.decorator';

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModulesGuard)
@RequireModule('clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiResponse({ status: 201, description: 'El cliente ha sido creado.' })
  @ApiResponse({ status: 404, description: 'El sector proporcionado no existe.' })
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  // La Charlie (modulo 'carreras') necesita LEER clientes para despachar, por eso se permiten ambos.
  @Get()
  @RequireModule('clientes', 'carreras')
  @ApiOperation({ summary: 'Obtener todos los clientes activos' })
  findAll() {
    return this.clientesService.findAll();
  }

  // Paginado + búsqueda en el servidor (la tabla de Clientes no baja los miles de una).
  @Get('paginado')
  @RequireModule('clientes', 'carreras')
  @ApiOperation({ summary: 'Clientes paginados con búsqueda' })
  findPaginated(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.clientesService.findPaginated(Number(page) || 1, Number(limit) || 20, search);
  }

  // Bandeja de pendientes (clientes sin código). Definido ANTES de :id para que no lo capture.
  @Get('pendientes')
  @ApiOperation({ summary: 'Clientes pendientes de completar (sin código)' })
  findPendientes() {
    return this.clientesService.findPendientes();
  }

  @Get('pendientes/count')
  @ApiOperation({ summary: 'Cantidad de clientes pendientes (para el badge)' })
  countPendientes() {
    return this.clientesService.countPendientes();
  }

  @Delete('pendientes')
  @ApiOperation({ summary: 'Eliminar masivamente todos los clientes pendientes' })
  removeAllPendientes() {
    return this.clientesService.removeAllPendientes();
  }

  @Get(':id')
  @RequireModule('clientes', 'carreras')
  @ApiOperation({ summary: 'Obtener un cliente activo por ID' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado o inactivo.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  @ApiResponse({ status: 404, description: 'Cliente o sector no encontrado.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClienteDto: UpdateClienteDto,
  ) {
    return this.clientesService.update(id, updateClienteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar lógicamente un cliente (Soft Delete)' })
  @ApiResponse({ status: 200, description: 'Cliente eliminado lógicamente.' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.remove(id);
  }
}
