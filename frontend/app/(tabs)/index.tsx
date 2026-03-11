import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Piso {
  id: string;
  direccion: string;
  zona: string;
  precio_mensual: number;
  descripcion: string | null;
  fotos: string[];
  promedio_general: number;
  total_valoraciones: number;
  created_by_name: string;
}

export default function ExploreScreen() {
  const router = useRouter();
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchZona, setSearchZona] = useState('');
  const [zonas, setZonas] = useState<string[]>([]);

  const fetchPisos = useCallback(async (zona?: string) => {
    try {
      const params = zona ? { zona } : {};
      const response = await axios.get(`${API_URL}/api/pisos`, { params });
      setPisos(response.data);
    } catch (error) {
      console.error('Error fetching pisos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchZonas = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/zonas`);
      setZonas(response.data.zonas);
    } catch (error) {
      console.error('Error fetching zonas:', error);
    }
  };

  useEffect(() => {
    fetchPisos();
    fetchZonas();
  }, [fetchPisos]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPisos(searchZona || undefined);
  };

  const handleSearch = () => {
    setLoading(true);
    fetchPisos(searchZona || undefined);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
          size={16}
          color="#ffd700"
        />
      );
    }
    return stars;
  };

  const renderPiso = ({ item }: { item: Piso }) => (
    <TouchableOpacity
      style={styles.pisoCard}
      onPress={() => router.push(`/piso/${item.id}`)}
    >
      {item.fotos && item.fotos.length > 0 ? (
        <Image
          source={{ uri: item.fotos[0] }}
          style={styles.pisoImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.pisoImagePlaceholder}>
          <Ionicons name="home" size={40} color="#444" />
        </View>
      )}
      <View style={styles.pisoInfo}>
        <Text style={styles.pisoZona}>{item.zona}</Text>
        <Text style={styles.pisoDireccion} numberOfLines={1}>
          {item.direccion}
        </Text>
        <Text style={styles.pisoPrecio}>{item.precio_mensual}€/mes</Text>
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>{renderStars(item.promedio_general)}</View>
          <Text style={styles.ratingText}>
            {item.promedio_general.toFixed(1)} ({item.total_valoraciones})
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por zona..."
            placeholderTextColor="#666"
            value={searchZona}
            onChangeText={setSearchZona}
            onSubmitEditing={handleSearch}
          />
          {searchZona.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchZona('');
                fetchPisos();
              }}
            >
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#0f0f1a" />
        </TouchableOpacity>
      </View>

      {zonas.length > 0 && (
        <View style={styles.zonasContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={zonas}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.zonaChip,
                  searchZona === item && styles.zonaChipActive,
                ]}
                onPress={() => {
                  setSearchZona(item);
                  setLoading(true);
                  fetchPisos(item);
                }}
              >
                <Text
                  style={[
                    styles.zonaChipText,
                    searchZona === item && styles.zonaChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffd700" />
        </View>
      ) : pisos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="home-outline" size={64} color="#444" />
          <Text style={styles.emptyText}>No hay pisos disponibles</Text>
          <Text style={styles.emptySubtext}>
            Sé el primero en añadir un piso
          </Text>
        </View>
      ) : (
        <FlatList
          data={pisos}
          keyExtractor={(item) => item.id}
          renderItem={renderPiso}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffd700"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#fff',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#ffd700',
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zonasContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  zonaChip: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  zonaChipActive: {
    backgroundColor: '#ffd700',
  },
  zonaChipText: {
    color: '#888',
    fontSize: 14,
  },
  zonaChipTextActive: {
    color: '#0f0f1a',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  pisoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  pisoImage: {
    width: '100%',
    height: 180,
  },
  pisoImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#2a2a3e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pisoInfo: {
    padding: 16,
  },
  pisoZona: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  pisoDireccion: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  pisoPrecio: {
    color: '#4ade80',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
  },
  ratingText: {
    color: '#888',
    fontSize: 14,
  },
});
