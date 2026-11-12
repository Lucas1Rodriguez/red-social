import 'multer';
import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  HttpCode,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('registro')
  @UseInterceptors(FileInterceptor('imagenPerfil'))
  registro(
    @Body() dto: RegistroDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
        exceptionFactory: () =>
          new BadRequestException(
            'La imagen debe ser JPG, PNG o WebP y pesar como máximo 5 MB',
          ),
      }),
    )
    imagen?: Express.Multer.File,
  ) {
    return this.auth.registro(dto, imagen);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }


  @Post('autorizar')
    @HttpCode(200)
    @UseGuards(AuthGuard)
    autorizar(@Req() req: any) {
      return this.auth.autorizar(req.usuario.sub);
  }

  @Post('refrescar')
    @HttpCode(200)
    @UseGuards(AuthGuard)
    refrescar(@Req() req: any) {
      return this.auth.refrescar(req.usuario);
  }

}