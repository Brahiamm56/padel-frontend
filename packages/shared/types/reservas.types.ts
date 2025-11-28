export type EstadoReserva = 'Confirmada' | 'Cancelada' | 'Pendiente';

export interface ReservaAdmin {
  id: string;
  complejoId: string;
  canchaId: string;
  canchaNombre: string;
  canchaImagen: string;
  fecha: string; // "2025-10-21"
  hora: string; // "21:00"
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  usuarioTelefono: string;
  estado: EstadoReserva;
  fechaCreacion: Date | { _seconds: number; _nanoseconds: number };
}

export interface ReservaConCancha {
  id: string;
  complejoId: string;
  canchaId: string;
  canchaNombre: string;
  canchaImagenUrl?: string;
  fecha: string; // "2025-10-21"
  hora: string; // "21:00"
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  estado: EstadoReserva;
  createdAt: Date | { _seconds: number; _nanoseconds: number };
  updatedAt: Date | { _seconds: number; _nanoseconds: number };
  confirmedAt?: Date | { _seconds: number; _nanoseconds: number };
  confirmedBy?: string;
  canceledAt?: Date | { _seconds: number; _nanoseconds: number };
  canceledBy?: string;
  motivo?: string;
}

export interface CanchaUnica {
  id: string;
  nombre: string;
  imagen: string;
}

export interface ReservaPayload {
  complejoId: string;
  canchaId: string;
  fecha: string; // ej: "2025-10-16"
  hora: string;  // ej: "19:00"
  usuarioId: string;
}

export interface ReservaResponse {
  success: boolean;
  data?: ReservaConCancha;
  message?: string;
}
