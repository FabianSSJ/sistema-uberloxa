import { Module } from '@nestjs/common';
import { ChoferesController } from './choferes.controller';
import { ChoferesService } from './choferes.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChoferesController],
  providers: [ChoferesService]
})
export class ChoferesModule {}
