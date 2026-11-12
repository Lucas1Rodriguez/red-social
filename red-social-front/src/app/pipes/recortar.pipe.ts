import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'recortar', standalone: true })
export class RecortarPipe implements PipeTransform {
  transform(texto: string | null | undefined, limite = 100, sufijo = '…'): string {
    if (!texto) return '';
    return texto.length <= limite ? texto : texto.substring(0, limite).trimEnd() + sufijo;
  }
}