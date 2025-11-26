import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  getUserProfile,
  getUserProfileSignature,
  uploadImageToCloudinary,
  updateUserProfileBackend,
  type UserInfo,
} from '../services/user.service';
import { logout as authLogout } from '../../../features/auth/services/authentication.service';
import { colors } from '../../../styles/colors';
import { useAuth } from '../../../features/auth/contexts/AuthContext';

/**
 * Pantalla de Perfil Editable
 * Permite al usuario ver y editar su información personal incluyendo foto
 */
const PerfilScreen = () => {
  const { user: authUser, isAuthenticated, updateUser } = useAuth();

  // Estados para datos del usuario
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para edición
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [originalFotoUrl, setOriginalFotoUrl] = useState<string | null>(null);

  // Estados de UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Ref para evitar recargar datos inmediatamente después de guardar
  const skipNextLoad = React.useRef(false);

  // Cargar datos del usuario cada vez que la pantalla obtiene foco
  useFocusEffect(
    useCallback(() => {
      // Si acabamos de guardar, no recargar (los datos ya están actualizados)
      if (skipNextLoad.current) {
        console.log('⏭️ Saltando recarga de datos (acabamos de guardar)');
        skipNextLoad.current = false;
        return;
      }
      loadUserData();
    }, [isAuthenticated, authUser])
  );

  const loadUserData = async () => {
    if (!isAuthenticated || !authUser) {
      setLoading(false);
      setError('No hay sesión activa');
      return;
    }

    console.log('🔵 Cargando datos del usuario desde backend...');
    try {
      setLoading(true);
      const userData = await getUserProfile(); // ← CAMBIADO: Ahora llama al backend
      console.log('🔵 Datos del usuario cargados desde backend:', userData);

      setUserInfo(userData);
      setNombre(userData.nombre || '');
      setApellido(userData.apellido || '');
      setTelefono(userData.telefono || '');
      setOriginalFotoUrl(userData.fotoUrl || null);
      setFotoUri(null);
      setHasChanges(false);
      setError(null);
    } catch (err) {
      console.error('🔴 Error al cargar los datos del usuario:', err);
      setError('No se pudieron cargar los datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  // Detectar cambios en el formulario
  const checkForChanges = useCallback(() => {
    if (!userInfo) return false;

    const nombreChanged = nombre !== (userInfo.nombre || '');
    const apellidoChanged = apellido !== (userInfo.apellido || '');
    const telefonoChanged = telefono !== (userInfo.telefono || '');
    const fotoChanged = fotoUri !== null;

    return nombreChanged || apellidoChanged || telefonoChanged || fotoChanged;
  }, [nombre, apellido, telefono, fotoUri, userInfo]);

  // Actualizar estado de cambios cuando cambian los campos
  React.useEffect(() => {
    setHasChanges(checkForChanges());
  }, [checkForChanges]);

  // Seleccionar imagen de la galería
  const handlePickImage = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a tu galería para cambiar la foto de perfil.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('📷 Imagen seleccionada:', result.assets[0].uri);
        setFotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('🔴 Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Guardar cambios del perfil
  const handleSave = async () => {
    if (!hasChanges || isSubmitting) return;

    try {
      setIsSubmitting(true);
      let finalFotoUrl = originalFotoUrl;

      // Si hay una nueva imagen, subirla a Cloudinary
      if (fotoUri) {
        console.log('📤 Subiendo nueva imagen de perfil...');
        const signature = await getUserProfileSignature();
        finalFotoUrl = await uploadImageToCloudinary(fotoUri, signature);
      }

      // Preparar datos para actualizar en el backend (CON fotoUrl si hay)
      const updateData = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
        ...(finalFotoUrl && { fotoUrl: finalFotoUrl }), // ✅ Incluir fotoUrl si existe
      };

      console.log('📡 Datos a enviar al backend:', updateData);

      // Actualizar perfil en el backend Node.js
      const response = await updateUserProfileBackend(updateData);

      // Extraer datos del usuario de la respuesta del backend
      // El backend devuelve: { message: "...", user: {...} }
      const backendUser = response.user || response;

      // Combinar con foto si hay una nueva
      const finalUserData = {
        uid: backendUser.id || backendUser.uid || userInfo?.uid,
        email: backendUser.email || userInfo?.email || '',
        nombre: backendUser.nombre || nombre,
        apellido: backendUser.apellido || apellido,
        telefono: backendUser.telefono || telefono,
        fotoUrl: finalFotoUrl || backendUser.fotoUrl || originalFotoUrl,
        role: backendUser.role || userInfo?.role,
        createdAt: backendUser.createdAt,
        updatedAt: backendUser.updatedAt,
      };

      console.log('📝 Datos finales del usuario:', finalUserData);

      // Actualizar contexto de autenticación si está disponible
      if (updateUser) {
        await updateUser({
          nombre: finalUserData.nombre,
          apellido: finalUserData.apellido,
          telefono: finalUserData.telefono,
        });
      }

      // Actualizar estado local
      setUserInfo(finalUserData);
      setNombre(finalUserData.nombre);
      setApellido(finalUserData.apellido);
      setTelefono(finalUserData.telefono);
      setOriginalFotoUrl(finalUserData.fotoUrl || null);
      setFotoUri(null);
      setHasChanges(false);

      // Evitar recarga automática inmediata
      skipNextLoad.current = true;

      Alert.alert('Éxito', 'Tu perfil ha sido actualizado correctamente');
    } catch (error: any) {
      console.error('🔴 Error al guardar perfil:', error);
      Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para manejar el cierre de sesión
  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await authLogout();
              console.log('✅ Sesión cerrada exitosamente');
            } catch (error) {
              console.error('🔴 Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            }
          },
        },
      ]
    );
  };

  // Mostrar indicador de carga
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  // Mostrar pantalla de error
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>

        {/* Botón de cerrar sesión en error (útil cuando el token expiró) */}
        <TouchableOpacity
          style={[styles.logoutButton, { marginTop: 16 }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // URL de la foto a mostrar (nueva seleccionada o la original)
  const displayPhotoUrl = fotoUri || originalFotoUrl || 'https://placehold.co/120x120/10b981/FFFFFF/png?text=U';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cabecera con Avatar Editable */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handlePickImage}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: displayPhotoUrl }}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={18} color={colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Toca para cambiar foto</Text>
          </View>

          {/* Formulario de Edición */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>INFORMACIÓN PERSONAL</Text>

            {/* Campo Nombre */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.textInput}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Tu nombre"
                placeholderTextColor={colors.gray400}
                autoCapitalize="words"
              />
            </View>

            {/* Campo Apellido */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Apellido</Text>
              <TextInput
                style={styles.textInput}
                value={apellido}
                onChangeText={setApellido}
                placeholder="Tu apellido"
                placeholderTextColor={colors.gray400}
                autoCapitalize="words"
              />
            </View>

            {/* Campo Teléfono */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={styles.textInput}
                value={telefono}
                onChangeText={setTelefono}
                placeholder="Tu número de teléfono"
                placeholderTextColor={colors.gray400}
                keyboardType="phone-pad"
              />
            </View>

            {/* Campo Email (Solo lectura) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledInputText}>
                  {userInfo?.email || 'email@ejemplo.com'}
                </Text>
                <Ionicons name="lock-closed" size={16} color={colors.gray400} />
              </View>
            </View>
          </View>

          {/* Botón Guardar Cambios */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!hasChanges || isSubmitting) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Botón de Cerrar Sesión */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.backgroundSecondary,
  },
  errorText: {
    color: colors.error,
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray100,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  formSection: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray500,
    textTransform: 'uppercase',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  disabledInput: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  disabledInputText: {
    fontSize: 16,
    color: colors.gray500,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    gap: 8,
  },
  logoutButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PerfilScreen;
