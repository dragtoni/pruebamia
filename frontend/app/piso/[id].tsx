import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

interface Rating {
  id: string;
  user_id: string;
  user_name: string;
  estado_piso: number;
  calidad_precio: number;
  comportamiento_casero: number;
  ubicacion: number;
  fotos_reales: number;
  promedio: number;
  comentario: string | null;
  created_at: string;
}

interface PisoDetail {
  id: string;
  direccion: string;
  zona: string;
  ciudad: string;
  precio_mensual: number;
  descripcion: string | null;
  fotos: string[];
  promedio_general: number;
  total_valoraciones: number;
  created_by: string;
  created_by_name: string;
  created_at: string;
  valoraciones: Rating[];
}

export default function PisoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [piso, setPiso] = useState<PisoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchPiso();
  }, [id]);

  const fetchPiso = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/pisos/${id}`);
      setPiso(response.data);
    } catch (error) {
      console.error('Error fetching piso:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!piso) return;
    try {
      const message = `Piso en ${piso.ciudad} (${piso.zona}) - ${piso.promedio_general}⭐ - ${piso.precio_mensual}€/mes. Ver en Casero Stars`;
      await Share.share({ message, title: 'Casero Stars' });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={size} color="#ffd700" />);
    }
    return stars;
  };

  const getRatingBadge = (rating: number) => {
    if (rating === 0) return { text: 'Sin valorar', color: '#888' };
    if (rating < 2) return { text: 'Mejorable', color: '#ff8c00' };
    if (rating < 3) return { text: 'Regular', color: '#ffd700' };
    if (rating < 4) return { text: 'Bueno', color: '#4ecdc4' };
    return { text: 'Excelente', color: '#4ade80' };
  };

  const getPriceBadge = (price: number) => {
    if (price <= 300) return { text: 'Económico', color: '#4ade80' };
    if (price <= 450) return { text: 'Precio medio', color: '#ffd700' };
    if (price <= 600) return { text: 'Precio alto', color: '#ff8c00' };
    return { text: 'Premium', color: '#ff6b6b' };
  };

  const hasUserRated = piso?.valoraciones.some((v) => v.user_id === user?.id);

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#ffd700" /></View>;
  }

  if (!piso) {
    return <View style={styles.errorContainer}><Text style={styles.errorText}>Piso no encontrado</Text></View>;
  }

  const ratingBadge = getRatingBadge(piso.promedio_general);
  const priceBadge = getPriceBadge(piso.precio_mensual);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {piso.fotos && piso.fotos.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / width);
                  setCurrentImageIndex(index);
                }}
              >
                {piso.fotos.map((foto, index) => (
                  <Image key={index} source={{ uri: foto }} style={styles.image} resizeMode="cover" />
                ))}
              </ScrollView>
              {piso.fotos.length > 1 && (
                <View style={styles.pagination}>
                  {piso.fotos.map((_, index) => (
                    <View key={index} style={[styles.paginationDot, index === currentImageIndex && styles.paginationDotActive]} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={64} color="#444" />
              <Text style={styles.imagePlaceholderText}>Sin fotos</Text>
            </View>
          )}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Header Info */}
          <View style={styles.headerInfo}>
            <View style={styles.locationRow}>
              <Text style={styles.ciudad}>{piso.ciudad}</Text>
              <Text style={styles.zonaSeparator}>•</Text>
              <Text style={styles.zona}>{piso.zona}</Text>
            </View>
            <Text style={styles.direccion}>{piso.direccion}</Text>
            
            <View style={styles.priceSection}>
              <Text style={styles.precio}>{piso.precio_mensual}€<Text style={styles.perMonth}>/mes</Text></Text>
              <View style={[styles.priceBadgeContainer, { backgroundColor: priceBadge.color + '20' }]}>
                <Text style={[styles.priceBadgeText, { color: priceBadge.color }]}>{priceBadge.text}</Text>
              </View>
            </View>
          </View>

          {/* Rating Summary */}
          <View style={styles.ratingSummary}>
            <View style={styles.ratingMain}>
              <Text style={styles.ratingNumber}>{piso.promedio_general.toFixed(1)}</Text>
              <View style={styles.ratingStars}>{renderStars(piso.promedio_general, 24)}</View>
              <Text style={[styles.ratingBadgeText, { color: ratingBadge.color }]}>{ratingBadge.text}</Text>
              <Text style={styles.ratingCount}>{piso.total_valoraciones} valoracion{piso.total_valoraciones !== 1 ? 'es' : ''}</Text>
            </View>
          </View>

          {/* Description */}
          {piso.descripcion && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.description}>{piso.descripcion}</Text>
            </View>
          )}

          {/* Add Rating Button */}
          {!hasUserRated && (
            <TouchableOpacity style={styles.rateButton} onPress={() => router.push(`/piso/valorar/${piso.id}`)}>
              <Ionicons name="star" size={24} color="#0f0f1a" />
              <Text style={styles.rateButtonText}>Valorar este piso</Text>
            </TouchableOpacity>
          )}

          {hasUserRated && (
            <View style={styles.alreadyRated}>
              <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
              <Text style={styles.alreadyRatedText}>Ya has valorado este piso</Text>
            </View>
          )}

          {/* Valoraciones */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opiniones</Text>
            {piso.valoraciones.length === 0 ? (
              <View style={styles.noRatingsContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#444" />
                <Text style={styles.noRatings}>Sin opiniones todavía</Text>
                <Text style={styles.noRatingsSubtext}>Sé el primero en compartir tu experiencia</Text>
              </View>
            ) : (
              piso.valoraciones.map((valoracion) => (
                <View key={valoracion.id} style={styles.valoracionCard}>
                  <View style={styles.valoracionHeader}>
                    <View style={styles.valoracionUser}>
                      <View style={styles.userAvatar}>
                        <Ionicons name="person" size={18} color="#ffd700" />
                      </View>
                      <Text style={styles.valoracionUserName}>{valoracion.user_name}</Text>
                    </View>
                    <View style={styles.valoracionStars}>
                      {renderStars(valoracion.promedio, 14)}
                      <Text style={styles.valoracionPromedio}>{valoracion.promedio.toFixed(1)}</Text>
                    </View>
                  </View>

                  <View style={styles.valoracionDetails}>
                    <View style={styles.valoracionItem}>
                      <Text style={styles.valoracionLabel}>Estado del piso</Text>
                      <View style={styles.miniStars}>{renderStars(valoracion.estado_piso, 12)}</View>
                    </View>
                    <View style={styles.valoracionItem}>
                      <Text style={styles.valoracionLabel}>Calidad/Precio</Text>
                      <View style={styles.miniStars}>{renderStars(valoracion.calidad_precio, 12)}</View>
                    </View>
                    <View style={styles.valoracionItem}>
                      <Text style={styles.valoracionLabel}>Propietario</Text>
                      <View style={styles.miniStars}>{renderStars(valoracion.comportamiento_casero, 12)}</View>
                    </View>
                    <View style={styles.valoracionItem}>
                      <Text style={styles.valoracionLabel}>Ubicación</Text>
                      <View style={styles.miniStars}>{renderStars(valoracion.ubicacion, 12)}</View>
                    </View>
                    <View style={styles.valoracionItem}>
                      <Text style={styles.valoracionLabel}>Fotos reales</Text>
                      <View style={styles.miniStars}>{renderStars(valoracion.fotos_reales, 12)}</View>
                    </View>
                  </View>

                  {valoracion.comentario && (
                    <View style={styles.comentarioContainer}>
                      <Text style={styles.valoracionComentario}>"{valoracion.comentario}"</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  loadingContainer: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' },
  errorContainer: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#fff', fontSize: 18 },
  imageContainer: { height: 250, backgroundColor: '#1a1a2e' },
  image: { width: width, height: 250 },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { color: '#666', fontSize: 14, marginTop: 8 },
  shareButton: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  pagination: { flexDirection: 'row', position: 'absolute', bottom: 16, alignSelf: 'center', gap: 8 },
  paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  paginationDotActive: { backgroundColor: '#ffd700' },
  content: { padding: 24 },
  headerInfo: { marginBottom: 24 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ciudad: { color: '#4ecdc4', fontSize: 14, fontWeight: '600' },
  zonaSeparator: { color: '#888', marginHorizontal: 8 },
  zona: { color: '#ffd700', fontSize: 14, fontWeight: '600' },
  direccion: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  priceSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  precio: { color: '#4ade80', fontSize: 28, fontWeight: 'bold' },
  perMonth: { color: '#888', fontSize: 14, fontWeight: 'normal' },
  priceBadgeContainer: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  priceBadgeText: { fontSize: 13, fontWeight: '600' },
  ratingSummary: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 24, marginBottom: 24 },
  ratingMain: { alignItems: 'center' },
  ratingNumber: { color: '#fff', fontSize: 48, fontWeight: 'bold', marginBottom: 8 },
  ratingStars: { flexDirection: 'row', marginBottom: 12, gap: 4 },
  ratingBadgeText: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  ratingCount: { color: '#888', fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  description: { color: '#ccc', fontSize: 15, lineHeight: 22 },
  rateButton: { backgroundColor: '#ffd700', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, marginBottom: 24, gap: 8 },
  rateButtonText: { color: '#0f0f1a', fontSize: 17, fontWeight: 'bold' },
  alreadyRated: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a2e1a', paddingVertical: 16, borderRadius: 12, marginBottom: 24, gap: 8 },
  alreadyRatedText: { color: '#4ade80', fontSize: 15, fontWeight: '600' },
  noRatingsContainer: { alignItems: 'center', paddingVertical: 32 },
  noRatings: { color: '#888', fontSize: 15, marginTop: 12 },
  noRatingsSubtext: { color: '#666', fontSize: 13, marginTop: 4 },
  valoracionCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 16 },
  valoracionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  valoracionUser: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2a2a3e', alignItems: 'center', justifyContent: 'center' },
  valoracionUserName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  valoracionStars: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  valoracionPromedio: { color: '#ffd700', fontSize: 14, fontWeight: 'bold' },
  valoracionDetails: { gap: 6, marginBottom: 12 },
  valoracionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valoracionLabel: { color: '#888', fontSize: 13 },
  miniStars: { flexDirection: 'row' },
  comentarioContainer: { backgroundColor: '#0f0f1a', borderRadius: 8, padding: 12, marginTop: 8 },
  valoracionComentario: { color: '#ccc', fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
});
