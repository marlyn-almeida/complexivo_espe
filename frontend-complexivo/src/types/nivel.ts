export interface Nivel {
  id_nivel: number;
  nombre_nivel: string;   // "Muy Bueno", etc.
  valor_nivel: number;    // 4,3,2,1,0
  orden_nivel: number;    // 1..n
  estado: number | boolean;
}
