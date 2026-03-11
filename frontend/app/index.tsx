import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [loading, user]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffd700" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name="star" size={80} color="#ffd700" />
        </Animated.View>
        <Text style={styles.title}>Casero Stars</Text>
        <Text style={styles.tagline}>¡Basta de abusos!</Text>
        <Text style={styles.subtitle}>Valora tu alquiler y protege a otros estudiantes</Text>
      </View>

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Ionicons name="flame" size={24} color="#ff6b6b" />
          <Text style={styles.statNumber}>Granada</Text>
          <Text style={styles.statLabel}>¡Activos!</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="people" size={24} color="#4ecdc4" />
          <Text style={styles.statNumber}>Estudiantes</Text>
          <Text style={styles.statLabel}>Unidos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="shield-checkmark" size={24} color="#ffd700" />
          <Text style={styles.statNumber}>300€</Text>
          <Text style={styles.statLabel}>El objetivo</Text>
        </View>
      </View>

      {/* Problem Statement */}
      <View style={styles.problemSection}>
        <Text style={styles.problemEmoji}>😤</Text>
        <Text style={styles.problemText}>¿Cansado de caseros abusivos?</Text>
        <Text style={styles.problemSubtext}>Fotos falsas, precios inflados, fianzas que no devuelven...</Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="camera" size={20} color="#ffd700" />
          </View>
          <Text style={styles.featureText}>Fotos REALES verificadas</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="star" size={20} color="#ffd700" />
          </View>
          <Text style={styles.featureText}>Valora al casero sin miedo</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="trending-down" size={20} color="#ff6b6b" />
          </View>
          <Text style={styles.featureText}>Ranking de PEORES caseros</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="people" size={20} color="#4ecdc4" />
          </View>
          <Text style={styles.featureText}>Comunidad de estudiantes</Text>
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/auth/register')}
        >
          <Ionicons name="rocket" size={24} color="#0f0f1a" />
          <Text style={styles.primaryButtonText}>¡Únete a la revolución!</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
        </TouchableOpacity>
      </View>

      {/* Social Proof */}
      <Text style={styles.socialProof}>🔥 Hecho por estudiantes, para estudiantes 🔥</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tagline: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2a2a3e',
  },
  problemSection: {
    backgroundColor: '#2a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff6b6b33',
  },
  problemEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  problemText: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  problemSubtext: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  features: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#ccc',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#ffd700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f0f1a',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffd700',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffd700',
  },
  socialProof: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
