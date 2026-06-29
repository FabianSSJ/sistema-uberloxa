import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SectoresModule } from './sectores/sectores.module';
import { ClientesModule } from './clientes/clientes.module';
import { MarcasModule } from './marcas/marcas.module';
import { ModelosModule } from './modelos/modelos.module';
import { UnidadesModule } from './unidades/unidades.module';
import { CarrerasModule } from './carreras/carreras.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,   // disponible en toda la app sin re-importar
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    SectoresModule,
    ClientesModule,
    MarcasModule,
    ModelosModule,
    UnidadesModule,
    CarrerasModule,
    UsuariosModule,
    EstadisticasModule,
  ],
})
export class AppModule {}
