import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import axios from 'axios';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width, height } = Dimensions.get('window');

interface Piso {
  id: string;
  direccion: string;
  zona: string;
  ciudad: string;
  precio_mensual: number;
  promedio_general: number;
  total_valoraciones: number;
  lat?: number;
  lng?: number;
}

interface Ciudad {
  nombre: string;
  emoji: string;
  featured: boolean;
  lat: number;
  lng: number;
}

// City coordinates
const CITY_COORDS: { [key: string]: { lat: number; lng: number; zoom: number } } = {
  'Granada': { lat: 37.1773, lng: -3.5986, zoom: 13 },
  'Madrid': { lat: 40.4168, lng: -3.7038, zoom: 12 },
  'Barcelona': { lat: 41.3851, lng: 2.1734, zoom: 12 },
  'Sevilla': { lat: 37.3891, lng: -5.9845, zoom: 13 },
  'Valencia': { lat: 39.4699, lng: -0.3763, zoom: 13 },
  'Málaga': { lat: 36.7213, lng: -4.4214, zoom: 13 },
  'Salamanca': { lat: 40.9701, lng: -5.6635, zoom: 14 },
  'Zaragoza': { lat: 41.6488, lng: -0.8891, zoom: 13 },
  'Bilbao': { lat: 43.2630, lng: -2.9350, zoom: 13 },
  'Santiago de Compostela': { lat: 42.8782, lng: -8.5448, zoom: 14 },
};

export default function MapScreen() {
  const router = useRouter();
  const { selectedCity, setSelectedCity } = useAuth();
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCityModal, setShowCityModal] = useState(false);
  const [selectedPiso, setSelectedPiso] = useState<Piso | null>(null);
  const mapRef = useRef<MapView>(null);

  const cityCoords = CITY_COORDS[selectedCity] || CITY_COORDS['Granada'];

  useEffect(() => {
    fetchCiudades();
  }, []);

  useEffect(() => {
    fetchPisos();
  }, [selectedCity]);

  const fetchCiudades = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/ciudades`);
      setCiudades(response.data.ciudades);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchPisos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/pisos`, { 
        params: { ciudad: selectedCity } 
      });
      setPisos(response.data);
      
      // Animate to city
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: cityCoords.lat,
          longitude: cityCoords.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 500);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriceColor = (price: number) => {
    if (price <= 300) return '#4ade80';
    if (price <= 450) return '#ffd700';
    if (price <= 600) return '#ff8c00';
    return '#ff4444';
  };

  const getRatingBadge = (rating: number) => {
    if (rating === 0) return { text: 'Sin valorar', color: '#888' };
    if (rating < 2) return { text: 'Mejorable', color: '#ff4444' };
    if (rating < 3) return { text: 'Regular', color: '#ff8c00' };
    if (rating < 4) return { text: 'Bueno', color: '#ffd700' };
    return { text: 'Excelente', color: '#4ade80' };
  };

  const openInGoogleMaps = (piso: Piso) => {
    const lat = piso.lat || cityCoords.lat;
    const lng = piso.lng || cityCoords.lng;
    const label = encodeURIComponent(piso.direccion);
    
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}&q=${label}`,
      android: `google.navigation:q=${lat},${lng}`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    
    Linking.openURL(url as string);
  };

  const openCityInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/pisos+alquiler+${encodeURIComponent(selectedCity)}`;
    Linking.openURL(url);
  };

  const selectedCiudad = ciudades.find(c => c.nombre === selectedCity);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* City Selector */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.cityBar} onPress={() => setShowCityModal(true)}>
          <Text style={styles.cityEmoji}>{selectedCiudad?.emoji || '🏠'}</Text>
          <View style={styles.cityInfo}>
            <Text style={styles.cityName}>{selectedCity}</Text>
            <Text style={styles.citySubtext}>{pisos.length} pisos en el mapa</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#888" />
        </TouchableOpacity>

        {/* Google Maps button */}
        <TouchableOpacity style={styles.googleMapsButton} onPress={openCityInGoogleMaps}>
          <Ionicons name="navigate" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* City Modal */}
      <Modal visible={showCityModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🇪🇸 Selecciona ciudad</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ciudades}
              keyExtractor={(item) => item.nombre}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.cityOption, 
                    selectedCity === item.nombre && styles.cityOptionActive,
                    item.featured && styles.cityOptionFeatured
                  ]}
                  onPress={() => { 
                    setSelectedCity(item.nombre); 
                    setShowCityModal(false); 
                  }}
                >
                  <Text style={styles.cityOptionEmoji}>{item.emoji}</Text>
                  <Text style={[
                    styles.cityOptionText, 
                    selectedCity === item.nombre && styles.cityOptionTextActive
                  ]}>{item.nombre}</Text>
                  {item.featured && <Ionicons name="star" size={16} color="#ffd700" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Google Maps */}
      <View style={styles.mapWrapper}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffd700" />
            <Text style={styles.loadingText}>Cargando mapa...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: cityCoords.lat,
              longitude: cityCoords.lng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            mapType="standard"
          >
            {pisos.map((piso) => {
              if (!piso.lat || !piso.lng) return null;
              const badge = getRatingBadge(piso.promedio_general);
              
              return (
                <Marker
                  key={piso.id}
                  coordinate={{
                    latitude: piso.lat,
                    longitude: piso.lng,
                  }}
                  onPress={() => setSelectedPiso(piso)}
                >
                  <View style={[styles.markerContainer, { borderColor: getPriceColor(piso.precio_mensual) }]}>
                    <Text style={[styles.markerPrice, { color: getPriceColor(piso.precio_mensual) }]}>
                      {piso.precio_mensual}€
                    </Text>
                  </View>
                </Marker>
              );
            })}
          </MapView>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Precios:</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4ade80' }]} />
            <Text style={styles.legendText}>≤300€</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ffd700' }]} />
            <Text style={styles.legendText}>≤450€</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ff8c00' }]} />
            <Text style={styles.legendText}>≤600€</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ff4444' }]} />
            <Text style={styles.legendText}>+600€</Text>
          </View>
        </View>
      </View>

      {/* Selected Piso Card */}
      {selectedPiso && (
        <View style={styles.pisoCard}>
          <TouchableOpacity 
            style={styles.pisoCardClose} 
            onPress={() => setSelectedPiso(null)}
          >
            <Ionicons name="close" size={20} color="#888" />
          </TouchableOpacity>

          <View style={styles.pisoCardContent}>
            <View style={styles.pisoCardHeader}>
              <Text style={styles.pisoCardZona}>{selectedPiso.zona}</Text>
              <View style={[styles.pisoCardBadge, { backgroundColor: getRatingBadge(selectedPiso.promedio_general).color + '30' }]}>
                <Text style={[styles.pisoCardBadgeText, { color: getRatingBadge(selectedPiso.promedio_general).color }]}>
                  {getRatingBadge(selectedPiso.promedio_general).text}
                </Text>
              </View>
            </View>

            <Text style={styles.pisoCardDireccion} numberOfLines={2}>{selectedPiso.direccion}</Text>

            <View style={styles.pisoCardRow}>
              <Text style={[styles.pisoCardPrecio, { color: getPriceColor(selectedPiso.precio_mensual) }]}>
                {selectedPiso.precio_mensual}€<Text style={styles.pisoCardPerMonth}>/mes</Text>
              </Text>
              <View style={styles.pisoCardRating}>
                <Ionicons name="star" size={14} color="#ffd700" />
                <Text style={styles.pisoCardRatingText}>
                  {selectedPiso.promedio_general.toFixed(1)} ({selectedPiso.total_valoraciones})
                </Text>
              </View>
            </View>

            <View style={styles.pisoCardButtons}>
              <TouchableOpacity 
                style={styles.pisoCardButtonPrimary}
                onPress={() => router.push(`/piso/${selectedPiso.id}`)}
              >
                <Ionicons name="eye" size={18} color="#0f0f1a" />
                <Text style={styles.pisoCardButtonPrimaryText}>Ver detalles</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.pisoCardButtonSecondary}
                onPress={() => openInGoogleMaps(selectedPiso)}
              >
                <Ionicons name="navigate" size={18} color="#4285F4" />
                <Text style={styles.pisoCardButtonSecondaryText}>Google Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Empty state */}
      {!loading && pisos.length === 0 && (
        <View style={styles.emptyOverlay}>
          <View style={styles.emptyCard}>
            <Ionicons name="map-outline" size={48} color="#ffd700" />
            <Text style={styles.emptyTitle}>Sin pisos en {selectedCity}</Text>
            <Text style={styles.emptySubtitle}>Sé el primero en añadir uno</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/add')}
            >
              <Ionicons name="add" size={18} color="#0f0f1a" />
              <Text style={styles.emptyButtonText}>Añadir piso</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0f0f1a' 
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  cityBar: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1a1a2e', 
    padding: 12, 
    borderRadius: 12, 
    gap: 10 
  },
  cityEmoji: { fontSize: 26 },
  cityInfo: { flex: 1 },
  cityName: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  citySubtext: { color: '#888', fontSize: 11 },
  googleMapsButton: {
    backgroundColor: '#4285F4',
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: '#1a1a2e', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    maxHeight: '70%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#2a2a3e' 
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  cityOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    gap: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#2a2a3e' 
  },
  cityOptionActive: { backgroundColor: '#ffd70020' },
  cityOptionFeatured: { borderLeftWidth: 3, borderLeftColor: '#ffd700' },
  cityOptionEmoji: { fontSize: 24 },
  cityOptionText: { flex: 1, color: '#888', fontSize: 16 },
  cityOptionTextActive: { color: '#fff', fontWeight: '600' },
  mapWrapper: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: { 
    flex: 1, 
    backgroundColor: '#1a1a2e', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 14,
  },
  legend: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(15, 15, 26, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendTitle: { color: '#888', fontSize: 10, marginRight: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#888', fontSize: 9 },
  markerContainer: {
    backgroundColor: '#0f0f1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
  },
  markerPrice: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  pisoCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pisoCardClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  pisoCardContent: {},
  pisoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pisoCardZona: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pisoCardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pisoCardBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  pisoCardDireccion: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    paddingRight: 30,
  },
  pisoCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pisoCardPrecio: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pisoCardPerMonth: {
    fontSize: 14,
    color: '#888',
  },
  pisoCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pisoCardRatingText: {
    color: '#888',
    fontSize: 13,
  },
  pisoCardButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  pisoCardButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffd700',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  pisoCardButtonPrimaryText: {
    color: '#0f0f1a',
    fontWeight: '600',
    fontSize: 14,
  },
  pisoCardButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a2a3e',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  pisoCardButtonSecondaryText: {
    color: '#4285F4',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 15, 26, 0.7)',
  },
  emptyCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 32,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: '#ffd700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 6,
  },
  emptyButtonText: {
    color: '#0f0f1a',
    fontWeight: '600',
  },
});
