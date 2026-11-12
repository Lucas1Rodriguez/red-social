import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'iniciales', standalone: true })
export class InicialesPipe implements PipeTransform {
  transform(nombre: string | null | undefined, apellido?: string | null): string {
    return [nombre, apellido]
      .filter((p): p is string => !!p && p.trim().length > 0)
      .map((p) => p.trim()[0].toUpperCase())
      .join('')
      .substring(0, 2);
  }
}