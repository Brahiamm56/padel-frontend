import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { EmptyState } from '../../../components/common/EmptyState';
import { LoadingScreen } from '../../../components/common/LoadingSkeleton';
import { toggleFavorito, isFavorito } from '../../../services/favorites.service';
import { getComplejosConCanchas, type Complejo, type Cancha } from '../../canchas/services/courts.service';
import { colors } from '../../../styles/colors';
import { spacing, fontSize, borderRadius } from '../../../styles/spacing';
import { useTheme } from '../../../features/auth/contexts/ThemeContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CanchasStackParamList } from '../../navigation/UserTabNavigator';

type Props = NativeStackScreenProps<CanchasStackParamList, 'CanchasHome'>;

/**
 * Pantalla de Canchas - Vista del Cliente
 * Aquí el usuario podrá ver las canchas disponibles y hacer reservas
 */
// Habilitar animaciones de layout en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CanchasScreen = ({ navigation }: Props) => {
  const { theme } = useTheme();
  const [complejos, setComplejos] = useState<Complejo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());

  // Cargar complejos con canchas al montar el componente
  useEffect(() => {
    loadComplejos();
  }, []);

  const loadComplejos = async () => {
    try {
      console.log('🔵 Cargando complejos y canchas...');
      const data = await getComplejosConCanchas();
      console.log('🔵 Datos cargados:', data);
      setComplejos(data);
    } catch (error) {
      console.error('🔴 Error al cargar complejos:', error);
      Alert.alert('Error', 'No se pudieron cargar las canchas');
    } finally {
      setLoading(false);
    }
  };

  // Manejar búsqueda
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    console.log('Buscando:', text);
  };

  // Manejar notificaciones
  const handleNotifications = () => {
    console.log('Abriendo notificaciones...');
    navigation.navigate('Notifications');
  };

  // Manejar favoritos con animación
  const handleToggleFavorito = async (cancha: Cancha, complejo: Complejo) => {
    const favKey = `${complejo.id}-${cancha.id}`;
    
    // Animar el cambio
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    const esFavorito = await toggleFavorito({
      canchaId: cancha.id,
      complejoId: complejo.id,
      canchaNombre: cancha.nombre,
      complejoNombre: complejo.nombre,
      precioHora: cancha.precioHora,
      imagenUrl: cancha.imagenUrl,
      addedAt: new Date().toISOString(),
    });
    
    setFavoritos(prev => {
      const newSet = new Set(prev);
      if (esFavorito) {
        newSet.add(favKey);
      } else {
        newSet.delete(favKey);
      }
      return newSet;
    });
  };

  // Manejar selección de cancha
  const handleCanchaPress = (cancha: Cancha, complejo: Complejo) => {
    // Lógica del "Directorio Inteligente"
    if (complejo.isVerified) {
      // Si el complejo está verificado, navegar al detalle
      navigation.navigate('CanchaDetalle', {
        canchaId: cancha.id,
        complejoId: complejo.id
      });
    } else {
      // Si no está verificado, mostrar opción de llamar
      Alert.alert(
        'Complejo no verificado',
        `¿Quieres llamar a ${complejo.nombre} para reservar?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Llamar',
            onPress: () => {
              // Aquí iría el teléfono del complejo
              const phoneNumber = complejo.telefono || 'tel:+5491123456789'; // Placeholder
              Linking.openURL(phoneNumber);
            }
          }
        ]
      );
    }
  };


  // Renderizar tarjeta de cancha (nuevo diseño horizontal)
  const renderCanchaCard = (item: Cancha, complejo: Complejo) => {
    // Determinar disponibilidad de horarios (simulado para el diseño)
    const horariosDisponibles = item.horariosDisponibles || Math.floor(Math.random() * 6);
    
    // Determinar color y texto según disponibilidad
    let disponibilidadColor = '#4CAF50'; // Verde
    let disponibilidadIcon = '🟢';
    let disponibilidadText = `${horariosDisponibles} horarios disponibles hoy`;
    
    if (horariosDisponibles === 0) {
      disponibilidadColor = '#F44336'; // Rojo
      disponibilidadIcon = '🔴';
      disponibilidadText = 'Sin horarios disponibles hoy';
    } else if (horariosDisponibles < 3) {
      disponibilidadColor = '#FFC107'; // Amarillo
      disponibilidadIcon = '🟡';
    }
    
    // Características de la cancha (usar las que existan en los datos)
    const caracteristicas = [];
    if (item.techada) caracteristicas.push('Techada');
    if (item.iluminacion) caracteristicas.push('Iluminación LED');
    if (item.blindex) caracteristicas.push('Blindex');
    if (item.cesped) caracteristicas.push('Césped Sintético');
    
    const favKey = `${complejo.id}-${item.id}`;
    const isFav = favoritos.has(favKey);
    
    // Determinar si mostrar badge (Popular o Nuevo)
    const showPopularBadge = (item.horariosDisponibles || 0) < 2;
    
    return (
      <TouchableOpacity
        style={[styles.canchaCardHorizontal, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleCanchaPress(item, complejo)}
        activeOpacity={0.95}
      >
        {/* Imagen de la cancha con badges */}
        <View style={styles.imageWrapper}>
          {item.imagenUrl ? (
            <Image
              source={{ uri: item.imagenUrl }}
              style={styles.canchaImageHorizontal}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.canchaImageHorizontal, { backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="tennisball-outline" size={40} color="#CCCCCC" />
            </View>
          )}
          
          {/* Badge Popular/Nuevo */}
          {showPopularBadge && (
            <View style={styles.popularBadge}>
              <Ionicons name="flame" size={12} color="#FFF" />
              <Text style={styles.popularBadgeText}>Popular</Text>
            </View>
          )}
          
          {/* Bot\u00f3n de favorito */}
          <TouchableOpacity
            style={[styles.favoriteButton, isFav && styles.favoriteButtonActive]}
            onPress={(e) => {
              e.stopPropagation();
              handleToggleFavorito(item, complejo);
            }}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isFav ? "heart" : "heart-outline"} 
              size={20} 
              color={isFav ? "#FF4444" : "#FFF"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Información de la cancha */}
        <View style={styles.canchaInfoContainer}>
          {/* Header: Nombre y Precio */}
          <View style={styles.canchaHeader}>
            <Text style={[styles.canchaNameHorizontal, { color: theme.colors.text }]} numberOfLines={1}>
              {item.nombre.toUpperCase()}
            </Text>
            <Text style={[styles.canchaPriceHorizontal, { color: theme.colors.secondary }]}>
              ${item.precioHora}/hr
            </Text>
          </View>
          
          {/* Características */}
          {caracteristicas.length > 0 && (
            <View style={styles.caracteristicasContainer}>
              {caracteristicas.map((caracteristica, index) => (
                <View key={index} style={styles.caracteristicaItem}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={14} 
                    color="#4CAF50" 
                    style={{ marginRight: 4 }} 
                  />
                  <Text style={styles.caracteristicaText}>
                    {caracteristica}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Disponibilidad */}
          <View style={styles.disponibilidadContainer}>
            <View 
              style={[
                styles.puntoDisponibilidad, 
                { backgroundColor: disponibilidadColor }
              ]} 
            />
            <Text style={styles.disponibilidadText}>
              {horariosDisponibles} horarios disponibles hoy
            </Text>
          </View>
          
          {/* Botón Ver Horarios */}
          <TouchableOpacity 
            style={styles.verHorariosButton}
            onPress={() => handleCanchaPress(item, complejo)}
          >
            <Text style={styles.verHorariosText}>Ver Horarios</Text>
            <Ionicons name="arrow-forward" size={16} color="#001F5B" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Filtrar complejos según la búsqueda
  const complejosFiltrados = useMemo(() => {
    if (!searchQuery.trim()) {
      return complejos;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return complejos.filter(complejo => {
      // Verificar si el nombre del complejo coincide
      if (complejo.nombre.toLowerCase().includes(query)) {
        return true;
      }
      
      // Verificar si alguna cancha del complejo coincide
      return complejo.canchas.some(cancha => 
        cancha.nombre.toLowerCase().includes(query)
      );
    });
  }, [complejos, searchQuery]);

  // Mostrar skeleton mientras carga
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Text style={styles.loadingText}>Cargando canchas...</Text>
          </View>
        </View>
        <LoadingScreen count={4} />
      </View>
    );
  }

  // Mostrar empty state si no hay complejos o si la búsqueda no tiene resultados
  if (complejos.length === 0 || complejosFiltrados.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <SafeAreaView style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.gray500} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar canchas o complejos..."
              placeholderTextColor={colors.gray400}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </SafeAreaView>
        </View>
        <EmptyState
          icon="tennisball-outline"
          title={searchQuery ? "No se encontraron canchas" : "No hay canchas disponibles"}
          message={searchQuery ? `No hay resultados para "${searchQuery}"` : "¡Empieza a explorar las canchas disponibles!"}
          actionLabel={searchQuery ? "Limpiar búsqueda" : undefined}
          onActionPress={searchQuery ? () => setSearchQuery('') : undefined}
        />
      </View>
    );
  }

  // Renderizar la sección de información del complejo
  const renderComplejoInfo = (complejo: Complejo) => (
    <View style={[styles.complejoInfoContainer, { backgroundColor: theme.colors.surface }]}>
      {/* Primera línea: Nombre + Distancia */}
      <View style={styles.complejoHeaderRow}>
        <Text style={[styles.complejoNombre, { color: theme.colors.text }]} numberOfLines={1}>
          {complejo.nombre}
        </Text>
        
        {complejo.distancia && (
          <View style={styles.distanciaContainer}>
            <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.distanciaText, { color: theme.colors.textSecondary }]}>
              {complejo.distancia} km
            </Text>
          </View>
        )}
      </View>
      
      {/* Segunda línea: Rating + Dirección */}
      <View style={styles.complejoInfoRow}>
        {complejo.rating && (
          <>
            <View style={styles.ratingContainer}>
              <Text style={{ color: '#FFD700', marginRight: 2 }}>⭐</Text>
              <Text style={[styles.ratingValue, { color: theme.colors.text }]}>
                {complejo.rating}
              </Text>
              <Text style={[styles.reviewsText, { color: theme.colors.textSecondary }]}>
                ({complejo.reviewsCount || 0} reseñas)
              </Text>
            </View>
            
            {complejo.direccion && (
              <>
                <Text style={[styles.separador, { color: theme.colors.textSecondary }]}> • </Text>
                <Text style={[styles.direccionText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {complejo.direccion}
                </Text>
              </>
            )}
          </>
        )}
        
        {!complejo.rating && complejo.direccion && (
          <Text style={[styles.direccionText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {complejo.direccion}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Barra superior con buscador y notificaciones */}
      <View style={styles.header}>
        <SafeAreaView style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.gray500} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar canchas o complejos..."
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </SafeAreaView>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={handleNotifications}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Lista de complejos con sus canchas */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando canchas...</Text>
        </View>
      ) : complejosFiltrados.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="tennisball-outline" size={64} color={colors.gray300} />
          <Text style={styles.emptyTitle}>
            {searchQuery.trim() 
              ? `No se encontraron resultados para "${searchQuery}"`
              : "No hay canchas disponibles"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery.trim()
              ? "Intenta con otra búsqueda"
              : "Vuelve a intentarlo más tarde"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={complejosFiltrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item: complejo }) => (
            <View style={styles.complejoContainer}>
              {/* Información del complejo */}
              {renderComplejoInfo(complejo)}
              
              {/* Lista de canchas del complejo */}
              {complejo.canchas.map((cancha) => (
                <View key={cancha.id}>
                  {renderCanchaCard(cancha, complejo)}
                </View>
              ))}
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  notificationButton: {
    marginLeft: spacing.md,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  complejoContainer: {
    marginBottom: 24,
  },
  
  // Estilos para la sección de información del complejo
  complejoInfoContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  complejoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  complejoNombre: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  distanciaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanciaText: {
    fontSize: 14,
    marginLeft: 4,
  },
  complejoInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  reviewsText: {
    fontSize: 13,
  },
  separador: {
    fontSize: 13,
    marginHorizontal: 4,
  },
  direccionText: {
    fontSize: 13,
    flex: 1,
  },
  
  // Estilos para las cards de canchas (nuevo diseño horizontal)
  canchaCardHorizontal: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  disponibilidadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  puntoDisponibilidad: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  canchaImageHorizontal: {
    width: 140,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginRight: 16,
  },
  canchaInfoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  canchaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  canchaNameHorizontal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#001F5B',
    flex: 1,
    marginRight: 8,
  },
  canchaPriceHorizontal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C4D600',
  },
  caracteristicasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    marginTop: 6,
  },
  caracteristicaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  caracteristicaText: {
    fontSize: 12,
    color: '#666666',
  },
  disponibilidadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
  },
  verHorariosButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#C4D600',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verHorariosText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#001F5B',
    marginRight: 4,
  },
  
  // Estilos para imagen con badges y botón de favoritos
  imageWrapper: {
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popularBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonActive: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
  },
  
  // Estilos para estados vacíos y errores
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
  },
});

export default CanchasScreen;
