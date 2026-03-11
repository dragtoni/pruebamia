import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Modal,
  FlatList,
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
}

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

export default function MapScreen() {
  const router = useRouter();
  const { selectedCity, setSelectedCity } = useAuth();
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showCityModal, setShowCityModal] = useState(false);

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
      setSelectedZone(null);
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

  const getRatingEmoji = (rating: number) => {
    if (rating === 0) return '❓';
    if (rating < 2) return '🚨';
    if (rating < 3) return '⚠️';
    if (rating < 4) return '👍';
    return '✅';
  };

  const getZonePisos = (zona: string) => pisos.filter(p => p.zona === zona);
  const getZoneAvgPrice = (zona: string) => {
    const zonePisos = getZonePisos(zona);
    if (zonePisos.length === 0) return 0;
    return Math.round(zonePisos.reduce((acc, p) => acc + p.precio_mensual, 0) / zonePisos.length);
  };

  const selectedCiudad = ciudades.find(c => c.nombre === selectedCity);

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#ffd700" /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* City Selector */}
      <TouchableOpacity style={styles.cityBar} onPress={() => setShowCityModal(true)}>
        <Text style={styles.cityEmoji}>{selectedCiudad?.emoji || '🏠'}</Text>
        <View style={styles.cityInfo}>
          <Text style={styles.cityName}>{selectedCity}</Text>
          <Text style={styles.citySubtext}>{zonas.length} zonas</Text>
        </View>
        {selectedCiudad?.featured && (
          <View style={styles.featuredTag}>
            <Ionicons name="star" size={12} color="#ffd700" />
          </View>
        )}
        <Ionicons name="chevron-down" size={20} color="#888" />
      </TouchableOpacity>

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
                  style={[styles.cityOption, selectedCity === item.nombre && styles.cityOptionActive, item.featured && styles.cityOptionFeatured]}
                  onPress={() => { setSelectedCity(item.nombre); setShowCityModal(false); }}
                >
                  <Text style={styles.cityOptionEmoji}>{item.emoji}</Text>
                  <Text style={[styles.cityOptionText, selectedCity === item.nombre && styles.cityOptionTextActive]}>{item.nombre}</Text>
                  {item.featured && <Ionicons name="star" size={16} color="#ffd700" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Map Grid */}
      <View style={styles.mapContainer}>
        <View style={styles.mapGrid}>
          {zonas.map((zona) => {
            const zonePisos = getZonePisos(zona.nombre);
            const avgPrice = getZoneAvgPrice(zona.nombre);
            const isSelected = selectedZone === zona.nombre;
            
            return (
              <TouchableOpacity
                key={zona.nombre}
                style={[
                  styles.zoneMarker,
                  isSelected && styles.zoneMarkerSelected,
                  { backgroundColor: avgPrice > 0 ? getPriceColor(avgPrice) + '30' : '#2a2a3e' }
                ]}
                onPress={() => setSelectedZone(isSelected ? null : zona.nombre)}
              >
                <Text style={styles.zoneMarkerName}>{zona.nombre}</Text>
                {zonePisos.length > 0 && (
                  <View style={styles.zoneMarkerBadge}>
                    <Text style={styles.zoneMarkerCount}>{zonePisos.length}</Text>
                  </View>
                )}
                {avgPrice > 0 && (
                  <Text style={[styles.zoneMarkerPrice, { color: getPriceColor(avgPrice) }]}>{avgPrice}€</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Precios:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#4ade80' }]} /><Text style={styles.legendText}>≤300€</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#ffd700' }]} /><Text style={styles.legendText}>≤450€</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#ff8c00' }]} /><Text style={styles.legendText}>≤600€</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#ff4444' }]} /><Text style={styles.legendText}>>600€</Text></View>
          </View>
        </View>
      </View>

      {/* Selected Zone Details */}
      {selectedZone && (
        <View style={styles.zoneDetails}>
          <View style={styles.zoneDetailsHeader}>
            <Text style={styles.zoneDetailsTitle}>{selectedZone}</Text>
            <TouchableOpacity onPress={() => setSelectedZone(null)}>
              <Ionicons name="close-circle" size={24} color="#888" />
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pisosScroll}>
            {getZonePisos(selectedZone).length === 0 ? (
              <View style={styles.noPisos}>
                <Text style={styles.noPisosText}>No hay pisos</Text>
                <TouchableOpacity style={styles.addPisoButton} onPress={() => router.push('/(tabs)/add')}>
                  <Ionicons name="add" size={16} color="#0f0f1a" />
                  <Text style={styles.addPisoText}>Añadir</Text>
                </TouchableOpacity>
              </View>
            ) : (
              getZonePisos(selectedZone).map((piso) => (
                <TouchableOpacity key={piso.id} style={styles.pisoCard} onPress={() => router.push(`/piso/${piso.id}`)}>
                  <Text style={styles.pisoEmoji}>{getRatingEmoji(piso.promedio_general)}</Text>
                  <Text style={styles.pisoDireccion} numberOfLines={2}>{piso.direccion}</Text>
                  <Text style={[styles.pisoPrecio, { color: getPriceColor(piso.precio_mensual) }]}>{piso.precio_mensual}€</Text>
                  <View style={styles.pisoRating}>
                    <Ionicons name="star" size={10} color="#ffd700" />
                    <Text style={styles.pisoRatingText}>{piso.promedio_general.toFixed(1)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStatItem}>
          <Ionicons name="home" size={18} color="#ffd700" />
          <Text style={styles.quickStatText}>{pisos.length} pisos</Text>
        </View>
        <View style={styles.quickStatItem}>
          <Ionicons name="location" size={18} color="#4ecdc4" />
          <Text style={styles.quickStatText}>{zonas.length} zonas</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  loadingContainer: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' },
  cityBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', marginHorizontal: 16, marginTop: 8, padding: 12, borderRadius: 12, gap: 10 },
  cityEmoji: { fontSize: 26 },
  cityInfo: { flex: 1 },
  cityName: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  citySubtext: { color: '#888', fontSize: 11 },
  featuredTag: { backgroundColor: '#ffd70020', padding: 4, borderRadius: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a3e' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  cityOption: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a3e' },
  cityOptionActive: { backgroundColor: '#ffd70020' },
  cityOptionFeatured: { borderLeftWidth: 3, borderLeftColor: '#ffd700' },
  cityOptionEmoji: { fontSize: 24 },
  cityOptionText: { flex: 1, color: '#888', fontSize: 16 },
  cityOptionTextActive: { color: '#fff', fontWeight: '600' },
  mapContainer: { flex: 1, padding: 16 },
  mapGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: 8 },
  zoneMarker: { width: (width - 56) / 3, aspectRatio: 1, borderRadius: 10, padding: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2a3e' },
  zoneMarkerSelected: { borderColor: '#ffd700', borderWidth: 2 },
  zoneMarkerName: { color: '#fff', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  zoneMarkerBadge: { position: 'absolute', top: 3, right: 3, backgroundColor: '#ffd700', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  zoneMarkerCount: { color: '#0f0f1a', fontSize: 9, fontWeight: 'bold' },
  zoneMarkerPrice: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 8 },
  legendTitle: { color: '#888', fontSize: 11 },
  legendItems: { flexDirection: 'row', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  legendColor: { width: 10, height: 10, borderRadius: 2 },
  legendText: { color: '#888', fontSize: 9 },
  zoneDetails: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 14, maxHeight: 180 },
  zoneDetailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  zoneDetailsTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  pisosScroll: { flexGrow: 0 },
  noPisos: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24 },
  noPisosText: { color: '#888', fontSize: 13, marginBottom: 8 },
  addPisoButton: { flexDirection: 'row', backgroundColor: '#ffd700', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6, gap: 4 },
  addPisoText: { color: '#0f0f1a', fontWeight: '600', fontSize: 12 },
  pisoCard: { backgroundColor: '#2a2a3e', borderRadius: 10, padding: 10, marginRight: 10, width: 120 },
  pisoEmoji: { fontSize: 18, marginBottom: 2 },
  pisoDireccion: { color: '#fff', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  pisoPrecio: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  pisoRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  pisoRatingText: { color: '#888', fontSize: 10 },
  quickStats: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 10, backgroundColor: '#1a1a2e' },
  quickStatItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  quickStatText: { color: '#888', fontSize: 13 },
});
