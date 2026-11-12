import {
  Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards, HttpCode, Delete
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { ComentariosService } from './comentarios.service';
import { ComentarioDto } from './dto/comentario.dto';

@Controller('publicaciones/:id/comentarios')
@UseGuards(AuthGuard)
export class ComentariosController {
  constructor(private comentarios: ComentariosService) {}

  @Get()
  listar(
    @Param('id') id: string,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    return this.comentarios.listar(id, Math.max(offset, 0), Math.min(Math.max(limit, 1), 50));
  }

  @Post()
  crear(@Param('id') id: string, @Body() dto: ComentarioDto, @Req() req: any) {
    return this.comentarios.crear(id, req.usuario.sub, dto);
  }

  @Put(':comentarioId')
  editar(
    @Param('id') id: string,
    @Param('comentarioId') comentarioId: string,
    @Body() dto: ComentarioDto,
    @Req() req: any,
  ) {
    return this.comentarios.editar(id, comentarioId, req.usuario.sub, dto);
  }

  @Delete(':comentarioId')
  @HttpCode(204)
  eliminar(
    @Param('id') id: string,
    @Param('comentarioId') comentarioId: string,
    @Req() req: any,
  ) {
    return this.comentarios.eliminar(id, comentarioId, req.usuario.sub, req.usuario.perfil);
  }
}