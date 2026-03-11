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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

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

export default function LocationPicker({
  initialLat = 37.1773,
  initialLng = -3.5986,
  cityName,
  onLocationSelect,
  onClose,
}: LocationPickerProps) {
  const webViewRef = useRef<WebView>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number} | null>(null);

  // HTML for the OpenStreetMap with Leaflet
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; width: 100%; }
        #map { height: 100%; width: 100%; }
        .leaflet-control-attribution { display: none; }
        .custom-marker {
          background: #ffd700;
          border: 3px solid #0f0f1a;
          border-radius: 50%;
          width: 20px;
          height: 20px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: true,
          attributionControl: false
        }).setView([${initialLat}, ${initialLng}], 14);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);
        
        var marker = null;
        var customIcon = L.divIcon({
          className: 'custom-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        
        // Handle map clicks
        map.on('click', function(e) {
          var lat = e.latlng.lat;
          var lng = e.latlng.lng;
          
          // Remove old marker
          if (marker) {
            map.removeLayer(marker);
          }
          
          // Add new marker
          marker = L.marker([lat, lng], {icon: customIcon}).addTo(map);
          
          // Send coordinates to React Native
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'click',
            lat: lat,
            lng: lng
          }));
        });
        
        // Function to search location
        function searchLocation(query) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'searching'
          }));
        }
        
        // Function to move map to location
        function moveToLocation(lat, lng) {
          map.setView([lat, lng], 17);
          if (marker) {
            map.removeLayer(marker);
          }
          marker = L.marker([lat, lng], {icon: customIcon}).addTo(map);
        }
        
        // Listen for messages from React Native
        window.addEventListener('message', function(event) {
          try {
            var data = JSON.parse(event.data);
            if (data.action === 'moveTo') {
              moveToLocation(data.lat, data.lng);
            }
          } catch(e) {}
        });
      </script>
    </body>
    </html>
  `;

  // Handle messages from WebView
  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'click') {
        setSelectedCoords({ lat: data.lat, lng: data.lng });
        // Reverse geocode to get address
        fetchAddress(data.lat, data.lng);
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  };

  // Fetch address from coordinates using Nominatim
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es',
            'User-Agent': 'CaseroStars/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data.display_name) {
        // Extract relevant parts of the address
        const address = data.address;
        let formattedAddress = '';
        
        if (address.road) {
          formattedAddress = address.road;
          if (address.house_number) {
            formattedAddress += ' ' + address.house_number;
          }
        } else if (data.display_name) {
          // Take first part of display name
          formattedAddress = data.display_name.split(',')[0];
        }
        
        setSelectedAddress(formattedAddress);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setSelectedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  // Search for a location
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const query = encodeURIComponent(`${searchQuery}, ${cityName}, España`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
        {
          headers: {
            'Accept-Language': 'es',
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
        webViewRef.current?.postMessage(JSON.stringify({
          action: 'moveTo',
          lat: latNum,
          lng: lngNum
        }));
      } else {
        alert('No se encontró la dirección');
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    if (selectedCoords && selectedAddress) {
      onLocationSelect({
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
        address: selectedAddress,
        zona: '', // Will be determined by the parent
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
        <Text style={styles.title}>Selecciona ubicación</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Buscar en ${cityName}...`}
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

      {/* Instructions */}
      <View style={styles.instructions}>
        <Ionicons name="finger-print" size={16} color="#4ecdc4" />
        <Text style={styles.instructionsText}>
          Toca en el mapa para seleccionar la ubicación exacta
        </Text>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={mapHTML}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="map"
          />
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: mapHTML }}
            style={styles.map}
            onMessage={handleMessage}
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
        )}
      </View>

      {/* Selected location */}
      {selectedAddress && (
        <View style={styles.selectedContainer}>
          <View style={styles.selectedInfo}>
            <Ionicons name="location" size={24} color="#ffd700" />
            <View style={styles.selectedTextContainer}>
              <Text style={styles.selectedLabel}>Ubicación seleccionada:</Text>
              <Text style={styles.selectedAddress} numberOfLines={2}>
                {selectedAddress}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Ionicons name="checkmark" size={22} color="#0f0f1a" />
            <Text style={styles.confirmButtonText}>Usar esta dirección</Text>
          </TouchableOpacity>
        </View>
      )}
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
  },
  mapContainer: {
    flex: 1,
    margin: 16,
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
    gap: 12,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
    fontSize: 16,
    fontWeight: '600',
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
});
