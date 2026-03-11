import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  ScrollView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Seguro que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Casero Stars - Consulta opiniones de alquileres antes de decidir. Disponible para toda España. #CaseroStars',
        title: 'Casero Stars',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleShareTwitter = async () => {
    const tweet = encodeURIComponent(
      'Acabo de descubrir Casero Stars, una app para consultar opiniones de alquileres en España. Muy útil para estudiantes. #CaseroStars'
    );
    await Linking.openURL(`https://twitter.com/intent/tweet?text=${tweet}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons
              name={user?.user_type === 'casero' ? 'key' : 'school'}
              size={48}
              color="#ffd700"
            />
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badge}>
            <Ionicons
              name={user?.user_type === 'casero' ? 'key' : 'school'}
              size={16}
              color="#ffd700"
            />
            <Text style={styles.badgeText}>
              {user?.user_type === 'casero' ? 'Propietario' : 'Estudiante'}
            </Text>
          </View>
        </View>

        {/* Share Section */}
        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>Comparte la app</Text>
          <Text style={styles.sectionSubtitle}>Ayuda a otros a encontrar su piso ideal</Text>
          
          <View style={styles.socialButtons}>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#1DA1F2' }]} onPress={handleShareTwitter}>
              <Ionicons name="logo-twitter" size={24} color="#fff" />
              <Text style={styles.socialButtonText}>Twitter</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#4ecdc4' }]} onPress={handleShareApp}>
              <Ionicons name="share-social" size={24} color="#fff" />
              <Text style={styles.socialButtonText}>Compartir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {/* About Section */}
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>Sobre la app</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle" size={24} color="#4ecdc4" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>¿Qué es Casero Stars?</Text>
                  <Text style={styles.infoText}>
                    Una plataforma donde inquilinos comparten sus experiencias sobre pisos y propietarios.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="star" size={24} color="#ffd700" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Sistema de valoración</Text>
                  <Text style={styles.infoText}>
                    5 categorías: estado del piso, relación calidad-precio, propietario, ubicación y fotos.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tips Section */}
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>Consejos útiles</Text>
            
            <View style={styles.tipCard}>
              <Ionicons name="document-text" size={20} color="#ffd700" />
              <Text style={styles.tipText}>Siempre firma un contrato de alquiler</Text>
            </View>
            <View style={styles.tipCard}>
              <Ionicons name="camera" size={20} color="#ffd700" />
              <Text style={styles.tipText}>Haz fotos del estado al entrar</Text>
            </View>
            <View style={styles.tipCard}>
              <Ionicons name="receipt" size={20} color="#ffd700" />
              <Text style={styles.tipText}>Guarda los recibos de pago</Text>
            </View>
            <View style={styles.tipCard}>
              <Ionicons name="search" size={20} color="#ffd700" />
              <Text style={styles.tipText}>Consulta valoraciones antes de alquilar</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#ff6b6b" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>Casero Stars v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#ffd700',
  },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: '#888', marginBottom: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  badgeText: { color: '#ffd700', fontSize: 13, fontWeight: '600' },
  shareSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  sectionSubtitle: { fontSize: 13, color: '#888', marginTop: 2, marginBottom: 16 },
  socialButtons: { flexDirection: 'row', gap: 10 },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  socialButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  menuContainer: { padding: 16 },
  menuSection: { marginBottom: 24 },
  menuSectionTitle: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoContent: { flex: 1 },
  infoTitle: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  infoText: { color: '#888', fontSize: 13, lineHeight: 18 },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  tipText: { color: '#fff', fontSize: 14, flex: 1 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 8,
  },
  logoutText: { color: '#ff6b6b', fontSize: 15, fontWeight: '600' },
  footer: { color: '#444', fontSize: 12, textAlign: 'center', marginTop: 20, marginBottom: 16 },
});
