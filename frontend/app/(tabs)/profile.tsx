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
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
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
        message: '🌟 ¡Únete a Casero Stars! La app para valorar alquileres y proteger a estudiantes de caseros abusivos. ¡Basta de pagar 800€ por un zulo! 💪\n\n#CaseroStars #Granada #Estudiantes',
        title: 'Casero Stars',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
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
              {user?.user_type === 'casero' ? 'Casero' : 'Estudiante'}
            </Text>
          </View>
        </View>

        {/* Share Banner */}
        <TouchableOpacity style={styles.shareBanner} onPress={handleShareApp}>
          <View style={styles.shareBannerContent}>
            <Ionicons name="megaphone" size={32} color="#ffd700" />
            <View style={styles.shareBannerText}>
              <Text style={styles.shareBannerTitle}>¡Corre la voz!</Text>
              <Text style={styles.shareBannerSubtitle}>
                Comparte la app con tus compañeros de clase
              </Text>
            </View>
          </View>
          <Ionicons name="share-social" size={24} color="#ffd700" />
        </TouchableOpacity>

        <View style={styles.menuContainer}>
          {/* Mission Section */}
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>Nuestra misión</Text>
            
            <View style={styles.missionCard}>
              <Text style={styles.missionEmoji}>🎯</Text>
              <Text style={styles.missionTitle}>Objetivo: 300€</Text>
              <Text style={styles.missionText}>
                Queremos que los alquileres vuelvan a ser justos. Un estudiante no debería pagar 800€ por una habitación.
              </Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark" size={24} color="#4ade80" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Protege tu fianza</Text>
                  <Text style={styles.infoText}>
                    Valora honestamente para que otros sepan si el casero devuelve la fianza
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="camera" size={24} color="#ff6b6b" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Fotos reales</Text>
                  <Text style={styles.infoText}>
                    Sube fotos de cómo es REALMENTE el piso, no las del anuncio
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="people" size={24} color="#4ecdc4" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Unidos somos más</Text>
                  <Text style={styles.infoText}>
                    Cuantos más seamos, más difícil será que nos engañen
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tips Section */}
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>Consejos para estudiantes</Text>
            
            <View style={styles.tipCard}>
              <Text style={styles.tipEmoji}>📝</Text>
              <Text style={styles.tipText}>Siempre firma un contrato</Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipEmoji}>📸</Text>
              <Text style={styles.tipText}>Haz fotos el día que entres</Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipEmoji}>💰</Text>
              <Text style={styles.tipText}>No pagues más de 1 mes de fianza</Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipEmoji}>🔍</Text>
              <Text style={styles.tipText}>Mira las valoraciones antes de alquilar</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#ff4444" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footer}>
            Hecho con ❤️ por estudiantes de Granada
          </Text>
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
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#ffd700',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#888',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  badgeText: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: '600',
  },
  shareBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a2a1a',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4ade8033',
  },
  shareBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  shareBannerText: {
    flex: 1,
  },
  shareBannerTitle: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareBannerSubtitle: {
    color: '#888',
    fontSize: 13,
  },
  menuContainer: {
    padding: 16,
  },
  menuSection: {
    marginBottom: 24,
  },
  menuSectionTitle: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  missionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffd70033',
  },
  missionEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  missionTitle: {
    color: '#ffd700',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  missionText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  tipEmoji: {
    fontSize: 24,
  },
  tipText: {
    color: '#fff',
    fontSize: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  logoutText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
});
