import { auth } from '../../../config/firebase';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuthToken } from '../../../config/api';
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
 * Actualiza el perfil del usuario directamente en Firestore
 */
export const updateUserProfile = async (data: UpdateProfileData): Promise<UserInfo> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    console.log('📤 Actualizando perfil en Firestore:', data);

    const db = getFirestore();
    const userDocRef = doc(db, 'users', user.uid);
    
    // Preparar datos para actualizar
    const updateData = {
      nombre: data.nombre,
      apellido: data.apellido,
      telefono: data.telefono,
      ...(data.fotoUrl && { fotoUrl: data.fotoUrl }),
      updatedAt: new Date(),
    };

    // Actualizar en Firestore (merge: true para no sobrescribir otros campos)
    await setDoc(userDocRef, updateData, { merge: true });

    // Obtener datos actualizados
    const updatedDoc = await getDoc(userDocRef);
    const updatedData = updatedDoc.data();

    const updatedUser: UserInfo = {
      uid: user.uid,
      email: user.email || '',
      nombre: updatedData?.nombre || data.nombre,
      apellido: updatedData?.apellido || data.apellido,
      telefono: updatedData?.telefono || data.telefono,
      fotoUrl: updatedData?.fotoUrl || data.fotoUrl,
      updatedAt: new Date(),
    };

    console.log('✅ Perfil actualizado en Firestore:', updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('🔴 Error en updateUserProfile:', error);
    throw error;
  }
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
