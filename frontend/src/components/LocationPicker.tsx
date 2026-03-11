import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Only import WebView on native platforms
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  cityName: string;
  onLocationSelect: (data: {
    lat: number;
    lng: number;
    address: string;
    zona: string;
  }) => void;
  onClose: () => void;
}

// Popular zones in Granada with coordinates
const GRANADA_ZONES = [
  { name: 'Centro', lat: 37.1760, lng: -3.5980 },
  { name: 'Realejo', lat: 37.1720, lng: -3.5930 },
  { name: 'Albaicín', lat: 37.1810, lng: -3.5920 },
  { name: 'Zaidín', lat: 37.1630, lng: -3.6000 },
  { name: 'Camino de Ronda', lat: 37.1730, lng: -3.6100 },
  { name: 'Facultades', lat: 37.1820, lng: -3.6080 },
  { name: 'Cartuja', lat: 37.1900, lng: -3.6050 },
  { name: 'Chana', lat: 37.1850, lng: -3.6200 },
  { name: 'Plaza de Toros', lat: 37.1780, lng: -3.6150 },
  { name: 'Genil', lat: 37.1650, lng: -3.5850 },
];

export default function LocationPicker({
  initialLat = 37.1773,
  initialLng = -3.5986,
  cityName,
  onLocationSelect,
  onClose,
}: LocationPickerProps) {
  const webViewRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number} | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // HTML for the OpenStreetMap with Leaflet
  const getMapHTML = () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; width: 100%; overflow: hidden; }
        #map { height: 100%; width: 100%; }
        .leaflet-control-attribution { display: none; }
        .custom-marker {
          background: #ffd700;
          border: 3px solid #0f0f1a;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: true,
          attributionControl: false
        }).setView([${initialLat}, ${initialLng}], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);
        
        var marker = null;
        var customIcon = L.divIcon({
          className: 'custom-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        
        function sendMessage(data) {
          try {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify(data));
            } else {
              window.parent.postMessage(JSON.stringify(data), '*');
            }
          } catch(e) {
            console.error('Error sending message:', e);
          }
        }
        
        map.on('click', function(e) {
          var lat = e.latlng.lat;
          var lng = e.latlng.lng;
          
          if (marker) {
            map.removeLayer(marker);
          }
          
          marker = L.marker([lat, lng], {icon: customIcon}).addTo(map);
          
          sendMessage({
            type: 'mapClick',
            lat: lat,
            lng: lng
          });
        });
        
        function moveToLocation(lat, lng) {
          map.setView([lat, lng], 17);
          if (marker) {
            map.removeLayer(marker);
          }
          marker = L.marker([lat, lng], {icon: customIcon}).addTo(map);
        }
        
        window.addEventListener('message', function(event) {
          try {
            var data = JSON.parse(event.data);
            if (data.action === 'moveTo') {
              moveToLocation(data.lat, data.lng);
            }
          } catch(e) {}
        });

        sendMessage({ type: 'mapReady' });
      </script>
    </body>
    </html>
  `;

  // Listen for messages from iframe (web only)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'mapClick') {
            handleMapClick(data.lat, data.lng);
          } else if (data.type === 'mapReady') {
            setMapLoaded(true);
          }
        } catch (e) {}
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  // Handle map click - get address from coordinates
  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    setSearching(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`,
        {
          headers: {
            'User-Agent': 'CaseroStars/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        let formattedAddress = '';
        
        if (addr.road) {
          formattedAddress = addr.road;
          if (addr.house_number) {
            formattedAddress += ' ' + addr.house_number;
          }
        } else if (addr.pedestrian) {
          formattedAddress = addr.pedestrian;
        } else if (addr.neighbourhood) {
          formattedAddress = addr.neighbourhood;
        } else if (data.display_name) {
          formattedAddress = data.display_name.split(',')[0];
        }
        
        setSelectedAddress(formattedAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } else {
        setSelectedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setSelectedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setSearching(false);
    }
  };

  // Handle WebView messages (mobile only)
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapClick') {
        handleMapClick(data.lat, data.lng);
      } else if (data.type === 'mapReady') {
        setMapLoaded(true);
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  };

  // Search for address
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const query = encodeURIComponent(`${searchQuery}, ${cityName}, España`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&accept-language=es`,
        {
          headers: {
            'User-Agent': 'CaseroStars/1.0'
          }
        }
      );
      const results = await response.json();
      
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lon);
        
        setSelectedCoords({ lat: latNum, lng: lngNum });
        setSelectedAddress(display_name.split(',')[0]);
        
        // Move map to location
        const message = JSON.stringify({ action: 'moveTo', lat: latNum, lng: lngNum });
        
        if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(message, '*');
        } else if (webViewRef.current) {
          webViewRef.current.postMessage(message);
        }
      } else {
        alert('No se encontró la dirección. Intenta con otra búsqueda.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Error al buscar. Inténtalo de nuevo.');
    } finally {
      setSearching(false);
    }
  };

  // Quick select a zone
  const handleQuickSelectZone = (zone: typeof GRANADA_ZONES[0]) => {
    setSelectedCoords({ lat: zone.lat, lng: zone.lng });
    setSelectedAddress(zone.name);
    
    const message = JSON.stringify({ action: 'moveTo', lat: zone.lat, lng: zone.lng });
    
    if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, '*');
    } else if (webViewRef.current) {
      webViewRef.current.postMessage(message);
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    if (selectedCoords && selectedAddress) {
      onLocationSelect({
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
        address: selectedAddress,
        zona: '',
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>📍 Selecciona ubicación</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Buscar dirección en ${cityName}...`}
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={handleSearch}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator size="small" color="#0f0f1a" />
          ) : (
            <Ionicons name="search" size={20} color="#0f0f1a" />
          )}
        </TouchableOpacity>
      </View>

      {/* Quick zone selector */}
      <View style={styles.quickZonesContainer}>
        <Text style={styles.quickZonesLabel}>Zonas populares:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickZonesScroll}>
          {GRANADA_ZONES.map((zone) => (
            <TouchableOpacity
              key={zone.name}
              style={[
                styles.quickZoneChip,
                selectedAddress === zone.name && styles.quickZoneChipActive
              ]}
              onPress={() => handleQuickSelectZone(zone)}
            >
              <Text style={[
                styles.quickZoneChipText,
                selectedAddress === zone.name && styles.quickZoneChipTextActive
              ]}>
                {zone.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Ionicons name="hand-left" size={16} color="#4ecdc4" />
        <Text style={styles.instructionsText}>
          Pincha en el mapa para seleccionar la ubicación exacta
        </Text>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef as any}
            srcDoc={getMapHTML()}
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none',
              borderRadius: 12,
            }}
            title="map"
          />
        ) : WebView ? (
          <WebView
            ref={webViewRef}
            source={{ html: getMapHTML() }}
            style={styles.map}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ffd700" />
                <Text style={styles.loadingText}>Cargando mapa...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Mapa no disponible</Text>
          </View>
        )}
      </View>

      {/* Selected location panel */}
      <View style={styles.selectedContainer}>
        {selectedAddress ? (
          <>
            <View style={styles.selectedInfo}>
              <View style={styles.selectedIcon}>
                <Ionicons name="location" size={28} color="#ffd700" />
              </View>
              <View style={styles.selectedTextContainer}>
                <Text style={styles.selectedLabel}>Ubicación seleccionada:</Text>
                <Text style={styles.selectedAddress} numberOfLines={2}>
                  {selectedAddress}
                </Text>
                {selectedCoords && (
                  <Text style={styles.selectedCoords}>
                    {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
                  </Text>
                )}
              </View>
            </View>
            
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Ionicons name="checkmark-circle" size={24} color="#0f0f1a" />
              <Text style={styles.confirmButtonText}>Usar esta dirección</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptySelection}>
            <Ionicons name="location-outline" size={32} color="#666" />
            <Text style={styles.emptySelectionText}>
              Busca una dirección o pincha en el mapa
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#fff',
    fontSize: 15,
  },
  searchButton: {
    backgroundColor: '#ffd700',
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickZonesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  quickZonesLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  quickZonesScroll: {
    flexGrow: 0,
  },
  quickZoneChip: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  quickZoneChipActive: {
    backgroundColor: '#ffd700',
    borderColor: '#ffd700',
  },
  quickZoneChipText: {
    color: '#888',
    fontSize: 13,
  },
  quickZoneChipTextActive: {
    color: '#0f0f1a',
    fontWeight: '600',
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: '#1a2a2a',
  },
  instructionsText: {
    color: '#4ecdc4',
    fontSize: 13,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    margin: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
  },
  selectedContainer: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    minHeight: 120,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  selectedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a3e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTextContainer: {
    flex: 1,
  },
  selectedLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  selectedAddress: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  selectedCoords: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffd700',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonText: {
    color: '#0f0f1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySelection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptySelectionText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});
