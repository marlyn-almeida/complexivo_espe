export interface Estudiante {
  id_estudiante: number;

  cedula: string;
  nombres: string;
  apellidos: string;

  id_carrera_periodo: number;
  estado: boolean | number;
}
