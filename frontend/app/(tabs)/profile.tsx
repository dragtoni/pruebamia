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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import * as Sharing from 'expo-sharing';

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
        message: '🌟 ¡Únete a Casero Stars! La app para valorar alquileres y proteger a estudiantes de caseros abusivos. ¡Basta de pagar 800€ por un zulo! 💪\n\n#CaseroStars #Granada #Estudiantes #BastaDeAbusos',
        title: 'Casero Stars',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleShareInstagram = async () => {
    const message = encodeURIComponent(
      '🌟 ¡Únete a Casero Stars!\n\nLa app para valorar alquileres y proteger a estudiantes de caseros abusivos.\n\n¡Basta de pagar 800€ por un zulo! 💪\n\n#CaseroStars #Granada #Estudiantes #BastaDeAbusos'
    );
    
    // Try to open Instagram
    const instagramUrl = 'instagram://camera';
    const canOpen = await Linking.canOpenURL(instagramUrl);
    
    if (canOpen) {
      Alert.alert(
        '📸 Compartir en Instagram',
        'Haz una captura de la app y compártela en tu historia con los hashtags:\n\n#CaseroStars #Granada #BastaDeAbusos',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Abrir Instagram', 
            onPress: () => Linking.openURL(instagramUrl)
          },
        ]
      );
    } else {
      Alert.alert(
        'Instagram no instalado',
        'Comparte en otras redes sociales',
        [{ text: 'OK' }]
      );
    }
  };

  const handleShareTikTok = async () => {
    const tiktokUrl = 'tiktok://';  
    const canOpen = await Linking.canOpenURL(tiktokUrl);
    
    if (canOpen) {
      Alert.alert(
        '🎵 Compartir en TikTok',
        'Graba un video mostrando la app y usa los hashtags:\n\n#CaseroStars #Granada #BastaDeAbusos #Estudiantes',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Abrir TikTok', 
            onPress: () => Linking.openURL(tiktokUrl)
          },
        ]
      );
    } else {
      Alert.alert(
        'TikTok no instalado',
        'Comparte en otras redes sociales',
        [{ text: 'OK' }]
      );
    }
  };

  const handleShareTwitter = async () => {
    const tweet = encodeURIComponent(
      '🌟 ¡Únete a @CaseroStars! La app para valorar alquileres y proteger a estudiantes de caseros abusivos en #Granada 💪\n\n¡Basta de pagar 800€ por un zulo!\n\n#CaseroStars #BastaDeAbusos #Estudiantes'
    );
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweet}`;
    await Linking.openURL(twitterUrl);
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

        {/* Social Sharing Section */}
        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>📢 ¡Corre la voz!</Text>
          <Text style={styles.sectionSubtitle}>Comparte y ayuda a otros estudiantes</Text>
          
          <View style={styles.socialButtons}>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#E4405F' }]} onPress={handleShareInstagram}>
              <Ionicons name="logo-instagram" size={24} color="#fff" />
              <Text style={styles.socialButtonText}>Instagram</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#000' }]} onPress={handleShareTikTok}>
              <Ionicons name="musical-notes" size={24} color="#fff" />
              <Text style={styles.socialButtonText}>TikTok</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#1DA1F2' }]} onPress={handleShareTwitter}>
              <Ionicons name="logo-twitter" size={24} color="#fff" />
              <Text style={styles.socialButtonText}>Twitter</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.shareAllButton} onPress={handleShareApp}>
            <Ionicons name="share-social" size={20} color="#0f0f1a" />
            <Text style={styles.shareAllText}>Compartir en cualquier app</Text>
          </TouchableOpacity>
        </View>

        {/* Hashtags */}
        <View style={styles.hashtagsSection}>
          <Text style={styles.hashtagsTitle}>🏷️ Hashtags oficiales</Text>
          <View style={styles.hashtags}>
            <View style={styles.hashtag}><Text style={styles.hashtagText}>#CaseroStars</Text></View>
            <View style={styles.hashtag}><Text style={styles.hashtagText}>#Granada</Text></View>
            <View style={styles.hashtag}><Text style={styles.hashtagText}>#BastaDeAbusos</Text></View>
            <View style={styles.hashtag}><Text style={styles.hashtagText}>#Estudiantes</Text></View>
            <View style={styles.hashtag}><Text style={styles.hashtagText}>#AlquilerJusto</Text></View>
          </View>
        </View>

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
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  badgeText: {
    color: '#ffd700',
    fontSize: 13,
    fontWeight: '600',
  },
  shareSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  shareAllButton: {
    flexDirection: 'row',
    backgroundColor: '#ffd700',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareAllText: {
    color: '#0f0f1a',
    fontSize: 15,
    fontWeight: 'bold',
  },
  hashtagsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  hashtagsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  hashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtag: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hashtagText: {
    color: '#4ecdc4',
    fontSize: 13,
    fontWeight: '600',
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
    marginBottom: 12,
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
    fontSize: 36,
    marginBottom: 8,
  },
  missionTitle: {
    color: '#ffd700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  missionText: {
    color: '#ccc',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoText: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  tipEmoji: {
    fontSize: 20,
  },
  tipText: {
    color: '#fff',
    fontSize: 14,
  },
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
  logoutText: {
    color: '#ff4444',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
});
