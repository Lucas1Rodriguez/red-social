import 'multer';
import {
  BadRequestException, Body, Controller, DefaultValuePipe, Delete, FileTypeValidator,
  Get, HttpCode, MaxFileSizeValidator, Param, ParseFilePipe, ParseIntPipe, Post,
  Query, Req, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { PostsService } from './posts.service';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto';

@Controller('publicaciones')
@UseGuards(AuthGuard)
export class PostsController {
  constructor(private posts: PostsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('imagen'))
  crear(
    @Body() dto: CrearPublicacionDto,
    @Req() req: any,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
        exceptionFactory: () =>
          new BadRequestException('La imagen debe ser JPG, PNG o WebP y pesar como máximo 5 MB'),
      }),
    )
    imagen?: Express.Multer.File,
  ) {
    return this.posts.crear(dto, req.usuario.sub, imagen);
  }

  @Get()
  listar(
    @Query('orden') orden: string = 'fecha',
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('autor') autor?: string,
  ) {
    return this.posts.listar({
      orden: orden === 'meGusta' ? 'meGusta' : 'fecha',
      offset: Math.max(offset, 0),
      limit: Math.min(Math.max(limit, 1), 50),
      autor,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  eliminar(@Param('id') id: string, @Req() req: any) {
    return this.posts.eliminar(id, req.usuario.sub, req.usuario.perfil);
  }

  @Post(':id/me-gusta')
  darMeGusta(@Param('id') id: string, @Req() req: any) {
    return this.posts.darMeGusta(id, req.usuario.sub);
  }

  @Delete(':id/me-gusta')
  quitarMeGusta(@Param('id') id: string, @Req() req: any) {
    return this.posts.quitarMeGusta(id, req.usuario.sub);
  }
}