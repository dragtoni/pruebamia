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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Piso {
  id: string;
  direccion: string;
  zona: string;
  ciudad: string;
  precio_mensual: number;
  descripcion: string | null;
  fotos: string[];
  promedio_general: number;
  total_valoraciones: number;
  created_by_name: string;
}

interface Ciudad {
  nombre: string;
  emoji: string;
  featured: boolean;
}

export default function ExploreScreen() {
  const router = useRouter();
  const { selectedCity, setSelectedCity } = useAuth();
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchZona, setSearchZona] = useState('');
  const [zonas, setZonas] = useState<string[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [sortByLowest, setSortByLowest] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  const fetchPisos = useCallback(async (zona?: string) => {
    try {
      const params: any = { ciudad: selectedCity };
      if (zona) params.zona = zona;
      const response = await axios.get(`${API_URL}/api/pisos`, { params });
      let data = response.data;
      
      if (sortByLowest) {
        data = data.sort((a: Piso, b: Piso) => a.promedio_general - b.promedio_general);
      }
      
      setPisos(data);
    } catch (error) {
      console.error('Error fetching pisos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sortByLowest, selectedCity]);

  const fetchZonas = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/ciudades/${selectedCity}/zonas`);
      setZonas(response.data.zonas.map((z: any) => z.nombre));
    } catch (error) {
      console.error('Error fetching zonas:', error);
    }
  };

  const fetchCiudades = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/ciudades`);
      setCiudades(response.data.ciudades);
    } catch (error) {
      console.error('Error fetching ciudades:', error);
    }
  };

  useEffect(() => {
    fetchCiudades();
  }, []);

  useEffect(() => {
    setLoading(true);
    setSearchZona('');
    fetchPisos();
    fetchZonas();
  }, [selectedCity]);

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
      const message = `🏠 Piso en ${piso.ciudad} (${piso.zona}) - ${piso.promedio_general}⭐ - ${piso.precio_mensual}€/mes. Valorado en Casero Stars`;
      await Share.share({ message, title: 'Casero Stars' });
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
          size={14}
          color="#ffd700"
        />
      );
    }
    return stars;
  };

  const getRatingBadge = (rating: number) => {
    if (rating === 0) return { text: 'Sin valorar', color: '#888', bg: '#1a1a2e' };
    if (rating < 2) return { text: 'Mejorable', color: '#ff8c00', bg: '#2a2a1a' };
    if (rating < 3) return { text: 'Regular', color: '#ffd700', bg: '#2a2a1a' };
    if (rating < 4) return { text: 'Bueno', color: '#4ecdc4', bg: '#1a2a2a' };
    return { text: 'Excelente', color: '#4ade80', bg: '#1a2a1a' };
  };

  const getPriceBadge = (price: number) => {
    if (price <= 300) return { text: 'Económico', color: '#4ade80' };
    if (price <= 450) return { text: 'Medio', color: '#ffd700' };
    if (price <= 600) return { text: 'Alto', color: '#ff8c00' };
    return { text: 'Premium', color: '#ff6b6b' };
  };

  const selectedCiudad = ciudades.find(c => c.nombre === selectedCity);

  const renderPiso = ({ item }: { item: Piso }) => {
    const ratingBadge = getRatingBadge(item.promedio_general);
    const priceBadge = getPriceBadge(item.precio_mensual);
    
    return (
      <TouchableOpacity
        style={styles.pisoCard}
        onPress={() => router.push(`/piso/${item.id}`)}
      >
        {item.fotos && item.fotos.length > 0 ? (
          <Image source={{ uri: item.fotos[0] }} style={styles.pisoImage} resizeMode="cover" />
        ) : (
          <View style={styles.pisoImagePlaceholder}>
            <Ionicons name="home" size={36} color="#444" />
          </View>
        )}
        
        <TouchableOpacity style={styles.shareButton} onPress={() => handleShare(item)}>
          <Ionicons name="share-social" size={18} color="#fff" />
        </TouchableOpacity>
        
        <View style={[styles.ratingBadge, { backgroundColor: ratingBadge.bg }]}>
          <Text style={[styles.ratingBadgeText, { color: ratingBadge.color }]}>{ratingBadge.text}</Text>
        </View>
        
        <View style={styles.pisoInfo}>
          <View style={styles.pisoHeader}>
            <Text style={styles.pisoZona}>{item.zona}</Text>
            <Text style={[styles.priceBadge, { color: priceBadge.color }]}>{priceBadge.text}</Text>
          </View>
          
          <Text style={styles.pisoDireccion} numberOfLines={1}>{item.direccion}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.pisoPrecio}>{item.precio_mensual}€</Text>
            <Text style={styles.perMonth}>/mes</Text>
          </View>
          
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>{renderStars(item.promedio_general)}</View>
            <Text style={styles.ratingText}>
              {item.promedio_general.toFixed(1)} ({item.total_valoraciones})
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* City Selector */}
      <TouchableOpacity style={styles.cityBar} onPress={() => setShowCityModal(true)}>
        <Text style={styles.cityEmoji}>{selectedCiudad?.emoji || '🏠'}</Text>
        <View style={styles.cityInfo}>
          <Text style={styles.cityName}>{selectedCity}</Text>
          <Text style={styles.citySubtext}>Toca para cambiar ciudad</Text>
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
                  style={[
                    styles.cityOption,
                    selectedCity === item.nombre && styles.cityOptionActive,
                    item.featured && styles.cityOptionFeatured,
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

      {/* Sort Toggle */}
      <TouchableOpacity
        style={[styles.sortToggle, sortByLowest && styles.sortToggleActive]}
        onPress={() => {
          setSortByLowest(!sortByLowest);
          setLoading(true);
          fetchPisos(searchZona || undefined);
        }}
      >
        <Ionicons name="filter" size={18} color={sortByLowest ? '#0f0f1a' : '#4ecdc4'} />
        <Text style={[styles.sortText, sortByLowest && styles.sortTextActive]}>
          {sortByLowest ? 'Menor valoración primero' : 'Ordenar por valoración'}
        </Text>
      </TouchableOpacity>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Buscar zona en ${selectedCity}...`}
            placeholderTextColor="#666"
            value={searchZona}
            onChangeText={setSearchZona}
            onSubmitEditing={handleSearch}
          />
          {searchZona.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchZona(''); fetchPisos(); }}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={18} color="#0f0f1a" />
        </TouchableOpacity>
      </View>

      {/* Zone Chips */}
      {zonas.length > 0 && (
        <View style={styles.zonasContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={zonas}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.zonaChip, searchZona === item && styles.zonaChipActive]}
                onPress={() => {
                  setSearchZona(item);
                  setLoading(true);
                  fetchPisos(item);
                }}
              >
                <Text style={[styles.zonaChipText, searchZona === item && styles.zonaChipTextActive]}>
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
          <Ionicons name="home-outline" size={56} color="#444" />
          <Text style={styles.emptyText}>No hay pisos en {selectedCity}</Text>
          <Text style={styles.emptySubtext}>Sé el primero en añadir uno</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/(tabs)/add')}>
            <Ionicons name="add" size={18} color="#0f0f1a" />
            <Text style={styles.emptyButtonText}>Añadir piso</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pisos}
          keyExtractor={(item) => item.id}
          renderItem={renderPiso}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffd700" />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  cityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  cityEmoji: { fontSize: 28 },
  cityInfo: { flex: 1 },
  cityName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  citySubtext: { color: '#888', fontSize: 11 },
  featuredTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffd70020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
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
  sortToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a2a2a', marginHorizontal: 16, marginTop: 8, padding: 10, borderRadius: 10, gap: 8, borderWidth: 1, borderColor: '#4ecdc433' },
  sortToggleActive: { backgroundColor: '#4ecdc4' },
  sortText: { color: '#4ecdc4', fontWeight: '600', fontSize: 13 },
  sortTextActive: { color: '#0f0f1a' },
  searchContainer: { flexDirection: 'row', padding: 12, paddingBottom: 8, gap: 10 },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 10, paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, height: 42, color: '#fff', fontSize: 14 },
  searchButton: { backgroundColor: '#ffd700', width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  zonasContainer: { paddingHorizontal: 12, marginBottom: 4 },
  zonaChip: { backgroundColor: '#1a1a2e', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  zonaChipActive: { backgroundColor: '#ffd700' },
  zonaChipText: { color: '#888', fontSize: 13 },
  zonaChipTextActive: { color: '#0f0f1a', fontWeight: '600' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: '#fff', fontSize: 17, fontWeight: '600', marginTop: 16 },
  emptySubtext: { color: '#888', fontSize: 13, marginTop: 6 },
  emptyButton: { flexDirection: 'row', backgroundColor: '#ffd700', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 20, gap: 6 },
  emptyButtonText: { color: '#0f0f1a', fontWeight: 'bold' },
  listContent: { padding: 12 },
  pisoCard: { backgroundColor: '#1a1a2e', borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  pisoImage: { width: '100%', height: 160 },
  pisoImagePlaceholder: { width: '100%', height: 160, backgroundColor: '#2a2a3e', alignItems: 'center', justifyContent: 'center' },
  shareButton: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  ratingBadge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  ratingBadgeText: { fontSize: 11, fontWeight: 'bold' },
  pisoInfo: { padding: 14 },
  pisoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  pisoZona: { color: '#ffd700', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  priceBadge: { fontSize: 11, fontWeight: '600' },
  pisoDireccion: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 },
  pisoPrecio: { color: '#4ade80', fontSize: 22, fontWeight: 'bold' },
  perMonth: { color: '#888', fontSize: 13 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stars: { flexDirection: 'row' },
  ratingText: { color: '#888', fontSize: 12 },
});
