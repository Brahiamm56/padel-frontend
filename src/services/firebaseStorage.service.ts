import { auth } from '../config/firebase';

const FIREBASE_STORAGE_BUCKET = 'northpadel-5a21e.appspot.com';

export type UploadProgressCallback = (progress: number) => void;

/**
 * Sube una imagen a Firebase Storage usando la API REST
 * Esto evita los problemas del SDK JavaScript con React Native/Expo
 * 
 * @param imageUri - URI local de la imagen (file:// o content://)
 * @param storagePath - Path dentro del bucket (ej: 'perfiles/user123.jpg')
 * @param onProgress - Callback opcional para progreso
 * @returns URL pública de descarga
 */
export const uploadImageToStorage = async (
  imageUri: string,
  storagePath: string,
  onProgress?: UploadProgressCallback
): Promise<string> => {
  try {
    console.log('📤 Iniciando subida a Firebase Storage...');
    console.log('📍 Path:', storagePath);

    // 1. Verificar que el usuario está autenticado
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    // 2. Obtener el token de Firebase Auth
    const idToken = await user.getIdToken(true);
    console.log('🔐 Token obtenido correctamente');

    // 3. Leer el archivo y convertir a base64
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`No se pudo cargar la imagen local: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log('📦 Blob creado:', blob.size, 'bytes, tipo:', blob.type);

    // 4. Convertir blob a base64
    const base64Data = await blobToBase64(blob);
    
    // 5. Detectar el content type
    const contentType = blob.type || 'image/jpeg';
    
    // 6. Codificar el path para la URL
    const encodedPath = encodeURIComponent(storagePath);
    
    // 7. URL de la API REST de Firebase Storage
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/${encodedPath}`;

    console.log('🌐 URL de subida:', uploadUrl);

    // Notificar progreso inicial
    if (onProgress) onProgress(10);

    // 8. Hacer la petición de subida
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Firebase ${idToken}`,
        'Content-Type': contentType,
      },
      body: blob, // Enviamos el blob directamente
    });

    if (onProgress) onProgress(70);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Error en respuesta de Firebase:', uploadResponse.status, errorText);
      throw new Error(`Error al subir imagen: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Subida completada:', uploadResult);

    if (onProgress) onProgress(90);

    // 9. Construir la URL de descarga pública
    const downloadToken = uploadResult.downloadTokens;
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/${encodedPath}?alt=media&token=${downloadToken}`;

    console.log('🔗 URL de descarga:', downloadUrl);
    if (onProgress) onProgress(100);

    return downloadUrl;
  } catch (error: any) {
    console.error('❌ Error en uploadImageToStorage:', error);
    throw error;
  }
};

/**
 * Convierte un Blob a base64
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remover el prefijo "data:image/jpeg;base64," si existe
      const base64Data = base64String.split(',')[1] || base64String;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Método alternativo usando XMLHttpRequest para mejor soporte de progreso
 */
export const uploadImageWithProgress = async (
  imageUri: string,
  storagePath: string,
  onProgress?: UploadProgressCallback
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('📤 Iniciando subida con progreso...');
      console.log('📍 Path:', storagePath);

      // 1. Verificar autenticación
      const user = auth.currentUser;
      if (!user) {
        reject(new Error('No hay usuario autenticado'));
        return;
      }

      // 2. Obtener token
      const idToken = await user.getIdToken(true);
      console.log('🔐 Usuario autenticado:', user.email);

      // 3. Leer imagen
      const response = await fetch(imageUri);
      if (!response.ok) {
        reject(new Error('No se pudo cargar la imagen local'));
        return;
      }

      const blob = await response.blob();
      console.log('📦 Blob:', blob.size, 'bytes');

      // 4. Preparar URL
      const encodedPath = encodeURIComponent(storagePath);
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/${encodedPath}`;

      // 5. Crear XMLHttpRequest
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl, true);
      xhr.setRequestHeader('Authorization', `Firebase ${idToken}`);
      xhr.setRequestHeader('Content-Type', blob.type || 'image/jpeg');

      // 6. Manejar progreso
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 90);
          onProgress(progress);
        }
      };

      // 7. Manejar respuesta
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            const downloadToken = result.downloadTokens;
            const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/${encodedPath}?alt=media&token=${downloadToken}`;
            
            console.log('✅ Subida completada!');
            if (onProgress) onProgress(100);
            resolve(downloadUrl);
          } catch (e) {
            reject(new Error('Error parseando respuesta de Firebase'));
          }
        } else {
          console.error('❌ Error HTTP:', xhr.status, xhr.responseText);
          reject(new Error(`Error al subir: ${xhr.status} - ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => {
        console.error('❌ Error de red en XHR');
        reject(new Error('Error de red al subir imagen'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Timeout al subir imagen'));
      };

      // 8. Enviar
      xhr.send(blob);

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Genera un nombre de archivo único
 */
export const generateStoragePath = (
  folder: string,
  prefix: string = 'img',
  extension: string = 'jpg'
): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${folder}/${prefix}_${timestamp}_${random}.${extension}`;
};
