/**
 * CanchaDetalleScreen
 * 
 * Pantalla de detalle de cancha que muestra:
 * - Información de la cancha (nombre, descripción, precio, imágenes)
 * - Selector de fecha (próximos 7 días)
 * - Horarios disponibles (actualizado en tiempo real según reservas existentes)
 * - Botón para confirmar reserva
 * 
 * Conectado a servicios reales:
 * - canchasService.getCanchaDetalle(): Obtiene detalles y disponibilidad
 * - reservasService.crearReserva(): Crea nueva reserva en el backend
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCanchaDetalle } from '../../canchas/services/courts.service';
import { crearReserva } from '../../reservas/services/reservations.service';
import { colors } from '../../../styles/colors';
import { spacing, fontSize, borderRadius } from '../../../styles/spacing';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../auth/contexts/AuthContext';

const { width } = Dimensions.get('window');

const CanchaDetalleScreen = ({ route, navigation }: any) => {
  const { complejoId, canchaId } = route.params;
  const { user } = useAuth();

  const [canchaDetalle, setCanchaDetalle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado para el botón de confirmar
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duracionSeleccionada, setDuracionSeleccionada] = useState<number>(1);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<{
    horaInicio: string;
    horaFin: string;
  } | null>(null);

  // Generar los próximos 20 días para el selector de fechas
  const dates = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => {
      const date = addDays(new Date(), i);
      return {
        fullDate: format(date, 'yyyy-MM-dd'),
        dayName: format(date, 'EEE', { locale: es }),
        dayNumber: format(date, 'd'),
        month: format(date, 'MMM', { locale: es }),
      };
    });
  }, []);

  // Efecto para cargar los detalles de la cancha cada vez que la fecha cambia
  useEffect(() => {
    const loadDetalles = async () => {
      setLoading(true);
      setSelectedTime(null); // Resetea la hora seleccionada al cambiar de día
      try {
        console.log('🔍 Cargando detalles de cancha:', { complejoId, canchaId, selectedDate });
        const data = await getCanchaDetalle(complejoId, canchaId, selectedDate);
        console.log('📦 Datos recibidos del backend:', JSON.stringify(data, null, 2));
        setCanchaDetalle(data);
      } catch (error: any) {
        console.error('❌ Error al cargar detalles:', error);
        Alert.alert('Error', 'No se pudieron cargar los detalles de la cancha.');
      } finally {
        setLoading(false);
      }
    };

    loadDetalles();
  }, [complejoId, canchaId, selectedDate]);
  
  // Función auxiliar para generar horarios desde horaInicio hasta horaFin
  const generarHorariosMaestros = (horaInicio: string, horaFin: string): string[] => {
    const horarios: string[] = [];
    const [inicioHora] = horaInicio.split(':').map(Number);
    let [finHora] = horaFin.split(':').map(Number);
    
    // Si horaFin es 00:00 (medianoche), tratarlo como hora 24 para el loop
    if (finHora === 0) {
      finHora = 24;
    }
    
    // Si finHora < inicioHora, significa que cruza medianoche (ej: 14:00 a 02:00)
    if (finHora < inicioHora) {
      // Generar desde inicioHora hasta 24 (medianoche)
      for (let hora = inicioHora; hora <= 24; hora++) {
        const horaFormateada = hora === 24 ? '00' : hora.toString().padStart(2, '0');
        horarios.push(`${horaFormateada}:00`);
      }
      // Luego generar desde 01:00 hasta finHora
      for (let hora = 1; hora <= finHora; hora++) {
        horarios.push(`${hora.toString().padStart(2, '0')}:00`);
      }
    } else {
      // Caso normal: no cruza medianoche
      for (let hora = inicioHora; hora <= finHora; hora++) {
        const horaFormateada = hora === 24 ? '00' : hora.toString().padStart(2, '0');
        horarios.push(`${horaFormateada}:00`);
      }
    }
    
    return horarios;
  };

  // Calcular los horarios disponibles filtrando los ocupados
  const horariosDisponibles = useMemo(() => {
    if (!canchaDetalle) {
      console.log('⚠️ No hay canchaDetalle');
      return [];
    }
    
    console.log('🔍 Estructura de canchaDetalle:', {
      tieneHorariosDisponibles: !!canchaDetalle.horariosDisponibles,
      tieneHorariosMaestros: !!canchaDetalle.horariosMaestros,
      tieneHoraInicio: !!canchaDetalle.horaInicio,
      tieneHoraFin: !!canchaDetalle.horaFin,
      horaInicio: canchaDetalle.horaInicio,
      horaFin: canchaDetalle.horaFin,
      horariosReservados: canchaDetalle.horariosReservados,
      horariosBloqueados: canchaDetalle.horariosBloqueados
    });
    
    // FORMATO 1: Backend devuelve horariosDisponibles directamente
    if (canchaDetalle.horariosDisponibles && Array.isArray(canchaDetalle.horariosDisponibles)) {
      console.log('✅ Usando horariosDisponibles del backend:', canchaDetalle.horariosDisponibles);
      return canchaDetalle.horariosDisponibles;
    }
    
    // FORMATO 2: Backend devuelve horariosMaestros y horariosOcupados
    if (canchaDetalle.horariosMaestros && Array.isArray(canchaDetalle.horariosMaestros)) {
      const disponibles = canchaDetalle.horariosMaestros.filter(
        (hora: string) => !canchaDetalle.horariosOcupados?.includes(hora)
      );
      console.log('✅ Calculando disponibles de maestros:', disponibles);
      return disponibles;
    }
    
    // FORMATO 3: Backend devuelve horaInicio, horaFin, horariosReservados y horariosBloqueados
    if (canchaDetalle.horaInicio && canchaDetalle.horaFin) {
      console.log('📅 Generando horarios desde horaInicio hasta horaFin');
      
      // Generar todos los horarios posibles
      const todosLosHorarios = generarHorariosMaestros(
        canchaDetalle.horaInicio, 
        canchaDetalle.horaFin
      );
      console.log('🕐 Horarios generados:', todosLosHorarios);
      
      // Filtrar los reservados y bloqueados
      const reservados = canchaDetalle.horariosReservados || [];
      const bloqueados = canchaDetalle.horariosBloqueados || [];
      const ocupados = [...reservados, ...bloqueados];
      
      // Verificar disponibilidad considerando la duración
      const disponibles = todosLosHorarios.filter((horaInicio: string) => {
        // Convertir hora inicio a número
        const [horaI] = horaInicio.split(':').map(Number);
        
        // Calcular cuántas horas necesitamos verificar según la duración
        const horasAVerificar = Math.ceil(duracionSeleccionada);
        
        // Verificar que ningún horario en el rango esté ocupado
        for (let i = 0; i < horasAVerificar; i++) {
          let horaCheck = horaI + i;
          
          // Manejar el caso de medianoche (24 -> 00)
          if (horaCheck >= 24) {
            horaCheck = horaCheck - 24;
          }
          
          const horaCheckStr = `${String(horaCheck).padStart(2, '0')}:00`;
          
          if (ocupados.includes(horaCheckStr)) {
            return false;
          }
        }
        
        // Verificar que el horario de inicio + duración esté dentro del rango disponible
        // Necesitamos verificar que todas las horas necesarias existan en todosLosHorarios
        for (let i = 0; i < horasAVerificar; i++) {
          let horaCheck = horaI + i;
          
          if (horaCheck >= 24) {
            horaCheck = horaCheck - 24;
          }
          
          const horaCheckStr = `${String(horaCheck).padStart(2, '0')}:00`;
          
          if (!todosLosHorarios.includes(horaCheckStr)) {
            return false;
          }
        }
        
        return true;
      });
      
      console.log('✅ Horarios disponibles calculados:', {
        total: todosLosHorarios.length,
        reservados: reservados.length,
        bloqueados: bloqueados.length,
        disponibles: disponibles.length,
        lista: disponibles
      });
      
      return disponibles;
    }
    
    console.log('⚠️ No se encontró ningún formato válido de horarios');
    return [];
  }, [canchaDetalle, duracionSeleccionada]);

  const handleConfirmarReserva = async () => {
    if (!selectedDate || !horarioSeleccionado) {
      Alert.alert("Por favor, selecciona una fecha y un horario.");
      return;
    }
    
    setIsSubmitting(true);

    const reservaData = {
      complejoId: complejoId,
      canchaId: canchaId,
      fecha: selectedDate,
      hora: horarioSeleccionado.horaInicio,
      duracion: duracionSeleccionada,
      horaFin: horarioSeleccionado.horaFin,
      usuarioId: user?.uid || ''
    };

    console.log('📤 Creando reserva con estado Pendiente:', reservaData);

    try {
      const resultado = await crearReserva(reservaData);
      if (resultado) {
        Alert.alert(
          "¡Reserva Creada!", 
          "Tu reserva ha sido creada exitosamente. Está pendiente de confirmación por el administrador.", 
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('MisReservas')
            }
          ]
        );
      } else {
        throw new Error('La respuesta del servidor no fue exitosa.');
      }
    } catch (error: any) {
      Alert.alert("Error", `No se pudo completar la reserva: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !canchaDetalle) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }
  
  if (!canchaDetalle) {
    return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text>No se encontraron detalles para esta cancha.</Text>
        </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Galería de Fotos */}
        {(canchaDetalle.imagenes || canchaDetalle.imagenUrl) && (
          <FlatList
            data={canchaDetalle.imagenes || [canchaDetalle.imagenUrl]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.galleryImage} />
            )}
          />
        )}

        <View style={styles.content}>
          {/* Info de la cancha con características a la derecha */}
          <View style={styles.headerContainer}>
            <View style={styles.infoLeft}>
              <Text style={styles.title}>{canchaDetalle.nombre}</Text>
              <Text style={styles.subtitle}>{canchaDetalle.complejoNombre}</Text>
              <Text style={styles.price}>${canchaDetalle.precioHora} / hr</Text>
            </View>
            
            {/* Características a la derecha */}
            {canchaDetalle.caracteristicas && canchaDetalle.caracteristicas.length > 0 && (
              <View style={styles.featuresContainer}>
                {canchaDetalle.caracteristicas.map((feature: string, index: number) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Descripción compacta */}
          {canchaDetalle.descripcion && canchaDetalle.descripcion !== 'cgg' && (
            <View style={styles.descripcionContainer}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.description} numberOfLines={2}>{canchaDetalle.descripcion}</Text>
            </View>
          )}

          {/* Selector de Fecha */}
          <Text style={styles.sectionTitleCompact}>Seleccioná una fecha</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesContainer}
          >
            {dates.map((date) => (
              <TouchableOpacity
                key={date.fullDate}
                style={[
                  styles.dateButton,
                  selectedDate === date.fullDate && styles.selectedDateButton
                ]}
                onPress={() => setSelectedDate(date.fullDate)}
              >
                <Text style={[
                  styles.dateDayName,
                  selectedDate === date.fullDate && styles.selectedDateText
                ]}>
                  {date.dayName.toUpperCase()}
                </Text>
                <Text style={[
                  styles.dateDayNumber,
                  selectedDate === date.fullDate && styles.selectedDateText
                ]}>
                  {date.dayNumber}
                </Text>
                <Text style={[
                  styles.dateMonth,
                  selectedDate === date.fullDate && styles.selectedDateText
                ]}>
                  {date.month.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          

          {/* Lista de Horarios con Rangos */}
          <Text style={styles.horariosDisponiblesTitulo}>
            ELEGÍ UN HORARIO
          </Text>
          
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horariosCarrusel}
            >
              {horariosDisponibles.length > 0 ? (
                horariosDisponibles.map((horaInicio: string, index: number) => {
                  // Calcular hora fin según duración seleccionada
                  const [hora, minutos] = horaInicio.split(':').map(Number);
                  let horaFinNum = hora + Math.floor(duracionSeleccionada);
                  let minutosFinNum = minutos + (duracionSeleccionada % 1) * 60;
                  
                  // Ajustar si los minutos exceden 60
                  if (minutosFinNum >= 60) {
                    horaFinNum += Math.floor(minutosFinNum / 60);
                    minutosFinNum = minutosFinNum % 60;
                  }
                  
                  // Manejar el caso de medianoche (24 -> 00, 25 -> 01, etc.)
                  if (horaFinNum >= 24) {
                    horaFinNum = horaFinNum - 24;
                  }
                  
                  const horaFin = `${String(horaFinNum).padStart(2, '0')}:${String(minutosFinNum).padStart(2, '0')}`;
                  
                  // Verificar disponibilidad del rango completo (ya está verificado en el filtro)
                  const rangoDisponible = true;
                  
                  return (
                    <TouchableOpacity
                      key={horaInicio}
                      style={[
                        styles.horarioItemCarrusel,
                        !rangoDisponible && styles.horarioItemOcupado,
                        horarioSeleccionado?.horaInicio === horaInicio && styles.horarioItemSeleccionado
                      ]}
                      onPress={() => {
                        if (rangoDisponible) {
                          setHorarioSeleccionado({ horaInicio, horaFin });
                          setSelectedTime(horaInicio);
                        }
                      }}
                      disabled={!rangoDisponible}
                    >
                      <Text style={[
                        styles.horarioTextoSimple,
                        !rangoDisponible && styles.horarioTextoOcupado,
                        horarioSeleccionado?.horaInicio === horaInicio && styles.horarioTextoSeleccionado
                      ]}>
                        {horaInicio} a {horaFin}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.noTimeText}>No hay horarios disponibles para esta fecha.</Text>
              )}
            </ScrollView>
          )}

          {/* Resumen y Botón de Reserva */}
          <View style={styles.bottomContainer}>
            {horarioSeleccionado && (
              <View style={styles.resumenReserva}>
                <View>
                  <Text style={styles.resumenLabel}>Reserva seleccionada:</Text>
                  <Text style={styles.resumenDetalle}>
                    {selectedDate} • {horarioSeleccionado.horaInicio} - {horarioSeleccionado.horaFin}
                  </Text>
                </View>
                <Text style={styles.resumenPrecio}>
                  ${Number(canchaDetalle.precioHora) * duracionSeleccionada}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[
                styles.reserveButton,
                (!horarioSeleccionado || isSubmitting) && styles.disabledButton
              ]}
              disabled={!horarioSeleccionado || isSubmitting}
              onPress={handleConfirmarReserva}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#001F5B" />
              ) : (
                <>
                  <Text style={styles.reserveButtonText}>
                    {horarioSeleccionado ? 'Confirmar Reserva' : 'Seleccioná un horario'}
                  </Text>
                  {horarioSeleccionado && (
                    <Ionicons name="arrow-forward" size={20} color="#001F5B" />
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scrollView: { flex: 1 },
  galleryImage: { width: width, height: 250, backgroundColor: colors.background },
  content: { padding: spacing.md },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  infoLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#001F5B', 
    marginBottom: 4 
  },
  subtitle: { 
    fontSize: fontSize.sm, 
    color: colors.textSecondary, 
    marginBottom: 6 
  },
  price: { 
    fontSize: fontSize.lg, 
    fontWeight: 'bold', 
    color: '#C4D600' 
  },
  
  // Características (a la derecha)
  featuresContainer: { 
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  featureItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  featureText: { 
    fontSize: 12, 
    color: '#666666', 
    marginLeft: 4 
  },
  
  // Secciones
  descripcionContainer: {
    marginBottom: spacing.sm,
  },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#001F5B', 
    marginBottom: 4 
  },
  sectionTitleCompact: {
    fontSize: fontSize.md, 
    fontWeight: 'bold', 
    color: '#001F5B', 
    marginTop: spacing.sm, 
    marginBottom: spacing.sm 
  },
  description: { 
    fontSize: 13, 
    color: '#666666', 
    lineHeight: 18 
  },
  
  // Selector de Fecha
  datesContainer: { paddingVertical: spacing.sm },
  dateButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    alignItems: 'center',
    minWidth: 65,
    minHeight: 60, // Cambio aquí
    justifyContent: 'center',
  },
  selectedDateButton: { backgroundColor: '#C4D600' },
  dateDayName: { 
    fontSize: fontSize.sm, 
    textTransform: 'uppercase', 
    color: '#666666', 
    fontWeight: '600', 
    marginBottom: 4 
  },
  dateDayNumber: { 
    fontSize: fontSize.lg, 
    fontWeight: 'bold', 
    color: '#001F5B', 
    marginVertical: 2 
  },
  dateMonth: { 
    fontSize: fontSize.sm, 
    textTransform: 'uppercase', 
    color: '#666666', 
    fontWeight: '600', 
    marginTop: 4 
  },
  selectedDateText: { color: '#001F5B' },
  
  // Lista de Horarios
  horariosDisponiblesTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  horariosCarrusel: {
    paddingHorizontal: 0,
    paddingBottom: spacing.md,
    gap: 12,
  },
  horarioItemCarrusel: {
    backgroundColor: '#E8E8E8',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 0,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horarioItemOcupado: {
    backgroundColor: '#E8E8E8',
    opacity: 0.5,
  },
  horarioItemSeleccionado: {
    backgroundColor: '#C4D600',
  },
  horarioTextoSimple: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  horarioTextoOcupado: {
    color: '#999999',
  },
  horarioTextoSeleccionado: {
    color: '#001F5B',
  },
  
  // Textos de Estado
  noTimeText: { 
    color: '#666666', 
    fontStyle: 'italic', 
    fontSize: fontSize.sm 
  },
  
  // Botón de Reserva
  reserveButton: {
    backgroundColor: '#C4D600',
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.xl,
    minHeight: 50,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: { 
    backgroundColor: '#9E9E9E' 
  },
  reserveButtonText: { 
    color: '#001F5B', 
    fontSize: 16, 
    fontWeight: 'bold',
    marginRight: 8,
  },
  
  // Contenedor inferior
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Resumen de reserva
  resumenReserva: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  resumenLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  resumenDetalle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#001F5B',
  },
  resumenPrecio: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C4D600',
  },
});

export default CanchaDetalleScreen;