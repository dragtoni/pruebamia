import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width, height } = Dimensions.get('window');

// Granada center coordinates
const GRANADA_CENTER = {
  latitude: 37.1773,
  longitude: -3.5986,
};

interface Piso {
  id: string;
  direccion: string;
  zona: string;
  precio_mensual: number;
  promedio_general: number;
  total_valoraciones: number;
  lat: number | null;
  lng: number | null;
}

interface ZoneCoords {
  [key: string]: { lat: number; lng: number };
}

export default function MapScreen() {
  const router = useRouter();
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [zonesCoords, setZonesCoords] = useState<ZoneCoords>({});
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pisosRes, zonesRes] = await Promise.all([
        axios.get(`${API_URL}/api/pisos`),
        axios.get(`${API_URL}/api/zonas/coords`),
      ]);
      setPisos(pisosRes.data);
      setZonesCoords(zonesRes.data.zonas);
    } catch (error) {
      console.error('Error fetching data:', error);
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
    if (rating === 0) return { emoji: '❓', text: 'Sin valorar' };
    if (rating < 2) return { emoji: '🚨', text: 'Peligro' };
    if (rating < 3) return { emoji: '⚠️', text: 'Cuidado' };
    if (rating < 4) return { emoji: '👍', text: 'Decente' };
    return { emoji: '✅', text: 'Top' };
  };

  const getZonePisos = (zona: string) => {
    return pisos.filter(p => p.zona === zona);
  };

  const getZoneAvgPrice = (zona: string) => {
    const zonePisos = getZonePisos(zona);
    if (zonePisos.length === 0) return 0;
    return Math.round(zonePisos.reduce((acc, p) => acc + p.precio_mensual, 0) / zonePisos.length);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffd700" />
        <Text style={styles.loadingText}>Cargando mapa de Granada...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Mapa de Granada</Text>
        <Text style={styles.subtitle}>Toca una zona para ver pisos</Text>
      </View>

      {/* Map Visualization */}
      <View style={styles.mapContainer}>
        {/* Simple grid-based map representation */}
        <View style={styles.mapGrid}>
          {Object.entries(zonesCoords).map(([zona, coords]) => {
            const zonePisos = getZonePisos(zona);
            const avgPrice = getZoneAvgPrice(zona);
            const isSelected = selectedZone === zona;
            
            return (
              <TouchableOpacity
                key={zona}
                style={[
                  styles.zoneMarker,
                  isSelected && styles.zoneMarkerSelected,
                  { backgroundColor: avgPrice > 0 ? getPriceColor(avgPrice) + '40' : '#2a2a3e' }
                ]}
                onPress={() => setSelectedZone(isSelected ? null : zona)}
              >
                <Text style={styles.zoneMarkerName}>{zona}</Text>
                {zonePisos.length > 0 && (
                  <View style={styles.zoneMarkerBadge}>
                    <Text style={styles.zoneMarkerCount}>{zonePisos.length}</Text>
                  </View>
                )}
                {avgPrice > 0 && (
                  <Text style={[styles.zoneMarkerPrice, { color: getPriceColor(avgPrice) }]}>
                    {avgPrice}€
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Precios:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4ade80' }]} />
              <Text style={styles.legendText}>≤300€</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#ffd700' }]} />
              <Text style={styles.legendText}>≤450€</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#ff8c00' }]} />
              <Text style={styles.legendText}>≤600€</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#ff4444' }]} />
              <Text style={styles.legendText}>>600€</Text>
            </View>
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
              getZonePisos(selectedZone).map((piso) => {
                const badge = getRatingBadge(piso.promedio_general);
                return (
                  <TouchableOpacity
                    key={piso.id}
                    style={styles.pisoCard}
                    onPress={() => router.push(`/piso/${piso.id}`)}
                  >
                    <Text style={styles.pisoEmoji}>{badge.emoji}</Text>
                    <Text style={styles.pisoDireccion} numberOfLines={2}>
                      {piso.direccion}
                    </Text>
                    <Text style={[styles.pisoPrecio, { color: getPriceColor(piso.precio_mensual) }]}>
                      {piso.precio_mensual}€/mes
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

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStatItem}>
          <Ionicons name="home" size={20} color="#ffd700" />
          <Text style={styles.quickStatText}>{pisos.length} pisos</Text>
        </View>
        <View style={styles.quickStatItem}>
          <Ionicons name="location" size={20} color="#4ecdc4" />
          <Text style={styles.quickStatText}>{Object.keys(zonesCoords).length} zonas</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
    padding: 16,
  },
  mapGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    gap: 8,
  },
  zoneMarker: {
    width: (width - 64) / 3,
    aspectRatio: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  zoneMarkerSelected: {
    borderColor: '#ffd700',
    borderWidth: 2,
  },
  zoneMarkerName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  zoneMarkerBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ffd700',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneMarkerCount: {
    color: '#0f0f1a',
    fontSize: 10,
    fontWeight: 'bold',
  },
  zoneMarkerPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  legendTitle: {
    color: '#888',
    fontSize: 12,
  },
  legendItems: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    color: '#888',
    fontSize: 10,
  },
  zoneDetails: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: 200,
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
  },
  pisoCard: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 140,
  },
  pisoEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  pisoDireccion: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  pisoPrecio: {
    fontSize: 16,
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
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 12,
    backgroundColor: '#1a1a2e',
  },
  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickStatText: {
    color: '#888',
    fontSize: 14,
  },
});
