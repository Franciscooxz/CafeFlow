import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PosService } from './pos.service';
import { PosController } from './pos.controller';
import { PosGateway } from './pos.gateway';

@Module({
  imports: [JwtModule.register({})],
  providers: [PosService, PosGateway],
  controllers: [PosController],
  exports: [PosGateway],
})
export class PosModule {}
