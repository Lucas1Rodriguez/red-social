import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

@Directive({ selector: '[appResaltar]', standalone: true })
export class ResaltarDirective {
  color = input('', { alias: 'appResaltar' });
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  @HostListener('mouseenter') entrar() {
    const color = this.color() || '#0498fae7';
    this.el.nativeElement.style.backgroundColor = color;
    this.el.nativeElement.style.setProperty('--bs-table-bg', color);
  }

  @HostListener('mouseleave') salir() {
    this.el.nativeElement.style.backgroundColor = '';
    this.el.nativeElement.style.removeProperty('--bs-table-bg');
  }
}