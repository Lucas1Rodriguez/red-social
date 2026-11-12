import { IsDateString, IsOptional } from 'class-validator';

export class RangoDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha "desde" no es válida (usá AAAA-MM-DD)' })
  desde?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha "hasta" no es válida (usá AAAA-MM-DD)' })
  hasta?: string;
}