import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tiempoRelativo', standalone: true })
export class TiempoRelativoPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined): string {
    if (!valor) return '';
    const fecha = new Date(valor);
    const seg = Math.floor((Date.now() - fecha.getTime()) / 1000);

    if (seg < 60) return 'hace un momento';
    const min = Math.floor(seg / 60);
    if (min < 60) return `hace ${min} min`;
    const horas = Math.floor(min / 60);
    if (horas < 24) return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    const dias = Math.floor(horas / 24);
    if (dias < 7) return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
    return fecha.toLocaleDateString('es-AR');
  }
}