import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Publicacion, PublicacionSchema } from './entities/post.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Publicacion.name, schema: PublicacionSchema }]),
    AuthModule,
    CloudinaryModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}