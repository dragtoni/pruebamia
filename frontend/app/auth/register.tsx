import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Ciudad {
  nombre: string;
  emoji: string;
  featured: boolean;
}

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'inquilino' | 'casero'>('inquilino');
  const [ciudad, setCiudad] = useState('Granada');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [showCitySelector, setShowCitySelector] = useState(false);

  useEffect(() => {
    fetchCiudades();
  }, []);

  const fetchCiudades = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/ciudades`);
      setCiudades(response.data.ciudades);
    } catch (error) {
      console.error('Error fetching ciudades:', error);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name, userType, ciudad);
      router.replace('/(tabs)');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error al registrarse';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCiudad = ciudades.find(c => c.nombre === ciudad);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Ionicons name="star" size={50} color="#ffd700" />
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a la comunidad en toda España</Text>
          </View>

          <View style={styles.form}>
            {/* Ciudad Selector */}
            <Text style={styles.label}>¿Dónde buscas piso?</Text>
            <TouchableOpacity
              style={styles.citySelector}
              onPress={() => setShowCitySelector(!showCitySelector)}
            >
              <Text style={styles.citySelectorEmoji}>{selectedCiudad?.emoji || '🏠'}</Text>
              <Text style={styles.citySelectorText}>{ciudad}</Text>
              {selectedCiudad?.featured && (
                <View style={styles.featuredBadge}>
                  <Ionicons name="star" size={12} color="#ffd700" />
                </View>
              )}
              <Ionicons name={showCitySelector ? 'chevron-up' : 'chevron-down'} size={20} color="#888" />
            </TouchableOpacity>

            {showCitySelector && (
              <View style={styles.cityList}>
                {ciudades.map((c) => (
                  <TouchableOpacity
                    key={c.nombre}
                    style={[
                      styles.cityOption,
                      ciudad === c.nombre && styles.cityOptionActive,
                      c.featured && styles.cityOptionFeatured,
                    ]}
                    onPress={() => {
                      setCiudad(c.nombre);
                      setShowCitySelector(false);
                    }}
                  >
                    <Text style={styles.cityOptionEmoji}>{c.emoji}</Text>
                    <Text style={[
                      styles.cityOptionText,
                      ciudad === c.nombre && styles.cityOptionTextActive
                    ]}>{c.nombre}</Text>
                    {c.featured && (
                      <Ionicons name="star" size={14} color="#ffd700" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>¿Quién eres?</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  userType === 'inquilino' && styles.typeButtonActive,
                ]}
                onPress={() => setUserType('inquilino')}
              >
                <Ionicons
                  name="school"
                  size={22}
                  color={userType === 'inquilino' ? '#0f0f1a' : '#888'}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    userType === 'inquilino' && styles.typeButtonTextActive,
                  ]}
                >
                  Estudiante
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  userType === 'casero' && styles.typeButtonActive,
                ]}
                onPress={() => setUserType('casero')}
              >
                <Ionicons
                  name="key"
                  size={22}
                  color={userType === 'casero' ? '#0f0f1a' : '#888'}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    userType === 'casero' && styles.typeButtonTextActive,
                  ]}
                >
                  Casero
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="person" size={18} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={18} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={18} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0f0f1a" />
              ) : (
                <Text style={styles.buttonText}>Registrarse</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.linkText}>
                ¿Ya tienes cuenta? <Text style={styles.linkTextBold}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 6,
  },
  form: {
    width: '100%',
  },
  label: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 10,
    fontWeight: '600',
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    gap: 10,
  },
  citySelectorEmoji: {
    fontSize: 22,
  },
  citySelectorText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  featuredBadge: {
    backgroundColor: '#ffd70020',
    padding: 4,
    borderRadius: 6,
  },
  cityList: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    maxHeight: 200,
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  cityOptionActive: {
    backgroundColor: '#ffd70020',
  },
  cityOptionFeatured: {
    borderLeftWidth: 3,
    borderLeftColor: '#ffd700',
  },
  cityOptionEmoji: {
    fontSize: 18,
  },
  cityOptionText: {
    flex: 1,
    color: '#888',
    fontSize: 15,
  },
  cityOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#ffd700',
    borderColor: '#ffd700',
  },
  typeButtonText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#0f0f1a',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#ffd700',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f0f1a',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#888',
    fontSize: 15,
  },
  linkTextBold: {
    color: '#ffd700',
    fontWeight: 'bold',
  },
});
