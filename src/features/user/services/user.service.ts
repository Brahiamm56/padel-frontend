import { auth } from '../../../config/firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { API_BASE_URL, getAuthToken } from '../../../config/api';

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
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type UpdateProfileData = {
  nombre: string;
  apellido: string;
  telefono: string;
  fotoUrl?: string;
};

export type CloudinarySignature = {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
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
 * Obtiene la firma de Cloudinary para subir imágenes de perfil
 */
export const getUserProfileSignature = async (): Promise<CloudinarySignature> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No hay usuario autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/users/upload-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error obteniendo firma: ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Firma de Cloudinary obtenida');
    return data;
  } catch (error) {
    console.error('🔴 Error en getUserProfileSignature:', error);
    throw error;
  }
};

/**
 * Sube una imagen a Cloudinary usando la firma del backend
 */
export const uploadImageToCloudinary = async (
  imageUri: string,
  signature: CloudinarySignature
): Promise<string> => {
  try {
    const formData = new FormData();
    
    // Preparar el archivo de imagen
    const filename = imageUri.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    } as any);
    
    formData.append('signature', signature.signature);
    formData.append('timestamp', signature.timestamp.toString());
    formData.append('api_key', signature.apiKey);
    formData.append('folder', signature.folder);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;
    
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error subiendo imagen: ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Imagen subida a Cloudinary:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error('🔴 Error en uploadImageToCloudinary:', error);
    throw error;
  }
};

/**
 * Actualiza el perfil del usuario en el backend
 */
export const updateUserProfile = async (data: UpdateProfileData): Promise<UserInfo> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No hay usuario autenticado');
    }

    console.log('📤 Actualizando perfil:', data);

    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error actualizando perfil: ${errorData}`);
    }

    const updatedUser = await response.json();
    console.log('✅ Perfil actualizado:', updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('🔴 Error en updateUserProfile:', error);
    throw error;
  }
};
