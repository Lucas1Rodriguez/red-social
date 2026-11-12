import 'multer';
import * as bcrypt from 'bcrypt';
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Usuario, UsuarioDocument } from './entities/usuario.entity';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RegistroDto } from '../auth/dto/registro.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
    private cloudinary: CloudinaryService,
  ) {}

  create(data: Partial<Usuario>) {
    return this.usuarioModel.create(data);
  }

  existe(correo: string, nombreUsuario: string) {
    return this.usuarioModel.exists({
      $or: [{ correo: correo.toLowerCase() }, { nombreUsuario }],
    });
  }

  buscarParaLogin(identificador: string) {
    return this.usuarioModel
      .findOne({
        $or: [{ correo: identificador.toLowerCase() }, { nombreUsuario: identificador }],
      })
      .select('+contrasenia');
  }

  buscarPorId(id: string) {
    return this.usuarioModel.findById(id);
  }

  async actualizarPerfil(id: string, dto: ActualizarPerfilDto, imagen?: Express.Multer.File) {
    const cambios: any = { ...dto };
    if (dto.fechaNacimiento) cambios.fechaNacimiento = new Date(dto.fechaNacimiento);
    if (imagen) {
      cambios.imagenPerfil = await this.cloudinary.subirImagen(imagen, 'red-social/perfiles');
    }

    const usuario = await this.usuarioModel.findByIdAndUpdate(id, { $set: cambios }, { new: true });
    if (!usuario) throw new NotFoundException('El usuario no existe');
    return usuario;
  }

  listar() {
    return this.usuarioModel.find().sort({ createdAt: -1 });
  }

  async crearDesdeAdmin(dto: RegistroDto, imagen?: Express.Multer.File) {
    if (dto.contrasenia !== dto.repetirContrasenia) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }
    if (await this.existe(dto.correo, dto.nombreUsuario)) {
      throw new ConflictException('El correo o nombre de usuario ya existe');
    }

    const imagenPerfil = imagen
      ? await this.cloudinary.subirImagen(imagen, 'red-social/perfiles')
      : '';
    const { repetirContrasenia, ...datos } = dto;
    const contrasenia = await bcrypt.hash(dto.contrasenia, 10);

    const usuario = await this.usuarioModel.create({
      ...datos,
      contrasenia,
      imagenPerfil,
      fechaNacimiento: new Date(dto.fechaNacimiento),
    });
    const { contrasenia: _oculta, ...resto } = usuario.toObject();
    return resto;
  }

  async cambiarEstado(id: string, activo: boolean) {
    if (!isValidObjectId(id)) throw new NotFoundException('El usuario no existe');
    const usuario = await this.usuarioModel.findByIdAndUpdate(id, { $set: { activo } }, { new: true });
    if (!usuario) throw new NotFoundException('El usuario no existe');
    return usuario;
  }
}