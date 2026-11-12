import 'multer';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Publicacion, PublicacionDocument } from './entities/post.entity';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Publicacion.name) private model: Model<PublicacionDocument>, private cloudinary: CloudinaryService) {}

  async crear(dto: CrearPublicacionDto, autorId: string, imagen?: Express.Multer.File) {
    const url = imagen ? await this.cloudinary.subirImagen(imagen, 'red-social/publicaciones'): '';
    const pub = await this.model.create({ ...dto, imagen: url, autor: autorId });
    return pub.populate('autor', 'nombreUsuario imagenPerfil');
  }

  async listar(opts: { orden: 'fecha' | 'meGusta'; offset: number; limit: number; autor?: string }) {
    const filtro: any = { activa: true };
    if (opts.autor) {
      filtro.autor = { $in: [new Types.ObjectId(opts.autor), opts.autor] };
    }

    const pipeline: any[] = [
      { $match: filtro },
      { $addFields: { cantidadMeGusta: { $size: '$meGusta' } } },
      { $sort: opts.orden === 'meGusta' ? { cantidadMeGusta: -1, createdAt: -1 } : { createdAt: -1 } },
      { $skip: opts.offset },
      { $limit: opts.limit },
    ];

    const [items, total] = await Promise.all([
      this.model.aggregate(pipeline),
      this.model.countDocuments(filtro),
    ]);
    await this.model.populate(items, { path: 'autor', select: 'nombreUsuario imagenPerfil' });
    return { items, total, offset: opts.offset, limit: opts.limit };
  }

  async eliminar(id: string, usuarioId: string, perfil: string) {
    const pub = await this.model.findOne({ _id: id, activa: true });
    if (!pub) throw new NotFoundException('La publicación no existe');
    if (pub.autor.toString() !== usuarioId && perfil !== 'administrador') {
      throw new ForbiddenException('No podés eliminar esta publicación');
    }
    pub.activa = false;
    await pub.save();
  }

  async darMeGusta(id: string, usuarioId: string) {
    const pub = await this.model.findOneAndUpdate(
      { _id: id, activa: true },
      { $addToSet: { meGusta: usuarioId } },
      { new: true },
    );
    if (!pub) throw new NotFoundException('La publicación no existe');
    return { meGusta: pub.meGusta.length };
  }

  async quitarMeGusta(id: string, usuarioId: string) {
    const existe = await this.model.exists({ _id: id, activa: true, meGusta: usuarioId });
    if (!existe) throw new NotFoundException('No habías dado me gusta a esta publicación');
    const pub = await this.model.findByIdAndUpdate(id, { $pull: { meGusta: usuarioId } }, { new: true });
    return { meGusta: pub!.meGusta.length };
  }

  async obtener(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('La publicación no existe');
    const pub = await this.model
      .findOne({ _id: id, activa: true })
      .populate('autor', 'nombreUsuario imagenPerfil')
      .lean();
    if (!pub) throw new NotFoundException('La publicación no existe');
    return pub;
  }
}