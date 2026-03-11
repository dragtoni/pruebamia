import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface ZoneStats {
  zona: string;
  ciudad: string;
  total_pisos: number;
  precio_medio: number;
  precio_min: number;
  precio_max: number;
  valoracion_media: number;
}

interface CityStats {
  ciudad: string;
  emoji: string;
  total_pisos: number;
  precio_medio: number;
  valoracion_media: number;
  featured: boolean;
}

interface GeneralStats {
  total_pisos: number;
  total_valoraciones: number;
  total_usuarios: number;
  precio_medio_espana: number;
  ciudades: CityStats[];
  zonas: ZoneStats[];
}

export default function StatsScreen() {
  const router = useRouter();
  const { selectedCity, setSelectedCity } = useAuth();
  const [stats, setStats] = useState<GeneralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'espana' | 'ciudad'>('espana');
  const [showCityModal, setShowCityModal] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [selectedCity, viewMode]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = viewMode === 'ciudad' ? { ciudad: selectedCity } : {};
      const response = await axios.get(`${API_URL}/api/stats`, { params });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={12} color="#ffd700" />);
    }
    return stars;
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#ffd700" /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>📊 Estadísticas</Text>
          <Text style={styles.subtitle}>{viewMode === 'espana' ? 'Toda España' : selectedCity}</Text>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'espana' && styles.toggleButtonActive]}
            onPress={() => setViewMode('espana')}
          >
            <Text style={styles.toggleEmoji}>🇪🇸</Text>
            <Text style={[styles.toggleText, viewMode === 'espana' && styles.toggleTextActive]}>España</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'ciudad' && styles.toggleButtonActive]}
            onPress={() => setViewMode('ciudad')}
          >
            <Text style={styles.toggleEmoji}>🏙️</Text>
            <Text style={[styles.toggleText, viewMode === 'ciudad' && styles.toggleTextActive]}>{selectedCity}</Text>
          </TouchableOpacity>
        </View>

        {/* General Stats */}
        <View style={styles.generalStats}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏠</Text>
            <Text style={styles.statNumber}>{stats?.total_pisos || 0}</Text>
            <Text style={styles.statLabel}>Pisos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statNumber}>{stats?.total_valoraciones || 0}</Text>
            <Text style={styles.statLabel}>Valoraciones</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>👥</Text>
            <Text style={styles.statNumber}>{stats?.total_usuarios || 0}</Text>
            <Text style={styles.statLabel}>Usuarios</Text>
          </View>
        </View>

        {/* Average Price */}
        <View style={styles.avgPriceBanner}>
          <View style={styles.avgPriceContent}>
            <Text style={styles.avgPriceLabel}>Precio medio {viewMode === 'espana' ? 'España' : selectedCity}</Text>
            <Text style={[styles.avgPriceNumber, { color: getPriceColor(stats?.precio_medio_espana || 0) }]}>
              {stats?.precio_medio_espana || 0}€/mes
            </Text>
          </View>
          <View style={styles.targetContainer}>
            <Text style={styles.targetLabel}>Objetivo</Text>
            <Text style={styles.targetNumber}>300€</Text>
          </View>
        </View>

        {/* Cities Ranking (only in Spain mode) */}
        {viewMode === 'espana' && stats?.ciudades && stats.ciudades.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏙️ Precios por ciudad</Text>
            {stats.ciudades.map((city, index) => (
              <TouchableOpacity
                key={city.ciudad}
                style={[styles.cityCard, city.featured && styles.cityCardFeatured]}
                onPress={() => { setSelectedCity(city.ciudad); setViewMode('ciudad'); }}
              >
                <View style={styles.cityRank}>
                  <Text style={styles.cityRankNumber}>#{index + 1}</Text>
                </View>
                <Text style={styles.cityCardEmoji}>{city.emoji}</Text>
                <View style={styles.cityCardInfo}>
                  <Text style={styles.cityCardName}>{city.ciudad}</Text>
                  <Text style={styles.cityCardPisos}>{city.total_pisos} pisos</Text>
                </View>
                <Text style={[styles.cityCardPrice, { color: getPriceColor(city.precio_medio) }]}>
                  {city.precio_medio}€
                </Text>
                {city.featured && <Ionicons name="star" size={16} color="#ffd700" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Zone Stats */}
        {stats?.zonas && stats.zonas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Precios por zona</Text>
            {stats.zonas.map((zona, index) => (
              <View key={`${zona.ciudad}-${zona.zona}`} style={styles.zoneCard}>
                <View style={styles.zoneRank}>
                  <Text style={styles.zoneRankNumber}>#{index + 1}</Text>
                </View>
                <View style={styles.zoneInfo}>
                  <Text style={styles.zoneName}>{zona.zona}</Text>
                  <Text style={styles.zoneCiudad}>{zona.ciudad} • {zona.total_pisos} pisos</Text>
                  <View style={styles.zoneStars}>{renderStars(zona.valoracion_media)}</View>
                </View>
                <View style={styles.zonePrices}>
                  <Text style={[styles.zoneAvgPrice, { color: getPriceColor(zona.precio_medio) }]}>{zona.precio_medio}€</Text>
                  <Text style={styles.zonePriceRange}>{zona.precio_min}-{zona.precio_max}€</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {(!stats?.zonas || stats.zonas.length === 0) && (
          <View style={styles.emptySection}>
            <Ionicons name="analytics-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>No hay datos todavía</Text>
            <Text style={styles.emptySubtext}>¡Añade pisos para ver estadísticas!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  loadingContainer: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' },
  header: { padding: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 2 },
  viewToggle: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 12 },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e', paddingVertical: 12, borderRadius: 12, gap: 8 },
  toggleButtonActive: { backgroundColor: '#ffd700' },
  toggleEmoji: { fontSize: 18 },
  toggleText: { color: '#888', fontSize: 14, fontWeight: '600' },
  toggleTextActive: { color: '#0f0f1a' },
  generalStats: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 14, padding: 14, alignItems: 'center' },
  statEmoji: { fontSize: 22, marginBottom: 6 },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  avgPriceBanner: { flexDirection: 'row', backgroundColor: '#1a1a2e', margin: 16, borderRadius: 14, padding: 18, alignItems: 'center', justifyContent: 'space-between' },
  avgPriceContent: { flex: 1 },
  avgPriceLabel: { color: '#888', fontSize: 13 },
  avgPriceNumber: { fontSize: 30, fontWeight: 'bold', marginTop: 4 },
  targetContainer: { backgroundColor: '#1a2e1a', borderRadius: 10, padding: 10, alignItems: 'center' },
  targetLabel: { color: '#4ade80', fontSize: 11 },
  targetNumber: { color: '#4ade80', fontSize: 18, fontWeight: 'bold' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  cityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10, gap: 10 },
  cityCardFeatured: { borderLeftWidth: 3, borderLeftColor: '#ffd700' },
  cityRank: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2a2a3e', alignItems: 'center', justifyContent: 'center' },
  cityRankNumber: { color: '#ffd700', fontSize: 12, fontWeight: 'bold' },
  cityCardEmoji: { fontSize: 24 },
  cityCardInfo: { flex: 1 },
  cityCardName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cityCardPisos: { color: '#888', fontSize: 12 },
  cityCardPrice: { fontSize: 18, fontWeight: 'bold' },
  zoneCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 12, marginBottom: 10 },
  zoneRank: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#2a2a3e', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  zoneRankNumber: { color: '#ffd700', fontSize: 11, fontWeight: 'bold' },
  zoneInfo: { flex: 1 },
  zoneName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  zoneCiudad: { color: '#888', fontSize: 11 },
  zoneStars: { flexDirection: 'row', marginTop: 2 },
  zonePrices: { alignItems: 'flex-end' },
  zoneAvgPrice: { fontSize: 18, fontWeight: 'bold' },
  zonePriceRange: { color: '#666', fontSize: 10 },
  emptySection: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 12 },
  emptySubtext: { color: '#666', fontSize: 13, marginTop: 4 },
});
