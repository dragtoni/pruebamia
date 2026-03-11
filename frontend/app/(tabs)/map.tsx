import React, { useState, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

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

interface Zona {
  nombre: string;
  lat: number;
  lng: number;
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

export default function MapScreen() {
  const router = useRouter();
  const { selectedCity, setSelectedCity } = useAuth();
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCityModal, setShowCityModal] = useState(false);
  const [selectedZona, setSelectedZona] = useState<string | null>(null);

  const cityCoords = CITY_COORDS[selectedCity] || CITY_COORDS['Granada'];

  useEffect(() => {
    fetchCiudades();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedCity]);

  const fetchCiudades = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/ciudades`);
      setCiudades(response.data.ciudades);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pisosRes, zonasRes] = await Promise.all([
        axios.get(`${API_URL}/api/pisos`, { params: { ciudad: selectedCity } }),
        axios.get(`${API_URL}/api/ciudades/${selectedCity}/zonas`),
      ]);
      setPisos(pisosRes.data);
      setZonas(zonasRes.data.zonas);
      setSelectedZona(null);
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
    if (rating === 0) return { text: 'Sin valorar', color: '#888', emoji: '❓' };
    if (rating < 2) return { text: 'Mejorable', color: '#ff4444', emoji: '⚠️' };
    if (rating < 3) return { text: 'Regular', color: '#ff8c00', emoji: '🤔' };
    if (rating < 4) return { text: 'Bueno', color: '#ffd700', emoji: '👍' };
    return { text: 'Excelente', color: '#4ade80', emoji: '✅' };
  };

  // Open Google Maps with address search
  const openInGoogleMaps = (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}, España`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url);
  };

  // Open Google Maps for the entire city with rental search
  const openCityInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/pisos+alquiler+${encodeURIComponent(selectedCity)}+España`;
    Linking.openURL(url);
  };

  // Open Google Maps for a specific zone
  const openZoneInGoogleMaps = (zona: string) => {
    const url = `https://www.google.com/maps/search/${encodeURIComponent(zona)}+${encodeURIComponent(selectedCity)}+España`;
    Linking.openURL(url);
  };

  const getZonePisos = (zona: string) => pisos.filter(p => p.zona === zona);
  
  const getZoneAvgPrice = (zona: string) => {
    const zonePisos = getZonePisos(zona);
    if (zonePisos.length === 0) return 0;
    return Math.round(zonePisos.reduce((acc, p) => acc + p.precio_mensual, 0) / zonePisos.length);
  };

  const getZoneAvgRating = (zona: string) => {
    const zonePisos = getZonePisos(zona);
    if (zonePisos.length === 0) return 0;
    return zonePisos.reduce((acc, p) => acc + p.promedio_general, 0) / zonePisos.length;
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
            <Text style={styles.citySubtext}>{zonas.length} zonas • {pisos.length} pisos</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#888" />
        </TouchableOpacity>

        {/* Google Maps button */}
        <TouchableOpacity style={styles.googleMapsButton} onPress={openCityInGoogleMaps}>
          <Ionicons name="map" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={18} color="#4285F4" />
        <Text style={styles.infoBannerText}>Toca una zona para ver pisos o ábrela en Google Maps</Text>
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffd700" />
          <Text style={styles.loadingText}>Cargando zonas...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Zones Grid */}
          <View style={styles.zonesGrid}>
            {zonas.map((zona) => {
              const zonePisos = getZonePisos(zona.nombre);
              const avgPrice = getZoneAvgPrice(zona.nombre);
              const avgRating = getZoneAvgRating(zona.nombre);
              const isSelected = selectedZona === zona.nombre;
              const ratingBadge = getRatingBadge(avgRating);
              
              return (
                <TouchableOpacity
                  key={zona.nombre}
                  style={[
                    styles.zoneCard,
                    isSelected && styles.zoneCardSelected,
                  ]}
                  onPress={() => setSelectedZona(isSelected ? null : zona.nombre)}
                >
                  <View style={styles.zoneCardHeader}>
                    <Text style={styles.zoneCardName} numberOfLines={1}>{zona.nombre}</Text>
                    {zonePisos.length > 0 && (
                      <View style={styles.zoneCardBadge}>
                        <Text style={styles.zoneCardBadgeText}>{zonePisos.length}</Text>
                      </View>
                    )}
                  </View>
                  
                  {avgPrice > 0 ? (
                    <>
                      <Text style={[styles.zoneCardPrice, { color: getPriceColor(avgPrice) }]}>
                        {avgPrice}€<Text style={styles.zoneCardPriceUnit}>/mes</Text>
                      </Text>
                      <View style={styles.zoneCardRating}>
                        <Text style={styles.zoneCardRatingEmoji}>{ratingBadge.emoji}</Text>
                        <Text style={[styles.zoneCardRatingText, { color: ratingBadge.color }]}>
                          {avgRating.toFixed(1)}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.zoneCardEmpty}>Sin datos</Text>
                  )}

                  {/* Google Maps mini button */}
                  <TouchableOpacity 
                    style={styles.zoneMapButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      openZoneInGoogleMaps(zona.nombre);
                    }}
                  >
                    <Ionicons name="navigate-outline" size={14} color="#4285F4" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Precios medios:</Text>
            <View style={styles.legendItems}>
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
        </ScrollView>
      )}

      {/* Selected Zone Details */}
      {selectedZona && (
        <View style={styles.zoneDetails}>
          <View style={styles.zoneDetailsHeader}>
            <View>
              <Text style={styles.zoneDetailsTitle}>{selectedZona}</Text>
              <Text style={styles.zoneDetailsSubtitle}>
                {getZonePisos(selectedZona).length} pisos en esta zona
              </Text>
            </View>
            <View style={styles.zoneDetailsActions}>
              <TouchableOpacity 
                style={styles.googleMapsSmallButton}
                onPress={() => openZoneInGoogleMaps(selectedZona)}
              >
                <Ionicons name="map" size={18} color="#fff" />
                <Text style={styles.googleMapsSmallButtonText}>Maps</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedZona(null)}>
                <Ionicons name="close-circle" size={28} color="#888" />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pisosScroll}>
            {getZonePisos(selectedZona).length === 0 ? (
              <View style={styles.noPisos}>
                <Ionicons name="home-outline" size={32} color="#444" />
                <Text style={styles.noPisosText}>No hay pisos en esta zona</Text>
                <TouchableOpacity 
                  style={styles.addPisoButton} 
                  onPress={() => router.push('/(tabs)/add')}
                >
                  <Ionicons name="add" size={16} color="#0f0f1a" />
                  <Text style={styles.addPisoText}>Añadir piso</Text>
                </TouchableOpacity>
              </View>
            ) : (
              getZonePisos(selectedZona).map((piso) => {
                const badge = getRatingBadge(piso.promedio_general);
                return (
                  <TouchableOpacity 
                    key={piso.id} 
                    style={styles.pisoCard} 
                    onPress={() => router.push(`/piso/${piso.id}`)}
                  >
                    <View style={styles.pisoCardHeader}>
                      <Text style={styles.pisoEmoji}>{badge.emoji}</Text>
                      <TouchableOpacity 
                        style={styles.pisoMapButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          openInGoogleMaps(piso.direccion, piso.ciudad);
                        }}
                      >
                        <Ionicons name="navigate" size={14} color="#4285F4" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.pisoDireccion} numberOfLines={2}>{piso.direccion}</Text>
                    <Text style={[styles.pisoPrecio, { color: getPriceColor(piso.precio_mensual) }]}>
                      {piso.precio_mensual}€
                    </Text>
                    <View style={styles.pisoRating}>
                      <Ionicons name="star" size={12} color="#ffd700" />
                      <Text style={styles.pisoRatingText}>
                        {piso.promedio_general.toFixed(1)} ({piso.total_valoraciones})
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2a3e',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  infoBannerText: {
    color: '#888',
    fontSize: 12,
    flex: 1,
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
  loadingContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  zonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  zoneCard: {
    width: (width - 52) / 2,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  zoneCardSelected: {
    borderColor: '#ffd700',
    borderWidth: 2,
    backgroundColor: '#1a1a2e',
  },
  zoneCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  zoneCardName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  zoneCardBadge: {
    backgroundColor: '#ffd700',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneCardBadgeText: {
    color: '#0f0f1a',
    fontSize: 11,
    fontWeight: 'bold',
  },
  zoneCardPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  zoneCardPriceUnit: {
    fontSize: 12,
    color: '#888',
  },
  zoneCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  zoneCardRatingEmoji: {
    fontSize: 14,
  },
  zoneCardRatingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  zoneCardEmpty: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  zoneMapButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#1a2a3e',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  legend: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  legendTitle: { 
    color: '#888', 
    fontSize: 12, 
    marginBottom: 8 
  },
  legendItems: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  legendItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  legendDot: { 
    width: 12, 
    height: 12, 
    borderRadius: 6 
  },
  legendText: { 
    color: '#888', 
    fontSize: 11 
  },
  zoneDetails: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: 220,
  },
  zoneDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  zoneDetailsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  zoneDetailsSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  zoneDetailsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleMapsSmallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  googleMapsSmallButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  pisosScroll: {
    flexGrow: 0,
  },
  noPisos: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  noPisosText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  addPisoButton: {
    flexDirection: 'row',
    backgroundColor: '#ffd700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addPisoText: {
    color: '#0f0f1a',
    fontWeight: '600',
    fontSize: 13,
  },
  pisoCard: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 140,
  },
  pisoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pisoEmoji: {
    fontSize: 20,
  },
  pisoMapButton: {
    backgroundColor: '#1a2a3e',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  pisoDireccion: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 16,
  },
  pisoPrecio: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pisoRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pisoRatingText: {
    color: '#888',
    fontSize: 11,
  },
});
