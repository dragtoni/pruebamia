import React, { useState, useEffect } from 'react';
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
  FlatList,
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuth } from '../../src/context/AuthContext';
import LocationPicker from '../../src/components/LocationPicker';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

interface Zona {
  nombre: string;
  lat: number;
  lng: number;
}

interface Ciudad {
  nombre: string;
  emoji: string;
  featured: boolean;
}

// City coordinates
const CITY_COORDS: { [key: string]: { lat: number; lng: number } } = {
  'Granada': { lat: 37.1773, lng: -3.5986 },
  'Madrid': { lat: 40.4168, lng: -3.7038 },
  'Barcelona': { lat: 41.3851, lng: 2.1734 },
  'Sevilla': { lat: 37.3891, lng: -5.9845 },
  'Valencia': { lat: 39.4699, lng: -0.3763 },
  'Málaga': { lat: 36.7213, lng: -4.4214 },
  'Salamanca': { lat: 40.9701, lng: -5.6635 },
  'Zaragoza': { lat: 41.6488, lng: -0.8891 },
  'Bilbao': { lat: 43.2630, lng: -2.9350 },
  'Santiago de Compostela': { lat: 42.8782, lng: -8.5448 },
};

export default function AddPisoScreen() {
  const router = useRouter();
  const { token, selectedCity, setSelectedCity } = useAuth();
  const [loading, setLoading] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [zona, setZona] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [tipoAlquiler, setTipoAlquiler] = useState<'piso' | 'habitacion'>('piso');
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [showCitySelector, setShowCitySelector] = useState(false);
  
  // Map state
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number} | null>(null);

  const cityCoords = CITY_COORDS[selectedCity] || CITY_COORDS['Granada'];

  useEffect(() => {
    fetchCiudades();
  }, []);

  useEffect(() => {
    fetchZonas();
    setZona('');
    setSelectedCoords(null);
    setDireccion('');
  }, [selectedCity]);

  const fetchCiudades = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/ciudades`);
      setCiudades(response.data.ciudades);
    } catch (error) {
      console.error('Error fetching ciudades:', error);
    }
  };

  const fetchZonas = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/ciudades/${selectedCity}/zonas`);
      setZonas(response.data.zonas);
    } catch (error) {
      console.error('Error fetching zonas:', error);
    }
  };

  // Find nearest zone based on coordinates
  const findNearestZone = (lat: number, lng: number): string => {
    let nearestZone = zonas[0]?.nombre || '';
    let minDistance = Infinity;
    
    zonas.forEach((z) => {
      const distance = Math.sqrt(Math.pow(z.lat - lat, 2) + Math.pow(z.lng - lng, 2));
      if (distance < minDistance) {
        minDistance = distance;
        nearestZone = z.nombre;
      }
    });
    
    return nearestZone;
  };

  // Handle location selection from map
  const handleLocationSelect = (data: { lat: number; lng: number; address: string; zona: string }) => {
    setDireccion(data.address);
    setSelectedCoords({ lat: data.lat, lng: data.lng });
    
    // Find and set the nearest zone
    const nearestZone = findNearestZone(data.lat, data.lng);
    setZona(nearestZone);
    
    setShowMapPicker(false);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería');
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
      setFotos([...fotos, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setFotos([...fotos, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const removePhoto = (index: number) => {
    setFotos(fotos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!direccion || !zona || !precio) {
      Alert.alert('Campos requeridos', 'Completa los campos obligatorios');
      return;
    }

    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      Alert.alert('Precio inválido', 'Introduce un precio válido');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/pisos`,
        {
          direccion: `[${tipoAlquiler.toUpperCase()}] ${direccion}`,
          zona,
          ciudad: selectedCity,
          precio_mensual: precioNum,
          descripcion: descripcion || null,
          fotos,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Publicado', 'Tu piso ha sido añadido correctamente', [
        {
          text: 'OK',
          onPress: () => {
            setDireccion('');
            setZona('');
            setPrecio('');
            setDescripcion('');
            setFotos([]);
            setSelectedCoords(null);
            router.push('/(tabs)');
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al publicar');
    } finally {
      setLoading(false);
    }
  };

  const selectedCiudad = ciudades.find(c => c.nombre === selectedCity);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Añadir Piso</Text>
          <Text style={styles.subtitle}>Comparte tu experiencia con la comunidad</Text>

          <View style={styles.form}>
            {/* Ciudad Selector */}
            <Text style={styles.label}>Ciudad *</Text>
            <TouchableOpacity style={styles.citySelector} onPress={() => setShowCitySelector(!showCitySelector)}>
              <Text style={styles.citySelectorEmoji}>{selectedCiudad?.emoji || '🏠'}</Text>
              <Text style={styles.citySelectorText}>{selectedCity}</Text>
              {selectedCiudad?.featured && (
                <View style={styles.featuredBadge}><Ionicons name="star" size={12} color="#ffd700" /></View>
              )}
              <Ionicons name={showCitySelector ? 'chevron-up' : 'chevron-down'} size={18} color="#888" />
            </TouchableOpacity>

            {showCitySelector && (
              <View style={styles.cityList}>
                <FlatList
                  data={ciudades}
                  keyExtractor={(item) => item.nombre}
                  style={{ maxHeight: 180 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.cityOption, selectedCity === item.nombre && styles.cityOptionActive]}
                      onPress={() => { setSelectedCity(item.nombre); setShowCitySelector(false); }}
                    >
                      <Text style={styles.cityOptionEmoji}>{item.emoji}</Text>
                      <Text style={[styles.cityOptionText, selectedCity === item.nombre && styles.cityOptionTextActive]}>{item.nombre}</Text>
                      {item.featured && <Ionicons name="star" size={12} color="#ffd700" />}
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {/* Tipo */}
            <Text style={styles.label}>¿Qué alquilas?</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, tipoAlquiler === 'piso' && styles.typeButtonActive]}
                onPress={() => setTipoAlquiler('piso')}
              >
                <Ionicons name="home" size={20} color={tipoAlquiler === 'piso' ? '#0f0f1a' : '#888'} />
                <Text style={[styles.typeButtonText, tipoAlquiler === 'piso' && styles.typeButtonTextActive]}>Piso completo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, tipoAlquiler === 'habitacion' && styles.typeButtonActive]}
                onPress={() => setTipoAlquiler('habitacion')}
              >
                <Ionicons name="bed" size={20} color={tipoAlquiler === 'habitacion' ? '#0f0f1a' : '#888'} />
                <Text style={[styles.typeButtonText, tipoAlquiler === 'habitacion' && styles.typeButtonTextActive]}>Habitación</Text>
              </TouchableOpacity>
            </View>

            {/* ===================== */}
            {/* MAP LOCATION SELECTOR */}
            {/* ===================== */}
            <Text style={styles.label}>📍 Ubicación en el mapa *</Text>
            <Text style={styles.locationHint}>Busca y selecciona la dirección exacta en el mapa</Text>
            
            {/* Main map button */}
            <TouchableOpacity 
              style={[styles.mapButton, selectedCoords && styles.mapButtonSelected]} 
              onPress={() => setShowMapPicker(true)}
            >
              <View style={[styles.mapButtonIcon, selectedCoords && styles.mapButtonIconSelected]}>
                <Ionicons 
                  name={selectedCoords ? "checkmark-circle" : "map"} 
                  size={28} 
                  color={selectedCoords ? "#4ade80" : "#4ecdc4"} 
                />
              </View>
              <View style={styles.mapButtonContent}>
                {selectedCoords ? (
                  <>
                    <Text style={styles.mapButtonTextSelected}>📍 {direccion}</Text>
                    <Text style={styles.mapButtonSubtextSelected}>Zona: {zona} • {selectedCity}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.mapButtonText}>Abrir mapa para seleccionar</Text>
                    <Text style={styles.mapButtonSubtext}>Busca o pincha en el mapa</Text>
                  </>
                )}
              </View>
              <Ionicons name="chevron-forward" size={24} color="#888" />
            </TouchableOpacity>

            {/* Location Picker Modal */}
            <Modal visible={showMapPicker} animationType="slide">
              <LocationPicker
                initialLat={cityCoords.lat}
                initialLng={cityCoords.lng}
                cityName={selectedCity}
                onLocationSelect={handleLocationSelect}
                onClose={() => setShowMapPicker(false)}
              />
            </Modal>

            {/* Manual address input (hidden if selected from map) */}
            {!selectedCoords && (
              <>
                <Text style={styles.orDivider}>— o escribe manualmente —</Text>
                
                {/* Zona manual selector */}
                <Text style={styles.label}>Zona *</Text>
                <View style={styles.zonesGrid}>
                  {zonas.map((z) => (
                    <TouchableOpacity
                      key={z.nombre}
                      style={[styles.zoneChip, zona === z.nombre && styles.zoneChipActive]}
                      onPress={() => setZona(z.nombre)}
                    >
                      <Text style={[styles.zoneChipText, zona === z.nombre && styles.zoneChipTextActive]}>{z.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Manual address */}
                <Text style={styles.label}>Dirección *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="location" size={18} color="#888" />
                  <TextInput
                    style={styles.input}
                    placeholder="Calle, número, piso..."
                    placeholderTextColor="#666"
                    value={direccion}
                    onChangeText={setDireccion}
                  />
                </View>
              </>
            )}

            {/* Edit button if location was selected */}
            {selectedCoords && (
              <TouchableOpacity 
                style={styles.editLocationButton}
                onPress={() => {
                  setSelectedCoords(null);
                  setDireccion('');
                  setZona('');
                }}
              >
                <Ionicons name="create-outline" size={18} color="#4ecdc4" />
                <Text style={styles.editLocationText}>Cambiar ubicación o escribir manualmente</Text>
              </TouchableOpacity>
            )}

            {/* Precio */}
            <Text style={styles.label}>Precio mensual (€) *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash" size={18} color="#888" />
              <TextInput
                style={styles.input}
                placeholder="Ej: 400"
                placeholderTextColor="#666"
                value={precio}
                onChangeText={setPrecio}
                keyboardType="numeric"
              />
            </View>

            {/* Descripción */}
            <Text style={styles.label}>Tu experiencia (opcional)</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe tu experiencia, el estado del piso, el trato del casero..."
                placeholderTextColor="#666"
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Fotos */}
            <Text style={styles.label}>Fotos (opcional)</Text>
            <Text style={styles.photoHint}>Añade fotos reales del piso</Text>
            <View style={styles.photosContainer}>
              {fotos.map((foto, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri: foto }} style={styles.photo} />
                  <TouchableOpacity style={styles.removePhotoButton} onPress={() => removePhoto(index)}>
                    <Ionicons name="close-circle" size={22} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              ))}
              {fotos.length < 5 && (
                <View style={styles.addPhotoButtons}>
                  <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                    <Ionicons name="images" size={22} color="#ffd700" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
                    <Ionicons name="camera" size={22} color="#ffd700" />
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
                  <Ionicons name="add-circle" size={22} color="#0f0f1a" />
                  <Text style={styles.submitButtonText}>Publicar</Text>
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
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  keyboardView: { flex: 1 },
  scrollContent: { padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  form: { gap: 6 },
  label: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  citySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, marginBottom: 4, gap: 8 },
  citySelectorEmoji: { fontSize: 20 },
  citySelectorText: { flex: 1, color: '#fff', fontSize: 15 },
  featuredBadge: { backgroundColor: '#ffd70020', padding: 3, borderRadius: 4 },
  cityList: { backgroundColor: '#1a1a2e', borderRadius: 10, marginBottom: 8 },
  cityOption: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a3e' },
  cityOptionActive: { backgroundColor: '#ffd70020' },
  cityOptionEmoji: { fontSize: 16 },
  cityOptionText: { flex: 1, color: '#888', fontSize: 14 },
  cityOptionTextActive: { color: '#fff', fontWeight: '600' },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, backgroundColor: '#1a1a2e', gap: 6 },
  typeButtonActive: { backgroundColor: '#ffd700' },
  typeButtonText: { color: '#888', fontSize: 14, fontWeight: '600' },
  typeButtonTextActive: { color: '#0f0f1a' },
  
  // Map Location Styles
  locationHint: { color: '#888', fontSize: 12, marginBottom: 10 },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2a2e',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 2,
    borderColor: '#4ecdc4',
  },
  mapButtonSelected: {
    borderColor: '#4ade80',
    backgroundColor: '#1a2a1a',
  },
  mapButtonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0f0f1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapButtonIconSelected: {
    backgroundColor: '#1a3a1a',
  },
  mapButtonContent: { flex: 1 },
  mapButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  mapButtonSubtext: { color: '#888', fontSize: 13, marginTop: 2 },
  mapButtonTextSelected: { color: '#4ade80', fontSize: 15, fontWeight: '600' },
  mapButtonSubtextSelected: { color: '#888', fontSize: 12, marginTop: 2 },
  
  orDivider: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 16,
  },
  editLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  editLocationText: { color: '#4ecdc4', fontSize: 13 },
  
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 10, paddingHorizontal: 12, gap: 10 },
  input: { flex: 1, height: 48, color: '#fff', fontSize: 15 },
  textAreaContainer: { alignItems: 'flex-start', paddingVertical: 10 },
  textArea: { height: 80, textAlignVertical: 'top' },
  zonesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  zoneChip: { backgroundColor: '#1a1a2e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  zoneChipActive: { backgroundColor: '#ffd700' },
  zoneChipText: { color: '#888', fontSize: 13 },
  zoneChipTextActive: { color: '#0f0f1a', fontWeight: '600' },
  photoHint: { color: '#888', fontSize: 12, marginBottom: 8 },
  photosContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  photoWrapper: { position: 'relative' },
  photo: { width: 80, height: 80, borderRadius: 10 },
  removePhotoButton: { position: 'absolute', top: -6, right: -6, backgroundColor: '#0f0f1a', borderRadius: 11 },
  addPhotoButtons: { flexDirection: 'row', gap: 8 },
  addPhotoButton: { width: 80, height: 80, backgroundColor: '#1a1a2e', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#2a2a3e', borderStyle: 'dashed' },
  submitButton: { backgroundColor: '#ffd700', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginTop: 20, gap: 8 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { fontSize: 17, fontWeight: 'bold', color: '#0f0f1a' },
});
