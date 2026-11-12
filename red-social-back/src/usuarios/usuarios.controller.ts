import 'multer';
import { BadRequestException, Body, Controller, FileTypeValidator, MaxFileSizeValidator, ParseFilePipe, Put, Req, UploadedFile, UseGuards, UseInterceptors, 
  Delete, Get, Post, Param, HttpCode } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { UsuariosService } from './usuarios.service';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { AdminGuard } from '../auth/admin.guard';
import { RegistroDto } from '../auth/dto/registro.dto';

@Controller('usuarios')
@UseGuards(AuthGuard)
export class UsuariosController {
  constructor(private usuarios: UsuariosService) {}

  @Put('perfil')
  @UseInterceptors(FileInterceptor('imagenPerfil'))
  actualizarPerfil(
    @Body() dto: ActualizarPerfilDto,
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
    return this.usuarios.actualizarPerfil(req.usuario.sub, dto, imagen);
  }

  @Get()
  @UseGuards(AdminGuard)
  listar() {
    return this.usuarios.listar();
  }

  @Post()
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('imagenPerfil'))
  crear(
    @Body() dto: RegistroDto,
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
    return this.usuarios.crearDesdeAdmin(dto, imagen);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(200)
  deshabilitar(@Param('id') id: string, @Req() req: any) {
    if (id === req.usuario.sub) {
      throw new BadRequestException('No podés deshabilitar tu propia cuenta');
    }
    return this.usuarios.cambiarEstado(id, false);
  }

  @Post(':id/alta')
  @UseGuards(AdminGuard)
  @HttpCode(200)
  habilitar(@Param('id') id: string) {
    return this.usuarios.cambiarEstado(id, true);
  }

}