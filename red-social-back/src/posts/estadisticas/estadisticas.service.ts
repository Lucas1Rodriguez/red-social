import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Publicacion, PublicacionDocument } from '../entities/post.entity';
import { Comentario, ComentarioDocument } from '../comentarios/entities/comentario.entity';
import { RangoDto } from './dto/rango.dto';

const ZONA = 'America/Argentina/Buenos_Aires';

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectModel(Publicacion.name) private pubModel: Model<PublicacionDocument>,
    @InjectModel(Comentario.name) private comModel: Model<ComentarioDocument>,
  ) {}

  private rango(q: RangoDto) {
    const hoy = new Date().toISOString().substring(0, 10);
    const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().substring(0, 10);
    const desde = new Date(`${(q.desde ?? hace30).substring(0, 10)}T00:00:00.000-03:00`);
    const hasta = new Date(`${(q.hasta ?? hoy).substring(0, 10)}T23:59:59.999-03:00`);
    if (desde > hasta) throw new BadRequestException('La fecha "desde" no puede ser posterior a "hasta"');
    return { desde, hasta };
  }

  async publicacionesPorUsuario(q: RangoDto) {
    const { desde, hasta } = this.rango(q);
    return this.pubModel.aggregate([
      { $match: { activa: true, createdAt: { $gte: desde, $lte: hasta } } },
      { $group: { _id: '$autor', cantidad: { $sum: 1 } } },
      { $addFields: { usuarioId: { $toObjectId: '$_id' } } },
      { $lookup: { from: 'usuarios', localField: 'usuarioId', foreignField: '_id', as: 'u' } },
      {
        $project: {
          _id: 0,
          usuario: { $ifNull: [{ $arrayElemAt: ['$u.nombreUsuario', 0] }, 'Desconocido'] },
          cantidad: 1,
        },
      },
      { $sort: { cantidad: -1 } },
    ]);
  }

  async comentariosPorDia(q: RangoDto) {
    const { desde, hasta } = this.rango(q);
    const items = await this.comModel.aggregate([
      { $match: { createdAt: { $gte: desde, $lte: hasta } } },
      { $lookup: { from: this.pubModel.collection.name, localField: 'publicacion', foreignField: '_id', as: 'pub' } },
      { $match: { 'pub.activa': true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: ZONA } },
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, fecha: '$_id', cantidad: 1 } },
    ]);
    return { total: items.reduce((s, i) => s + i.cantidad, 0), items };
  }

  async comentariosPorPublicacion(q: RangoDto) {
    const { desde, hasta } = this.rango(q);
    return this.comModel.aggregate([
      { $match: { createdAt: { $gte: desde, $lte: hasta } } },
      { $group: { _id: '$publicacion', cantidad: { $sum: 1 } } },
      { $lookup: { from: this.pubModel.collection.name, localField: '_id', foreignField: '_id', as: 'pub' } },
      { $match: { 'pub.activa': true } },
      { $project: { _id: 0, publicacion: { $arrayElemAt: ['$pub.titulo', 0] }, cantidad: 1 } },
      { $sort: { cantidad: -1 } },
      { $limit: 10 },
    ]);
  }
}