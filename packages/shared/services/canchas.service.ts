import { Cancha, Complejo, CanchaDetalle, ClubInfo } from '../types';
import { API_CONFIG, buildUrl, buildAuthHeaders } from '../config';

export interface CanchasServiceConfig {
  getToken: () => Promise<string | null>;
  baseUrl?: string;
}

export const createCanchasService = (config: CanchasServiceConfig) => {
  const { getToken, baseUrl } = config;

  const getComplejosConCanchas = async (): Promise<Complejo[]> => {
    try {
      const token = await getToken();
      
      const response = await fetch(
        buildUrl(API_CONFIG.endpoints.canchas.list, baseUrl),
        {
          headers: buildAuthHeaders(token),
        }
      );

      if (!response.ok) {
        throw new Error('La respuesta de la red no fue exitosa');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener complejos:', error);
      return [];
    }
  };

  const getCanchaDetalle = async (
    complejoId: string, 
    canchaId: string, 
    selectedDate?: string
  ): Promise<CanchaDetalle | null> => {
    try {
      const token = await getToken();
      const endpoint = API_CONFIG.endpoints.canchas.detail(complejoId, canchaId);
      const url = selectedDate 
        ? `${buildUrl(endpoint, baseUrl)}?fecha=${selectedDate}`
        : buildUrl(endpoint, baseUrl);

      const response = await fetch(url, {
        headers: buildAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error('Error al obtener detalle de cancha');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener detalle de cancha:', error);
      return null;
    }
  };

  return {
    getComplejosConCanchas,
    getCanchaDetalle,
  };
};

export type CanchasService = ReturnType<typeof createCanchasService>;
