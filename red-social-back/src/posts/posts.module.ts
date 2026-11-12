import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { ComentariosController } from './comentarios/comentarios.controller';
import { ComentariosService } from './comentarios/comentarios.service';
import { EstadisticasController } from './estadisticas/estadisticas.controller';
import { EstadisticasService } from './estadisticas/estadisticas.service';
import { Publicacion, PublicacionSchema } from './entities/post.entity';
import { Comentario, ComentarioSchema } from './comentarios/entities/comentario.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema },
    ]),
    AuthModule,
    CloudinaryModule,
  ],
  controllers: [PostsController, ComentariosController, EstadisticasController],
  providers: [PostsService, ComentariosService, EstadisticasService],
})
export class PostsModule {}