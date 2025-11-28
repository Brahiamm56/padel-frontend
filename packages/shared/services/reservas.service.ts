import { 
  ReservaPayload, 
  ReservaConCancha, 
  ReservaResponse 
} from '../types';
import { API_CONFIG, buildUrl, buildAuthHeaders } from '../config';

export interface ReservasServiceConfig {
  getToken: () => Promise<string | null>;
  baseUrl?: string;
}

export const createReservasService = (config: ReservasServiceConfig) => {
  const { getToken, baseUrl } = config;

  const crearReserva = async (reservaData: ReservaPayload): Promise<ReservaResponse> => {
    try {
      const token = await getToken();
      
      const response = await fetch(
        buildUrl(API_CONFIG.endpoints.reservas.create, baseUrl),
        {
          method: 'POST',
          headers: buildAuthHeaders(token),
          body: JSON.stringify(reservaData),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        return { success: false, message: `Error del servidor: ${errorData}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error('Error al crear reserva:', error);
      return { success: false, message: error.message };
    }
  };

  const getMisReservas = async (tipo?: 'proximas' | 'anteriores'): Promise<ReservaConCancha[]> => {
    try {
      const token = await getToken();
      const url = tipo 
        ? `${buildUrl(API_CONFIG.endpoints.reservas.list, baseUrl)}?tipo=${tipo}`
        : buildUrl(API_CONFIG.endpoints.reservas.list, baseUrl);

      const response = await fetch(url, {
        headers: buildAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error('No se pudieron obtener las reservas');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener reservas:', error);
      return [];
    }
  };

  const cancelarReserva = async (reservaId: string): Promise<ReservaResponse> => {
    try {
      const token = await getToken();

      const response = await fetch(
        buildUrl(API_CONFIG.endpoints.reservas.cancel(reservaId), baseUrl),
        {
          method: 'PUT',
          headers: buildAuthHeaders(token),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        return { success: false, message: `Error del servidor: ${errorData}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error('Error al cancelar reserva:', error);
      return { success: false, message: error.message };
    }
  };

  const getReservaDetalle = async (reservaId: string): Promise<ReservaConCancha | null> => {
    try {
      const token = await getToken();

      const response = await fetch(
        buildUrl(API_CONFIG.endpoints.reservas.detail(reservaId), baseUrl),
        {
          headers: buildAuthHeaders(token),
        }
      );

      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error('Error al obtener detalle de reserva:', error);
      return null;
    }
  };

  return {
    crearReserva,
    getMisReservas,
    cancelarReserva,
    getReservaDetalle,
  };
};

export type ReservasService = ReturnType<typeof createReservasService>;
