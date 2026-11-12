import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ComentarioDocument = HydratedDocument<Comentario>;

@Schema({ timestamps: true })
export class Comentario {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Publicacion', required: true, index: true })
  publicacion: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Usuario', required: true })
  autor: Types.ObjectId;

  @Prop({ required: true }) mensaje: string;

  @Prop({ default: false }) modificado: boolean;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);