import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { AdminGuard } from '../../auth/admin.guard';
import { EstadisticasService } from './estadisticas.service';
import { RangoDto } from './dto/rango.dto';

@Controller('estadisticas')
@UseGuards(AuthGuard, AdminGuard)
export class EstadisticasController {
  constructor(private estadisticas: EstadisticasService) {}

  @Get('publicaciones-por-usuario')
  publicacionesPorUsuario(@Query() q: RangoDto) {
    return this.estadisticas.publicacionesPorUsuario(q);
  }

  @Get('comentarios')
  comentarios(@Query() q: RangoDto) {
    return this.estadisticas.comentariosPorDia(q);
  }

  @Get('comentarios-por-publicacion')
  comentariosPorPublicacion(@Query() q: RangoDto) {
    return this.estadisticas.comentariosPorPublicacion(q);
  }
}