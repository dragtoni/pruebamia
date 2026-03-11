import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuth } from '../../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface RatingCategory {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const CATEGORIES: RatingCategory[] = [
  {
    key: 'estado_piso',
    label: 'Estado del Piso',
    icon: 'home',
    description: '¿En qué condiciones está el piso?',
  },
  {
    key: 'calidad_precio',
    label: 'Calidad/Precio',
    icon: 'cash',
    description: '¿Vale lo que cuesta?',
  },
  {
    key: 'comportamiento_casero',
    label: 'Comportamiento del Casero',
    icon: 'person',
    description: '¿Cómo es el trato del casero?',
  },
  {
    key: 'ubicacion',
    label: 'Ubicación',
    icon: 'location',
    description: '¿Está bien ubicado?',
  },
  {
    key: 'fotos_reales',
    label: 'Fotos Reales',
    icon: 'camera',
    description: '¿Las fotos coinciden con la realidad?',
  },
];

export default function ValorarPisoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({
    estado_piso: 0,
    calidad_precio: 0,
    comportamiento_casero: 0,
    ubicacion: 0,
    fotos_reales: 0,
  });
  const [comentario, setComentario] = useState('');

  const setRating = (category: string, value: number) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const renderStarSelector = (category: string, currentRating: number) => {
    return (
      <View style={styles.starSelector}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(category, star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={32}
              color={star <= currentRating ? '#ffd700' : '#444'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const calculateAverage = () => {
    const values = Object.values(ratings);
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  };

  const handleSubmit = async () => {
    const allRated = Object.values(ratings).every((r) => r > 0);
    if (!allRated) {
      Alert.alert('Error', 'Por favor valora todas las categorías');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/pisos/${id}/valoraciones`,
        {
          ...ratings,
          comentario: comentario || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('¡Gracias!', 'Tu valoración ha sido registrada', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error al enviar la valoración';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const average = calculateAverage();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Valorar Piso</Text>
            <Text style={styles.subtitle}>
              Tu opinión ayuda a otros inquilinos
            </Text>
          </View>

          {/* Average Preview */}
          <View style={styles.averageContainer}>
            <Text style={styles.averageLabel}>Promedio</Text>
            <Text style={styles.averageNumber}>
              {average > 0 ? average.toFixed(1) : '-'}
            </Text>
            <View style={styles.averageStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= average ? 'star' : 'star-outline'}
                  size={24}
                  color={star <= average ? '#ffd700' : '#444'}
                />
              ))}
            </View>
          </View>

          {/* Rating Categories */}
          {CATEGORIES.map((category) => (
            <View key={category.key} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Ionicons name={category.icon} size={24} color="#ffd700" />
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  <Text style={styles.categoryDescription}>
                    {category.description}
                  </Text>
                </View>
              </View>
              {renderStarSelector(category.key, ratings[category.key])}
            </View>
          ))}

          {/* Comentario */}
          <View style={styles.comentarioContainer}>
            <Text style={styles.comentarioLabel}>Comentario (opcional)</Text>
            <TextInput
              style={styles.comentarioInput}
              placeholder="Comparte tu experiencia..."
              placeholderTextColor="#666"
              value={comentario}
              onChangeText={setComentario}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0f0f1a" />
            ) : (
              <>
                <Ionicons name="star" size={24} color="#0f0f1a" />
                <Text style={styles.submitButtonText}>Enviar Valoración</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  averageContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  averageLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  averageNumber: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  averageStars: {
    flexDirection: 'row',
    gap: 4,
  },
  categoryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    color: '#888',
    fontSize: 14,
  },
  starSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  comentarioContainer: {
    marginBottom: 24,
  },
  comentarioLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  comentarioInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  submitButton: {
    backgroundColor: '#ffd700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f0f1a',
  },
});
