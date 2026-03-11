import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

interface ZoneStats {
  zona: string;
  total_pisos: number;
  precio_medio: number;
  precio_min: number;
  precio_max: number;
  valoracion_media: number;
}

interface GeneralStats {
  total_pisos: number;
  total_valoraciones: number;
  total_usuarios: number;
  precio_medio_granada: number;
  zonas: ZoneStats[];
}

export default function StatsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<GeneralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stats`);
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
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color="#ffd700"
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffd700" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>📊 Estadísticas Granada</Text>
          <Text style={styles.subtitle}>Datos en tiempo real del mercado</Text>
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

        {/* Average Price Banner */}
        <View style={styles.avgPriceBanner}>
          <View style={styles.avgPriceContent}>
            <Text style={styles.avgPriceLabel}>Precio medio en Granada</Text>
            <Text style={[styles.avgPriceNumber, { color: getPriceColor(stats?.precio_medio_granada || 0) }]}>
              {stats?.precio_medio_granada || 0}€/mes
            </Text>
          </View>
          <View style={styles.targetContainer}>
            <Text style={styles.targetLabel}>Objetivo</Text>
            <Text style={styles.targetNumber}>300€</Text>
          </View>
        </View>

        {/* Progress to Goal */}
        {stats && stats.precio_medio_granada > 0 && (
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>📉 Progreso hacia precios justos</Text>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${Math.min(100, (300 / stats.precio_medio_granada) * 100)}%`,
                    backgroundColor: stats.precio_medio_granada <= 300 ? '#4ade80' : '#ffd700'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {stats.precio_medio_granada <= 300 
                ? '🎉 ¡Objetivo conseguido!' 
                : `Falta bajar ${Math.round(stats.precio_medio_granada - 300)}€ de media`}
            </Text>
          </View>
        )}

        {/* Zone Stats */}
        <View style={styles.zonesSection}>
          <Text style={styles.sectionTitle}>💰 Precios por zona</Text>
          <Text style={styles.sectionSubtitle}>De más barato a más caro</Text>
          
          {stats?.zonas.map((zona, index) => (
            <TouchableOpacity 
              key={zona.zona} 
              style={styles.zoneCard}
              onPress={() => router.push(`/(tabs)?zona=${zona.zona}`)}
            >
              <View style={styles.zoneRank}>
                <Text style={styles.zoneRankNumber}>#{index + 1}</Text>
              </View>
              <View style={styles.zoneInfo}>
                <Text style={styles.zoneName}>{zona.zona}</Text>
                <View style={styles.zoneStars}>
                  {renderStars(zona.valoracion_media)}
                  <Text style={styles.zoneRating}>{zona.valoracion_media.toFixed(1)}</Text>
                </View>
                <Text style={styles.zonePisos}>{zona.total_pisos} pisos</Text>
              </View>
              <View style={styles.zonePrices}>
                <Text style={[styles.zoneAvgPrice, { color: getPriceColor(zona.precio_medio) }]}>
                  {zona.precio_medio}€
                </Text>
                <Text style={styles.zonePriceRange}>
                  {zona.precio_min}€ - {zona.precio_max}€
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>
          ))}

          {(!stats?.zonas || stats.zonas.length === 0) && (
            <View style={styles.emptyZones}>
              <Ionicons name="analytics-outline" size={48} color="#444" />
              <Text style={styles.emptyText}>No hay datos todavía</Text>
              <Text style={styles.emptySubtext}>¡Añade pisos para ver estadísticas!</Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 ¿Sabías que...?</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              En 2010, el precio medio de una habitación en Granada era de unos 200€. 
              Hoy, muchos caseros piden más de 500€ por lo mismo. 
              ¡Juntos podemos cambiar esto!
            </Text>
          </View>
        </View>
      </ScrollView>
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
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  generalStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  avgPriceBanner: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avgPriceContent: {
    flex: 1,
  },
  avgPriceLabel: {
    color: '#888',
    fontSize: 14,
  },
  avgPriceNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  targetContainer: {
    backgroundColor: '#1a2e1a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  targetLabel: {
    color: '#4ade80',
    fontSize: 12,
  },
  targetNumber: {
    color: '#4ade80',
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
  },
  progressTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#2a2a3e',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    color: '#888',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  zonesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  zoneRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a3e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  zoneRankNumber: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  zoneStars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  zoneRating: {
    color: '#888',
    fontSize: 12,
    marginLeft: 4,
  },
  zonePisos: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  zonePrices: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  zoneAvgPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  zonePriceRange: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  emptyZones: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 12,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  infoSection: {
    padding: 16,
    paddingBottom: 32,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#1a2a2a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4ecdc433',
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
  },
});
