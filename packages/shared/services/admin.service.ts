import { ReservaAdmin } from '../types';
import { API_CONFIG, buildUrl, buildAuthHeaders } from '../config';

export interface AdminServiceConfig {
  getToken: () => Promise<string | null>;
  baseUrl?: string;
}

export const createAdminService = (config: AdminServiceConfig) => {
  const { getToken, baseUrl } = config;

  const getReservasAdmin = async (): Promise<ReservaAdmin[]> => {
    try {
      const token = await getToken();

      const response = await fetch(
        buildUrl(API_CONFIG.endpoints.admin.reservas, baseUrl),
        {
          headers: buildAuthHeaders(token),
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener reservas admin');
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error al obtener reservas admin:', error);
      return [];
    }
  };

  const cancelarReservaAdmin = async (reservaId: string, motivo?: string): Promise<boolean> => {
    try {
      const token = await getToken();

      const response = await fetch(
        buildUrl(API_CONFIG.endpoints.admin.cancelarReserva(reservaId), baseUrl),
        {
          method: 'PATCH',
          headers: buildAuthHeaders(token),
          body: JSON.stringify({ motivo }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error al cancelar reserva:', error);
      return false;
    }
  };

  const confirmarReservaAdmin = async (reservaId: string): Promise<boolean> => {
    try {
      const token = await getToken();

      const response = await fetch(
        buildUrl(API_CONFIG.endpoints.admin.confirmarReserva(reservaId), baseUrl),
        {
          method: 'PATCH',
          headers: buildAuthHeaders(token),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error al confirmar reserva:', error);
      return false;
    }
  };

  return {
    getReservasAdmin,
    cancelarReservaAdmin,
    confirmarReservaAdmin,
  };
};

export type AdminService = ReturnType<typeof createAdminService>;
