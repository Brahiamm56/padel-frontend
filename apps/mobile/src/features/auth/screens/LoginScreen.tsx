import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input, Loading } from '../../../components/common';
import { colors } from '../../../styles/colors';
import { spacing, fontSize, fontWeight } from '../../../styles/spacing';
import { validators, errorMessages } from '../../../utils/validators';
import { loginUser, useGoogleAuth, loginWithGoogle } from '../services/authentication.service';

export const LoginScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });

  // Hook de Google Auth
  const { request, response, promptAsync } = useGoogleAuth();

  // Manejar respuesta de Google
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    } else if (response?.type === 'error') {
      console.error('🔴 Error en Google Auth:', response.error);
      Alert.alert('Error', 'No se pudo iniciar sesión con Google');
      setGoogleLoading(false);
    } else if (response?.type === 'dismiss') {
      setGoogleLoading(false);
    }
  }, [response]);

  // Función para manejar login con Google
  const handleGoogleLogin = async (idToken: string) => {
    try {
      setGoogleLoading(true);
      const result = await loginWithGoogle(idToken);
      
      if (result.success) {
        console.log('✅ Login con Google exitoso');
        Alert.alert('¡Bienvenido!', 'Has iniciado sesión con Google correctamente.');
      } else {
        Alert.alert('Error', result.message || 'Error al iniciar sesión con Google');
      }
    } catch (error: any) {
      console.error('🔴 Error en handleGoogleLogin:', error);
      Alert.alert('Error', error.message || 'Error al iniciar sesión con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Iniciar flujo de Google
  const handleGooglePress = async () => {
    if (!request) {
      Alert.alert('Error', 'Google Auth no está disponible en este momento');
      return;
    }
    setGoogleLoading(true);
    await promptAsync();
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!validators.required(email)) {
      newErrors.email = errorMessages.required;
      isValid = false;
    } else if (!validators.email(email)) {
      newErrors.email = errorMessages.invalidEmail;
      isValid = false;
    }

    if (!validators.required(password)) {
      newErrors.password = errorMessages.required;
      isValid = false;
    } else if (!validators.password(password)) {
      newErrors.password = errorMessages.invalidPassword;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Manejar login
  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const credentials = {
        email: email.trim(),
        password: password,
      };

      const result = await loginUser(credentials);

      if (result.success) {
        // ¡LOGIN EXITOSO!
        console.log("Token JWT:", result.data.token);
        console.log("Datos del usuario:", result.data.user);

        // Aquí es donde guardaríamos el token y los datos del usuario
        // para mantener la sesión iniciada, y luego navegaríamos a la app principal.

        Alert.alert("¡Bienvenido!", "Has iniciado sesión correctamente.");
        // Navegar a la pantalla principal de la app
        // navigation.replace('MainApp'); 
      } else {
        Alert.alert("Error de Inicio de Sesión", result.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Navegar a registro
  const goToRegister = () => {
    navigation.navigate('Register');
  };

  if (loading) {
    return <Loading text="Iniciando sesión..." />;
  }

  return (
    <LinearGradient
      colors={['#001F5B', '#00152E', '#001F5B']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Decorative circles for visual interest */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />

          {/* Header with Logo */}
          <View style={styles.header}>
            <Image
              source={require('../../../../assets/images/logoLogin.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.welcomeText}>¡Bienvenido a North Padel!</Text>
            <Text style={styles.subtitleText}>Inicia sesión para continuar</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Input
                label="Email"
                placeholder="tu@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrors({ ...errors, email: '' });
                }}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                labelColor="#FFFFFF"
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Input
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors({ ...errors, password: '' });
                }}
                error={errors.password}
                isPassword
                labelColor="#FFFFFF"
                style={styles.input}
              />
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            {/* Custom Login Button with brand green */}
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#C4D600', '#A8B800']}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#001F5B" />
                ) : (
                  <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o continuar con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button with outline style */}
            <TouchableOpacity 
              style={[styles.googleButton, googleLoading && styles.googleButtonDisabled]}
              onPress={handleGooglePress}
              activeOpacity={0.8}
              disabled={googleLoading || !request}
            >
              <View style={styles.googleButtonContent}>
                {googleLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.googleIcon}>G</Text>
                    <Text style={styles.googleButtonText}>Continuar con Google</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tenés cuenta?</Text>
            <TouchableOpacity onPress={goToRegister} activeOpacity={0.7}>
              <Text style={styles.registerLink}>Registrate aquí</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

// Detección del tamaño de pantalla
const { height } = Dimensions.get('window');
const isSmallDevice = height < 700;
const isMediumDevice = height >= 700 && height < 800;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: isSmallDevice ? spacing.md : (isMediumDevice ? spacing.lg : spacing.xl),
    paddingBottom: isSmallDevice ? spacing.md : spacing.lg,
  },
  // Decorative circles for visual interest
  decorativeCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(196, 214, 0, 0.05)',
    top: -100,
    right: -100,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(196, 214, 0, 0.08)',
    bottom: 100,
    left: -50,
  },
  // Header styles
  header: {
    alignItems: 'center',
    marginBottom: isSmallDevice ? spacing.md : (isMediumDevice ? spacing.lg : spacing.xxl),
    paddingTop: isSmallDevice ? spacing.sm : (isMediumDevice ? spacing.md : spacing.lg),
  },
  logo: {
    width: isSmallDevice ? 160 : (isMediumDevice ? 190 : 220),
    height: isSmallDevice ? 120 : (isMediumDevice ? 140 : 160),
    marginBottom: isSmallDevice ? spacing.sm : spacing.md,
  },
  welcomeText: {
    fontSize: isSmallDevice ? fontSize.lg : fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: isSmallDevice ? fontSize.sm : fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  // Form styles
  form: {
    marginBottom: isSmallDevice ? spacing.sm : spacing.md,
  },
  inputWrapper: {
    marginBottom: isSmallDevice ? spacing.sm : spacing.md,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: isSmallDevice ? spacing.md : spacing.lg,
    marginTop: spacing.xs,
  },
  forgotPasswordText: {
    fontSize: fontSize.sm,
    color: colors.brandGreen,
    fontWeight: fontWeight.semibold,
    textDecorationLine: 'underline',
  },
  // Login button with gradient
  loginButton: {
    marginBottom: isSmallDevice ? spacing.sm : spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#C4D600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonGradient: {
    paddingVertical: isSmallDevice ? spacing.md : spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#001F5B',
    letterSpacing: 0.5,
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: isSmallDevice ? spacing.sm : (isMediumDevice ? spacing.md : spacing.lg),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  // Google button with outline
  googleButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: isSmallDevice ? spacing.sm : spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: isSmallDevice ? spacing.xs : spacing.sm,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginRight: spacing.sm,
  },
  googleButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: isSmallDevice ? spacing.xs : spacing.sm,
    paddingBottom: isSmallDevice ? spacing.md : spacing.lg,
  },
  footerText: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
    marginRight: spacing.xs,
  },
  registerLink: {
    fontSize: fontSize.md,
    color: colors.brandGreen,
    fontWeight: fontWeight.bold,
    textDecorationLine: 'underline',
  },
});