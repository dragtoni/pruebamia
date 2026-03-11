import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [loading, user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffd700" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Ionicons name="star" size={70} color="#ffd700" />
          <Text style={styles.title}>Casero Stars</Text>
          <Text style={styles.tagline}>Tu guía de alquileres</Text>
          <Text style={styles.subtitle}>Opiniones reales de inquilinos en España</Text>
        </View>

        {/* Spain Map Banner */}
        <View style={styles.spainBanner}>
          <Text style={styles.spainEmoji}>🇪🇸</Text>
          <View style={styles.spainInfo}>
            <Text style={styles.spainTitle}>Toda España</Text>
            <Text style={styles.spainSubtitle}>10 ciudades universitarias</Text>
          </View>
          <View style={styles.granadaHighlight}>
            <Ionicons name="star" size={16} color="#ffd700" />
            <Text style={styles.granadaText}>Granada</Text>
          </View>
        </View>

        {/* Stats Banner */}
        <View style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Ionicons name="location" size={24} color="#4ecdc4" />
            <Text style={styles.statNumber}>10</Text>
            <Text style={styles.statLabel}>Ciudades</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="people" size={24} color="#ff6b6b" />
            <Text style={styles.statNumber}>Unis</Text>
            <Text style={styles.statLabel}>Estudiantes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="star" size={24} color="#ffd700" />
            <Text style={styles.statNumber}>5⭐</Text>
            <Text style={styles.statLabel}>Valoraciones</Text>
          </View>
        </View>

        {/* Cities Preview */}
        <View style={styles.citiesPreview}>
          <Text style={styles.citiesTitle}>Ciudades disponibles</Text>
          <View style={styles.citiesGrid}>
            <View style={[styles.cityChip, styles.cityChipFeatured]}>
              <Text style={styles.cityEmoji}>🏔️</Text>
              <Text style={[styles.cityName, styles.cityNameFeatured]}>Granada</Text>
            </View>
            <View style={styles.cityChip}>
              <Text style={styles.cityEmoji}>🏙️</Text>
              <Text style={styles.cityName}>Madrid</Text>
            </View>
            <View style={styles.cityChip}>
              <Text style={styles.cityEmoji}>🏖️</Text>
              <Text style={styles.cityName}>Barcelona</Text>
            </View>
            <View style={styles.cityChip}>
              <Text style={styles.cityEmoji}>🎺</Text>
              <Text style={styles.cityName}>Sevilla</Text>
            </View>
            <View style={styles.cityChip}>
              <Text style={styles.cityEmoji}>🍊</Text>
              <Text style={styles.cityName}>Valencia</Text>
            </View>
            <View style={styles.cityChip}>
              <Text style={styles.cityEmoji}>+5</Text>
              <Text style={styles.cityName}>más</Text>
            </View>
          </View>
        </View>

        {/* Value Proposition */}
        <View style={styles.valueSection}>
          <Text style={styles.valueEmoji}>💡</Text>
          <Text style={styles.valueText}>¿Buscas piso?</Text>
          <Text style={styles.valueSubtext}>Consulta opiniones de otros inquilinos antes de decidir</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="camera" size={18} color="#ffd700" />
            </View>
            <Text style={styles.featureText}>Fotos reales de inquilinos</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="star" size={18} color="#ffd700" />
            </View>
            <Text style={styles.featureText}>Valoraciones honestas</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="chatbubbles" size={18} color="#ffd700" />
            </View>
            <Text style={styles.featureText}>Experiencias de la comunidad</Text>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/auth/register')}
          >
            <Ionicons name="person-add" size={22} color="#0f0f1a" />
            <Text style={styles.primaryButtonText}>Crear cuenta gratis</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </View>

        {/* Social Proof */}
        <Text style={styles.socialProof}>Hecho por estudiantes, para estudiantes</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 30,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffd700',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  spainBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4ecdc433',
  },
  spainEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  spainInfo: {
    flex: 1,
  },
  spainTitle: {
    color: '#4ecdc4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spainSubtitle: {
    color: '#888',
    fontSize: 12,
  },
  granadaHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffd70020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  granadaText: {
    color: '#ffd700',
    fontSize: 11,
    fontWeight: '600',
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    color: '#888',
    fontSize: 10,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2a2a3e',
  },
  citiesPreview: {
    marginBottom: 12,
  },
  citiesTitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  citiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  cityChipFeatured: {
    backgroundColor: '#ffd70020',
    borderWidth: 1,
    borderColor: '#ffd70050',
  },
  cityEmoji: {
    fontSize: 14,
  },
  cityName: {
    color: '#888',
    fontSize: 12,
  },
  cityNameFeatured: {
    color: '#ffd700',
    fontWeight: '600',
  },
  valueSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  valueEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  valueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  valueSubtext: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  features: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#ccc',
  },
  buttonContainer: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#ffd700',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f0f1a',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffd700',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffd700',
  },
  socialProof: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
  },
});
