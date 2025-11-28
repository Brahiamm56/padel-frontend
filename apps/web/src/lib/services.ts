'use client';

import { createReservasService, createCanchasService, createAdminService } from '@padel/shared';

const TOKEN_KEY = 'backend_jwt_token';

const getToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

// Usar proxy local - las llamadas a /api/* se redirigen al backend via next.config.js
const baseUrl = '/api';

// Servicios configurados para web con proxy
export const reservasService = createReservasService({ getToken, baseUrl });
export const canchasService = createCanchasService({ getToken, baseUrl });
export const adminService = createAdminService({ getToken, baseUrl });
