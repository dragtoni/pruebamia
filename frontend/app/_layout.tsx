import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a2e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#0f0f1a',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: 'Iniciar Sesión', headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ title: 'Registro', headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="piso/[id]" options={{ title: 'Detalle del Piso' }} />
        <Stack.Screen name="piso/nuevo" options={{ title: 'Añadir Piso' }} />
        <Stack.Screen name="piso/valorar/[id]" options={{ title: 'Valorar Piso' }} />
      </Stack>
    </AuthProvider>
  );
}
