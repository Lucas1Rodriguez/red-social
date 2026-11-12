import { BadRequestException, ConflictException, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import 'multer';

@Injectable()
export class AuthService {
  constructor(
    private usuarios: UsuariosService,
    private jwt: JwtService,
    private cloudinary: CloudinaryService,
  ) {}

  async registro(dto: RegistroDto, imagen?: Express.Multer.File) {
    if (dto.contrasenia !== dto.repetirContrasenia) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }
    if (await this.usuarios.existe(dto.correo, dto.nombreUsuario)) {
      throw new ConflictException('El correo o nombre de usuario ya existe');
    }

    const imagenPerfil = imagen
      ? await this.cloudinary.subirImagen(imagen, 'red-social/perfiles')
      : '';

    const { repetirContrasenia, ...datos } = dto;
    const contrasenia = await bcrypt.hash(dto.contrasenia, 10);
    const usuario = await this.usuarios.create({
      ...datos,
      contrasenia,
      imagenPerfil,
      fechaNacimiento: new Date(dto.fechaNacimiento),
    });

    return this.respuesta(usuario);
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuarios.buscarParaLogin(dto.identificador);
    const ok = usuario && (await bcrypt.compare(dto.contrasenia, usuario.contrasenia));
    if (!ok) throw new UnauthorizedException('Credenciales incorrectas');

    if (usuario.activo === false) {
      throw new ForbiddenException('Tu cuenta está deshabilitada. Contactá a un administrador.');
    }

    return this.respuesta(usuario);
  }

  private respuesta(usuario: any) {
    const { contrasenia, ...datos } = usuario.toObject();
    const token = this.jwt.sign({ sub: datos._id, perfil: datos.perfil });
    return { token, usuario: datos };
  }

  async autorizar(id: string) {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario || usuario.activo === false) {
      throw new UnauthorizedException('El usuario no existe o está deshabilitado');
    }
    return { usuario };
  }

  async refrescar(payload: { sub: string; perfil: string }) {
    const usuario = await this.usuarios.buscarPorId(payload.sub);
    if (!usuario || usuario.activo === false) {
      throw new UnauthorizedException('El usuario no existe o está deshabilitado');
    }
    return { token: this.jwt.sign({ sub: payload.sub, perfil: payload.perfil }) };
  }
}