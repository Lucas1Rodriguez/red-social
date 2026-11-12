import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Comentario, ComentarioDocument } from './entities/comentario.entity';
import { Publicacion, PublicacionDocument } from '../entities/post.entity';
import { ComentarioDto } from './dto/comentario.dto';

const AUTOR = 'nombreUsuario imagenPerfil';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectModel(Comentario.name) private model: Model<ComentarioDocument>,
    @InjectModel(Publicacion.name) private pubModel: Model<PublicacionDocument>,
  ) {}

  private async verificarPublicacion(id: string) {
    if (!isValidObjectId(id) || !(await this.pubModel.exists({ _id: id, activa: true }))) {
      throw new NotFoundException('La publicación no existe');
    }
  }

  async listar(publicacionId: string, offset: number, limit: number) {
    await this.verificarPublicacion(publicacionId);
    const filtro = { publicacion: new Types.ObjectId(publicacionId) };
    const [items, total] = await Promise.all([
      this.model
        .find(filtro)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate('autor', AUTOR)
        .lean(),
      this.model.countDocuments(filtro),
    ]);
    return { items, total, offset, limit };
  }

  async crear(publicacionId: string, usuarioId: string, dto: ComentarioDto) {
    await this.verificarPublicacion(publicacionId);
    const comentario = await this.model.create({
      publicacion: new Types.ObjectId(publicacionId),
      autor: new Types.ObjectId(usuarioId),
      mensaje: dto.mensaje,
    });
    return comentario.populate('autor', AUTOR);
  }

  async editar(publicacionId: string, comentarioId: string, usuarioId: string, dto: ComentarioDto) {
    await this.verificarPublicacion(publicacionId);
    if (!isValidObjectId(comentarioId)) throw new NotFoundException('El comentario no existe');

    const comentario = await this.model.findOne({
      _id: new Types.ObjectId(comentarioId),
      publicacion: new Types.ObjectId(publicacionId),
    });
    if (!comentario) throw new NotFoundException('El comentario no existe');
    if (comentario.autor.toString() !== usuarioId) {
      throw new ForbiddenException('Solo podés editar tus propios comentarios');
    }

    comentario.mensaje = dto.mensaje;
    comentario.modificado = true;
    await comentario.save();
    return comentario.populate('autor', AUTOR);
  }

  async eliminar(publicacionId: string, comentarioId: string, usuarioId: string, perfil: string) {
    await this.verificarPublicacion(publicacionId);
    if (!isValidObjectId(comentarioId)) throw new NotFoundException('El comentario no existe');

    const comentario = await this.model.findOne({
      _id: new Types.ObjectId(comentarioId),
      publicacion: new Types.ObjectId(publicacionId),
    });
    if (!comentario) throw new NotFoundException('El comentario no existe');
    if (comentario.autor.toString() !== usuarioId && perfil !== 'administrador') {
      throw new ForbiddenException('No podés eliminar este comentario');
    }
    await comentario.deleteOne();
  }

}