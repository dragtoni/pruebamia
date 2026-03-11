# 📱 Guía para Publicar Casero Stars en Play Store

## 📋 Requisitos Previos

### 1. Cuenta de Google Play Developer
- **Costo**: $25 USD (pago único)
- **Crear en**: [Google Play Console](https://play.google.com/console)
- **Tiempo de aprobación**: 24-48 horas

### 2. Cuenta de Expo (EAS)
- **Crear en**: [expo.dev](https://expo.dev)
- **Gratuita** para builds limitados
- **Plan Pro** recomendado para producción

---

## 🛠️ Pasos para Generar el APK/AAB

### Paso 1: Guardar código en GitHub
1. En Emergent, click en **"Save to GitHub"**
2. Configura tu repositorio (público o privado)
3. Espera a que se complete el push

### Paso 2: Clonar en tu máquina local
```bash
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO/frontend
```

### Paso 3: Instalar dependencias
```bash
npm install -g eas-cli
npm install
```

### Paso 4: Login en Expo
```bash
eas login
```

### Paso 5: Configurar proyecto
```bash
eas build:configure
```

### Paso 6: Generar APK (para pruebas)
```bash
eas build --platform android --profile preview
```
Esto genera un archivo `.apk` que puedes instalar directamente.

### Paso 7: Generar AAB (para Play Store)
```bash
eas build --platform android --profile production
```
Esto genera un archivo `.aab` que subes a Play Console.

---

## 📝 Información para Play Store

### Datos de la App
- **Nombre**: Casero Stars
- **Categoría**: Lifestyle > House & Home
- **Clasificación de contenido**: PEGI 3 / Everyone
- **Idioma principal**: Español

### Descripción Corta (80 caracteres)
```
Valora y descubre alquileres con opiniones reales de inquilinos en España.
```

### Descripción Larga
```
Casero Stars es la primera app española donde los inquilinos comparten sus experiencias reales sobre pisos de alquiler y propietarios.

¿Buscas piso? Antes de firmar, consulta las opiniones de otros inquilinos:

⭐ VALORACIONES COMPLETAS
Cada piso se valora en 5 categorías: estado del piso, relación calidad-precio, comportamiento del propietario, ubicación y precisión de las fotos.

📍 TODA ESPAÑA
Disponible en 10 ciudades universitarias: Granada, Madrid, Barcelona, Sevilla, Valencia, Málaga, Salamanca, Zaragoza, Bilbao y Santiago de Compostela.

📸 FOTOS REALES
Ve fotos subidas por inquilinos reales, no solo las del anuncio.

💡 INFORMACIÓN TRANSPARENTE
Precios medios por zona, estadísticas de valoración y más.

🤝 COMUNIDAD
Hecho por estudiantes, para estudiantes. Ayuda a otros compartiendo tu experiencia.

Descarga gratis y únete a la comunidad de inquilinos informados.
```

### Política de Privacidad (OBLIGATORIO)
Debes crear una página web con tu política de privacidad. Opciones:
1. Usar un generador gratuito: [privacypolicies.com](https://www.privacypolicies.com)
2. Crear una página en GitHub Pages
3. Usar Notion y hacer la página pública

---

## 📸 Capturas de Pantalla Necesarias

Play Store requiere:
- **Mínimo 2 capturas** de pantalla
- **Máximo 8** capturas
- **Tamaño**: 16:9 o 9:16
- **Resolución mínima**: 320px (lado más corto)

### Capturas recomendadas:
1. Landing page con el logo
2. Lista de pisos con valoraciones
3. Detalle de un piso
4. Formulario de valoración
5. Mapa interactivo
6. Estadísticas

---

## 🔑 Configuración del Backend para Producción

Antes de publicar, necesitas:

### 1. Servidor de producción
- Opciones: Railway, Render, DigitalOcean, AWS
- Configura variables de entorno

### 2. Base de datos MongoDB
- Opciones: MongoDB Atlas (gratis hasta 512MB)
- Cambia `MONGO_URL` en el servidor de producción

### 3. Actualizar URL del backend
En `/app/frontend/.env`:
```
EXPO_PUBLIC_BACKEND_URL=https://tu-servidor-produccion.com
```

---

## ⏰ Tiempo Estimado de Publicación

| Paso | Tiempo |
|------|--------|
| Crear cuenta Google Play | 1-2 días |
| Configurar Expo/EAS | 30 min |
| Generar build | 15-30 min |
| Completar ficha Play Store | 1-2 horas |
| Revisión de Google | 1-7 días |

**Total**: ~3-10 días

---

## ❓ Preguntas Frecuentes

**¿Cuánto cuesta publicar?**
- Google Play: $25 USD (único)
- Expo EAS: Gratis con límites / $99/mes Pro

**¿Necesito una empresa?**
- No, puedes publicar como desarrollador individual

**¿Puedo actualizar la app después?**
- Sí, simplemente genera un nuevo build y súbelo

**¿Qué pasa con iOS?**
- Requiere cuenta Apple Developer ($99/año)
- El proceso es similar pero más estricto

---

## 📞 Soporte

Si tienes problemas:
- **Expo**: [docs.expo.dev](https://docs.expo.dev)
- **Play Console**: [support.google.com/googleplay/android-developer](https://support.google.com/googleplay/android-developer)
- **Emergent**: support@emergent.sh
