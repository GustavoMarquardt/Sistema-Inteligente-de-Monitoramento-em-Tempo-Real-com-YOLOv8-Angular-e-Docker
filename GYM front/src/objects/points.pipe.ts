import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'points'
})
export class PointsPipe implements PipeTransform {

  transform(points: { x: number, y: number }[]): string {
    if (!points || points.length < 2) return '';

    let path = `M ${points[0].x},${points[0].y} `;  // M (move to) é o comando para ir até o primeiro ponto
    for (let i = 1; i < points.length; i++) {
      path += `L ${points[i].x},${points[i].y} `;  // L (line to) é o comando para desenhar uma linha até o ponto
    }
    path += 'Z';  // Fecha o caminho com o comando 'Z' (fecha a forma)
    
    return path;
  }
}
