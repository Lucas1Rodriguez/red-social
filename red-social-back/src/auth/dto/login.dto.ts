import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'El usuario o correo debe ser texto' })
  @IsNotEmpty({ message: 'Ingresá tu correo o nombre de usuario' })
  identificador: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'Ingresá tu contraseña' })
  contrasenia: string;
}