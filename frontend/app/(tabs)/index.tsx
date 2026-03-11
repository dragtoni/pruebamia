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
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Granada zones for students
const GRANADA_ZONES = ['Centro', 'Realejo', 'Albaicín', 'Zaidín', 'Camino de Ronda', 'Facultades', 'Cartuja', 'Chana', 'Beiro'];

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
  const [zonas, setZonas] = useState<string[]>(GRANADA_ZONES);
  const [showBadCaseros, setShowBadCaseros] = useState(false);

  const fetchPisos = useCallback(async (zona?: string) => {
    try {
      const params = zona ? { zona } : {};
      const response = await axios.get(`${API_URL}/api/pisos`, { params });
      let data = response.data;
      
      // Sort by worst if showing bad caseros
      if (showBadCaseros) {
        data = data.sort((a: Piso, b: Piso) => a.promedio_general - b.promedio_general);
      }
      
      setPisos(data);
    } catch (error) {
      console.error('Error fetching pisos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showBadCaseros]);

  const fetchZonas = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/zonas`);
      const apiZonas = response.data.zonas;
      // Merge with Granada zones
      const allZonas = [...new Set([...GRANADA_ZONES, ...apiZonas])];
      setZonas(allZonas);
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

  const handleShare = async (piso: Piso) => {
    try {
      const message = piso.promedio_general < 3 
        ? `⚠️ ¡CUIDADO! Piso en ${piso.zona} con ${piso.promedio_general}⭐ - ${piso.precio_mensual}€/mes. ¡Mira las valoraciones en Casero Stars!`
        : `🏠 Piso en ${piso.zona} - ${piso.promedio_general}⭐ - ${piso.precio_mensual}€/mes. ¡Valorado en Casero Stars!`;
      
      await Share.share({
        message,
        title: 'Casero Stars - Valora tu alquiler',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
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

  const getRatingBadge = (rating: number) => {
    if (rating === 0) return { text: 'Sin valorar', color: '#888', bg: '#1a1a2e' };
    if (rating < 2) return { text: '🚨 PELIGRO', color: '#ff4444', bg: '#2a1a1a' };
    if (rating < 3) return { text: '⚠️ Cuidado', color: '#ff8c00', bg: '#2a2a1a' };
    if (rating < 4) return { text: '👍 Decente', color: '#4ecdc4', bg: '#1a2a2a' };
    return { text: '✅ Recomendado', color: '#4ade80', bg: '#1a2a1a' };
  };

  const getPriceBadge = (price: number) => {
    if (price <= 300) return { text: '💚 Precio justo', color: '#4ade80' };
    if (price <= 450) return { text: '💛 Aceptable', color: '#ffd700' };
    if (price <= 600) return { text: '🧡 Caro', color: '#ff8c00' };
    return { text: '❤️‍🔥 Abusivo', color: '#ff4444' };
  };

  const renderPiso = ({ item }: { item: Piso }) => {
    const ratingBadge = getRatingBadge(item.promedio_general);
    const priceBadge = getPriceBadge(item.precio_mensual);
    
    return (
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
            <Text style={styles.noPhotoText}>Sin fotos aún</Text>
          </View>
        )}
        
        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => handleShare(item)}
        >
          <Ionicons name="share-social" size={20} color="#fff" />
        </TouchableOpacity>
        
        {/* Rating Badge */}
        <View style={[styles.ratingBadge, { backgroundColor: ratingBadge.bg }]}>
          <Text style={[styles.ratingBadgeText, { color: ratingBadge.color }]}>
            {ratingBadge.text}
          </Text>
        </View>
        
        <View style={styles.pisoInfo}>
          <View style={styles.pisoHeader}>
            <Text style={styles.pisoZona}>{item.zona}</Text>
            <Text style={[styles.priceBadge, { color: priceBadge.color }]}>
              {priceBadge.text}
            </Text>
          </View>
          
          <Text style={styles.pisoDireccion} numberOfLines={1}>
            {item.direccion}
          </Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.pisoPrecio}>{item.precio_mensual}€</Text>
            <Text style={styles.perMonth}>/mes</Text>
          </View>
          
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>{renderStars(item.promedio_general)}</View>
            <Text style={styles.ratingText}>
              {item.promedio_general.toFixed(1)} ({item.total_valoraciones} opiniones)
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏠 Explora Granada</Text>
        <Text style={styles.headerSubtitle}>Pisos valorados por estudiantes</Text>
      </View>

      {/* Toggle Bad Caseros */}
      <TouchableOpacity
        style={[styles.badCaserosToggle, showBadCaseros && styles.badCaserosToggleActive]}
        onPress={() => {
          setShowBadCaseros(!showBadCaseros);
          setLoading(true);
          fetchPisos(searchZona || undefined);
        }}
      >
        <Ionicons name="warning" size={20} color={showBadCaseros ? '#0f0f1a' : '#ff6b6b'} />
        <Text style={[styles.badCaserosText, showBadCaseros && styles.badCaserosTextActive]}>
          {showBadCaseros ? 'Mostrando peores primero' : 'Ver peores caseros'}
        </Text>
      </TouchableOpacity>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar zona en Granada..."
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

      {/* Zone Chips */}
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffd700" />
          <Text style={styles.loadingText}>Buscando pisos...</Text>
        </View>
      ) : pisos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="home-outline" size={64} color="#444" />
          <Text style={styles.emptyText}>No hay pisos en esta zona</Text>
          <Text style={styles.emptySubtext}>
            ¡Sé el primero en añadir uno y ayudar a otros estudiantes!
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/add')}
          >
            <Ionicons name="add-circle" size={20} color="#0f0f1a" />
            <Text style={styles.emptyButtonText}>Añadir piso</Text>
          </TouchableOpacity>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 14,
  },
  badCaserosToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1a1a',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ff6b6b33',
  },
  badCaserosToggleActive: {
    backgroundColor: '#ff6b6b',
  },
  badCaserosText: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  badCaserosTextActive: {
    color: '#0f0f1a',
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
  loadingText: {
    color: '#888',
    marginTop: 16,
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
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: '#ffd700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  emptyButtonText: {
    color: '#0f0f1a',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
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
  noPhotoText: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  shareButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  pisoInfo: {
    padding: 16,
  },
  pisoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pisoZona: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priceBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  pisoDireccion: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  pisoPrecio: {
    color: '#4ade80',
    fontSize: 24,
    fontWeight: 'bold',
  },
  perMonth: {
    color: '#888',
    fontSize: 14,
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
