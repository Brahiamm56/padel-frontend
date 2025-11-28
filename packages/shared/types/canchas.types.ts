export interface Cancha {
  id: string;
  nombre: string;
  imagenUrl: string;
  precioHora: string;
  techada?: boolean;
  iluminacion?: boolean;
  blindex?: boolean;
  cesped?: boolean;
  horariosDisponibles?: number;
  caracteristicas?: string[];
}

export interface Complejo {
  id: string;
  nombre: string;
  canchas: Cancha[];
  isVerified?: boolean;
  telefono?: string;
  distancia?: number;
  rating?: number;
  reviewsCount?: number;
  direccion?: string;
}

export interface CanchaDetalle {
  id: string;
  nombre: string;
  complejoNombre: string;
  precioHora: string;
  imagenes?: string[];
  imagenUrl?: string;
  descripcion: string;
  caracteristicas: string[];
  esTechada?: boolean;
  vendePelotitas?: boolean;
  // Horarios de operación
  horaInicio?: string;  // Ej: "08:00"
  horaFin?: string;     // Ej: "23:00"
  // El backend puede devolver los horarios en diferentes formatos
  horariosDisponibles?: string[];  // Array de horarios libres
  horariosMaestros?: string[];     // Array de todos los horarios de la cancha
  horariosOcupados?: string[];     // Array de horarios ya reservados
  horariosReservados?: string[];   // Array de horarios con reservas confirmadas
  horariosBloqueados?: string[];   // Array de horarios bloqueados por admin
  bloqueos?: Array<{ fecha: string; hora: string }>;  // Array de bloqueos con fecha
}

export interface ClubInfo {
  id: string;
  nombre: string;
  logoUrl: string;
  direccion?: string;
  telefono?: string;
  horario?: string;
}
