import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function AddPisoScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [zona, setZona] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para subir fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setFotos([...fotos, base64Image]);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu cámara para tomar fotos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setFotos([...fotos, base64Image]);
    }
  };

  const removePhoto = (index: number) => {
    setFotos(fotos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!direccion || !zona || !precio) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios');
      return;
    }

    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      Alert.alert('Error', 'El precio debe ser un número válido');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/pisos`,
        {
          direccion,
          zona,
          precio_mensual: precioNum,
          descripcion: descripcion || null,
          fotos,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('Éxito', 'Piso añadido correctamente', [
        {
          text: 'OK',
          onPress: () => {
            setDireccion('');
            setZona('');
            setPrecio('');
            setDescripcion('');
            setFotos([]);
            router.push('/(tabs)');
          },
        },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error al añadir el piso';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Añadir Piso</Text>
          <Text style={styles.subtitle}>
            Comparte tu experiencia y ayuda a otros inquilinos
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Dirección *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location" size={20} color="#888" />
              <TextInput
                style={styles.input}
                placeholder="Calle, número, piso..."
                placeholderTextColor="#666"
                value={direccion}
                onChangeText={setDireccion}
              />
            </View>

            <Text style={styles.label}>Zona / Barrio *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="map" size={20} color="#888" />
              <TextInput
                style={styles.input}
                placeholder="Ej: Centro, Malasaña, Gracia..."
                placeholderTextColor="#666"
                value={zona}
                onChangeText={setZona}
              />
            </View>

            <Text style={styles.label}>Precio mensual (€) *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash" size={20} color="#888" />
              <TextInput
                style={styles.input}
                placeholder="Ej: 800"
                placeholderTextColor="#666"
                value={precio}
                onChangeText={setPrecio}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.label}>Descripción</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe el piso, el casero, tu experiencia..."
                placeholderTextColor="#666"
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <Text style={styles.label}>Fotos</Text>
            <View style={styles.photosContainer}>
              {fotos.map((foto, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri: foto }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {fotos.length < 5 && (
                <View style={styles.addPhotoButtons}>
                  <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                    <Ionicons name="images" size={24} color="#ffd700" />
                    <Text style={styles.addPhotoText}>Galería</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
                    <Ionicons name="camera" size={24} color="#ffd700" />
                    <Text style={styles.addPhotoText}>Cámara</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0f0f1a" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={24} color="#0f0f1a" />
                  <Text style={styles.submitButtonText}>Añadir Piso</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
  },
  form: {
    gap: 8,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  input: {
    flex: 1,
    height: 56,
    color: '#fff',
    fontSize: 16,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
  },
  addPhotoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2a2a3e',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    color: '#ffd700',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#ffd700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f0f1a',
  },
});
