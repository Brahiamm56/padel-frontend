import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'user_favorites';

export interface FavoritoCancha {
  canchaId: string;
  complejoId: string;
  canchaNombre: string;
  complejoNombre: string;
  precioHora: string;
  imagenUrl?: string;
  addedAt: string;
}

/**
 * Obtener todas las canchas favoritas del usuario
 */
export const getFavoritos = async (): Promise<FavoritoCancha[]> => {
  try {
    const favoritosJson = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!favoritosJson) return [];
    return JSON.parse(favoritosJson);
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    return [];
  }
};

/**
 * Verificar si una cancha está en favoritos
 */
export const isFavorito = async (canchaId: string, complejoId: string): Promise<boolean> => {
  try {
    const favoritos = await getFavoritos();
    return favoritos.some(
      (fav) => fav.canchaId === canchaId && fav.complejoId === complejoId
    );
  } catch (error) {
    console.error('Error al verificar favorito:', error);
    return false;
  }
};

/**
 * Agregar una cancha a favoritos
 */
export const addFavorito = async (favorito: FavoritoCancha): Promise<boolean> => {
  try {
    const favoritos = await getFavoritos();
    
    // Verificar si ya existe
    const exists = favoritos.some(
      (fav) => fav.canchaId === favorito.canchaId && fav.complejoId === favorito.complejoId
    );
    
    if (exists) {
      console.log('La cancha ya está en favoritos');
      return false;
    }
    
    // Agregar con timestamp
    const nuevoFavorito = {
      ...favorito,
      addedAt: new Date().toISOString(),
    };
    
    favoritos.unshift(nuevoFavorito); // Agregar al inicio
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritos));
    
    console.log('✅ Cancha agregada a favoritos');
    return true;
  } catch (error) {
    console.error('Error al agregar favorito:', error);
    return false;
  }
};

/**
 * Remover una cancha de favoritos
 */
export const removeFavorito = async (canchaId: string, complejoId: string): Promise<boolean> => {
  try {
    const favoritos = await getFavoritos();
    const nuevosFavoritos = favoritos.filter(
      (fav) => !(fav.canchaId === canchaId && fav.complejoId === complejoId)
    );
    
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(nuevosFavoritos));
    console.log('✅ Cancha removida de favoritos');
    return true;
  } catch (error) {
    console.error('Error al remover favorito:', error);
    return false;
  }
};

/**
 * Toggle favorito (agregar si no existe, remover si existe)
 */
export const toggleFavorito = async (favorito: FavoritoCancha): Promise<boolean> => {
  try {
    const esFavorito = await isFavorito(favorito.canchaId, favorito.complejoId);
    
    if (esFavorito) {
      await removeFavorito(favorito.canchaId, favorito.complejoId);
      return false; // Ahora NO es favorito
    } else {
      await addFavorito(favorito);
      return true; // Ahora SÍ es favorito
    }
  } catch (error) {
    console.error('Error al toggle favorito:', error);
    return false;
  }
};
