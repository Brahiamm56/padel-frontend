import { auth } from '../../../config/firebase';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuthToken, API_BASE_URL, fetchWithAuth } from '../../../config/api';
import { uploadImageWithProgress, generateStoragePath } from '../../../services/firebaseStorage.service';
import { CLOUDINARY_CONFIG, CLOUDINARY_UPLOAD_URL } from '../../../config/cloudinary';

/**
 * Servicio para manejar la información del usuario cliente
 */

export type UserInfo = {
  uid: string;
  nombre: string;
  apellido?: string;
  email: string;
  telefono?: string;
  fotoUrl?: string;
  role?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type UpdateProfileData = {
  nombre: string;
  apellido: string;
  telefono: string;
  fotoUrl?: string;
};

/**
 * Obtiene la información del usuario actual desde Firebase Auth y Firestore
 */
export const getCurrentUserInfo = async (): Promise<UserInfo> => {
  try {
    // Verificar token de autenticación
    const token = await getAuthToken();
    if (!token) {
      console.log('🔴 No se encontró token de autenticación');
      throw new Error('No hay usuario autenticado');
    }

    const user = auth.currentUser;

    if (!user) {
      console.log('🔴 No hay usuario activo en Firebase');
      throw new Error('No hay usuario autenticado');
    }

    console.log('✅ Usuario autenticado encontrado:', user.email);

    // Obtener datos adicionales del usuario desde Firestore
    const db = getFirestore();
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.warn('No se encontraron datos adicionales en Firestore para el usuario:', user.uid);
      return {
        uid: user.uid,
        nombre: user.displayName || 'Usuario',
        email: user.email || '',
        fotoUrl: user.photoURL || 'https://placehold.co/100x100/3498db/FFFFFF/png?text=U',
      };
    }

    const userData = userDoc.data();
    console.log('Datos del usuario desde Firestore:', userData);

    return {
      uid: user.uid,
      email: user.email || '',
      fotoUrl: userData.fotoUrl || user.photoURL || 'https://placehold.co/100x100/3498db/FFFFFF/png?text=U',
      ...userData,
    } as UserInfo;
  } catch (error) {
    console.error('Error en getCurrentUserInfo:', error);
    throw error;
  }
};

/**
 * Obtiene el perfil del usuario desde el backend Node.js
 * GET /api/users/profile
 */
export const getUserProfile = async (): Promise<UserInfo> => {
  try {
    console.log('📡 Llamando a GET /api/users/profile...');

    // Agregar timestamp para evitar caché agresivo
    const response = await fetchWithAuth(`${API_BASE_URL}/users/profile?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error del backend:', errorData);
      throw new Error(errorData.error || 'Error al obtener perfil del backend');
    }

    const data = await response.json();
    console.log('✅ Perfil obtenido del backend (RAW):', JSON.stringify(data, null, 2));

    // El backend puede devolver diferentes estructuras
    // Intentar extraer el usuario de diferentes formas
    const userData = data.user || data;
    console.log('✅ Datos del usuario extraídos:', JSON.stringify(userData, null, 2));

    // Mapear campos del backend al formato del frontend
    const mappedUser: UserInfo = {
      uid: userData.id || userData.uid,
      email: userData.email,
      nombre: userData.nombre || '',
      apellido: userData.apellido || '',
      telefono: userData.telefono || '',
      fotoUrl: userData.fotoUrl || '',
      role: userData.role || userData.rol,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };

    console.log('✅ Usuario mapeado final:', JSON.stringify(mappedUser, null, 2));
    return mappedUser;
  } catch (error) {
    console.error('🔴 Error en getUserProfile:', error);
    throw error;
  }
};

/**
 * Actualiza el perfil del usuario en el backend Node.js
 * PUT /api/users/profile
 */
export const updateUserProfileBackend = async (data: {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  fotoUrl?: string;
}): Promise<{ message: string; user: any }> => {
  try {
    console.log('📡 Llamando a PUT /api/users/profile con:', data);

    const response = await fetchWithAuth(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error del backend:', errorData);
      throw new Error(errorData.error || 'Error al actualizar perfil en el backend');
    }

    const updatedData = await response.json();
    console.log('✅ Perfil actualizado en backend:', updatedData);
    return updatedData;
  } catch (error) {
    console.error('🔴 Error en updateUserProfileBackend:', error);
    throw error;
  }
};

/**
 * Sube una imagen a Firebase Storage usando la API REST
 * @param imageUri - URI local de la imagen
 * @param folder - Carpeta en Storage (ej: 'perfiles', 'canchas')
 * @param onProgress - Callback opcional para el progreso de subida
 * @returns URL pública de descarga
 */
export const uploadImageToFirebase = async (
  imageUri: string,
  folder: string = 'perfiles',
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    console.log('📤 Subiendo imagen a Firebase Storage...');

    // Generar path único
    const storagePath = generateStoragePath(folder);

    // Usar el nuevo servicio que usa la API REST
    const downloadUrl = await uploadImageWithProgress(imageUri, storagePath, onProgress);

    console.log('✅ Imagen subida a Firebase Storage:', downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.error('🔴 Error en uploadImageToFirebase:', error);
    throw error;
  }
};

/**
 * @deprecated Esta función está DEPRECADA. NO usarla.
 * Actualiza el perfil directamente en Firestore (OBSOLETO)
 * 
 * ⚠️ IMPORTANTE: Esta función hace escrituras directas a Firebase Firestore,
 * lo cual causa problemas porque el backend ya se encarga de eso.
 * 
 * 🔧 USAR EN SU LUGAR: updateUserProfileBackend()
 * 
 * El flujo correcto es:
 * Frontend → Backend API → Firebase (el backend actualiza Firebase)
 * 
 * NO hacer:
 * Frontend → Backend API → Firebase
 *     ↓
 * Firebase (duplicado, con datos incorrectos)
 */
export const updateUserProfile = async (data: UpdateProfileData): Promise<UserInfo> => {
  console.warn('⚠️ updateUserProfile está DEPRECADO. Usa updateUserProfileBackend() en su lugar.');

  // Lanzar error para evitar uso accidental
  throw new Error(
    '❌ updateUserProfile() está deprecado. ' +
    'Usa updateUserProfileBackend() en su lugar para evitar escrituras duplicadas a Firebase.'
  );
};

/**
 * Tipo para la firma de Cloudinary
 */
export type CloudinarySignature = {
  signature: string;
  timestamp: number;
  api_key: string;
};

/**
 * Obtiene la firma de Cloudinary para subir imágenes de perfil
 * Usa unsigned upload preset para simplificar
 */
export const getUserProfileSignature = async (): Promise<CloudinarySignature> => {
  // Para unsigned uploads, no necesitamos firma real
  // Retornamos datos dummy que serán ignorados
  return {
    signature: '',
    timestamp: Date.now(),
    api_key: CLOUDINARY_CONFIG.apiKey,
  };
};

/**
 * Sube una imagen a Cloudinary usando unsigned upload
 * @param imageUri - URI local de la imagen
 * @param _signature - Firma (ignorada para unsigned uploads)
 * @returns URL pública de la imagen
 */
export const uploadImageToCloudinary = async (
  imageUri: string,
  _signature?: CloudinarySignature
): Promise<string> => {
  try {
    console.log('📤 Subiendo imagen a Cloudinary...');

    // Crear FormData para upload sin firma (unsigned upload)
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `perfil_${Date.now()}.jpg`,
    } as any);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

    // Subir a Cloudinary usando unsigned upload preset
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error de Cloudinary:', errorData);
      throw new Error(errorData.error?.message || 'Error al subir imagen a Cloudinary');
    }

    const data = await response.json();
    console.log('✅ Imagen subida a Cloudinary:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error('🔴 Error en uploadImageToCloudinary:', error);
    throw error;
  }
};
