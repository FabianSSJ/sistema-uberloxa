import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ChoferesService } from './choferes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('choferes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChoferesController {
  constructor(private readonly choferesService: ChoferesService) {}

  @Get()
  // Todos los roles logueados (SUPERADMIN, ADMIN, CHARLIE) pueden ver
  findAll() {
    return this.choferesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.choferesService.findOne(+id);
  }

  @Post()
  @Roles('SUPERADMIN')
  create(@Body() createChoferDto: { nombre: string; telefono?: string }) {
    return this.choferesService.create(createChoferDto);
  }

  @Patch(':id')
  @Roles('SUPERADMIN')
  update(@Param('id') id: string, @Body() updateChoferDto: { nombre?: string; telefono?: string; activo?: boolean }) {
    return this.choferesService.update(+id, updateChoferDto);
  }

  @Delete(':id')
  @Roles('SUPERADMIN')
  remove(@Param('id') id: string) {
    return this.choferesService.remove(+id);
  }
}
