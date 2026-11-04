import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CrearPublicacionDto {
  @IsString({ message: 'El título debe ser texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(100, { message: 'El título no puede superar los 100 caracteres' })
  titulo: string;

  @IsString({ message: 'El mensaje debe ser texto' })
  @IsNotEmpty({ message: 'El mensaje es obligatorio' })
  @MaxLength(1000, { message: 'El mensaje no puede superar los 1000 caracteres' })
  mensaje: string;
}