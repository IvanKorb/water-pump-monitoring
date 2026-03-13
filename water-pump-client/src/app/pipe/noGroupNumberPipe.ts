import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'noGroupNumber',
  standalone: true,
})
export class NoGroupNumberPipe implements PipeTransform {
  transform(
    value: number | null | undefined,
    fractionDigits: number = 2,
    locale: string = 'en-US'
  ): string {
    if (value == null) return '-';

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      useGrouping: false,
    }).format(value);
  }
}