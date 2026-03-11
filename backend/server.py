from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'casero-stars-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Casero Stars API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Spanish cities with zones and coordinates
SPAIN_CITIES = {
    "Granada": {
        "lat": 37.1773,
        "lng": -3.5986,
        "featured": True,
        "emoji": "🏔️",
        "zonas": {
            "Centro": {"lat": 37.1773, "lng": -3.5986},
            "Realejo": {"lat": 37.1720, "lng": -3.5920},
            "Albaicín": {"lat": 37.1810, "lng": -3.5920},
            "Zaidín": {"lat": 37.1620, "lng": -3.6050},
            "Camino de Ronda": {"lat": 37.1750, "lng": -3.6100},
            "Facultades": {"lat": 37.1830, "lng": -3.6070},
            "Cartuja": {"lat": 37.1920, "lng": -3.5950},
            "Chana": {"lat": 37.1850, "lng": -3.6200},
            "Beiro": {"lat": 37.1900, "lng": -3.6100},
        }
    },
    "Madrid": {
        "lat": 40.4168,
        "lng": -3.7038,
        "featured": False,
        "emoji": "🏙️",
        "zonas": {
            "Centro": {"lat": 40.4168, "lng": -3.7038},
            "Malasaña": {"lat": 40.4260, "lng": -3.7050},
            "Lavapiés": {"lat": 40.4090, "lng": -3.7010},
            "Chueca": {"lat": 40.4220, "lng": -3.6970},
            "Moncloa": {"lat": 40.4350, "lng": -3.7200},
            "Arganzuela": {"lat": 40.3980, "lng": -3.6950},
            "Chamberí": {"lat": 40.4350, "lng": -3.6970},
            "Tetuan": {"lat": 40.4600, "lng": -3.6980},
            "Vallecas": {"lat": 40.3780, "lng": -3.6510},
        }
    },
    "Barcelona": {
        "lat": 41.3851,
        "lng": 2.1734,
        "featured": False,
        "emoji": "🏖️",
        "zonas": {
            "Gràcia": {"lat": 41.4025, "lng": 2.1560},
            "Eixample": {"lat": 41.3890, "lng": 2.1620},
            "Sants": {"lat": 41.3750, "lng": 2.1330},
            "Poble Sec": {"lat": 41.3720, "lng": 2.1620},
            "Raval": {"lat": 41.3800, "lng": 2.1680},
            "Gòtic": {"lat": 41.3830, "lng": 2.1770},
            "Poblenou": {"lat": 41.4030, "lng": 2.2040},
            "Sant Martí": {"lat": 41.4180, "lng": 2.1990},
            "Horta": {"lat": 41.4290, "lng": 2.1630},
        }
    },
    "Sevilla": {
        "lat": 37.3891,
        "lng": -5.9845,
        "featured": False,
        "emoji": "🎺",
        "zonas": {
            "Centro": {"lat": 37.3891, "lng": -5.9845},
            "Triana": {"lat": 37.3830, "lng": -6.0030},
            "Macarena": {"lat": 37.4050, "lng": -5.9870},
            "Nervion": {"lat": 37.3870, "lng": -5.9680},
            "Los Remedios": {"lat": 37.3750, "lng": -6.0070},
            "Santa Cruz": {"lat": 37.3860, "lng": -5.9860},
        }
    },
    "Valencia": {
        "lat": 39.4699,
        "lng": -0.3763,
        "featured": False,
        "emoji": "🍊",
        "zonas": {
            "Centro": {"lat": 39.4699, "lng": -0.3763},
            "Ruzafa": {"lat": 39.4590, "lng": -0.3720},
            "Benimaclet": {"lat": 39.4890, "lng": -0.3590},
            "Poblats Marítims": {"lat": 39.4580, "lng": -0.3270},
            "Campanar": {"lat": 39.4830, "lng": -0.3980},
            "Patraix": {"lat": 39.4600, "lng": -0.3920},
        }
    },
    "Málaga": {
        "lat": 36.7213,
        "lng": -4.4214,
        "featured": False,
        "emoji": "☀️",
        "zonas": {
            "Centro": {"lat": 36.7213, "lng": -4.4214},
            "Teatinos": {"lat": 36.7150, "lng": -4.4780},
            "El Palo": {"lat": 36.7230, "lng": -4.3590},
            "Huelin": {"lat": 36.7080, "lng": -4.4430},
            "La Malagueta": {"lat": 36.7180, "lng": -4.4100},
        }
    },
    "Salamanca": {
        "lat": 40.9701,
        "lng": -5.6635,
        "featured": False,
        "emoji": "🏛️",
        "zonas": {
            "Centro": {"lat": 40.9701, "lng": -5.6635},
            "Garrido": {"lat": 40.9780, "lng": -5.6570},
            "San Bernardo": {"lat": 40.9650, "lng": -5.6750},
            "Pizarrales": {"lat": 40.9620, "lng": -5.6800},
        }
    },
    "Zaragoza": {
        "lat": 41.6488,
        "lng": -0.8891,
        "featured": False,
        "emoji": "🗿",
        "zonas": {
            "Centro": {"lat": 41.6488, "lng": -0.8891},
            "Delicias": {"lat": 41.6420, "lng": -0.9100},
            "Universidad": {"lat": 41.6380, "lng": -0.9000},
            "San José": {"lat": 41.6550, "lng": -0.8700},
        }
    },
    "Bilbao": {
        "lat": 43.2630,
        "lng": -2.9350,
        "featured": False,
        "emoji": "🌧️",
        "zonas": {
            "Casco Viejo": {"lat": 43.2590, "lng": -2.9230},
            "Deusto": {"lat": 43.2750, "lng": -2.9450},
            "San Ignacio": {"lat": 43.2650, "lng": -2.9580},
            "Santutxu": {"lat": 43.2520, "lng": -2.9150},
        }
    },
    "Santiago de Compostela": {
        "lat": 42.8782,
        "lng": -8.5448,
        "featured": False,
        "emoji": "⛪",
        "zonas": {
            "Centro": {"lat": 42.8782, "lng": -8.5448},
            "Ensanche": {"lat": 42.8730, "lng": -8.5530},
            "Vista Alegre": {"lat": 42.8680, "lng": -8.5600},
        }
    },
}

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    user_type: str = "inquilino"
    ciudad: str = "Granada"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    user_type: str
    ciudad: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class RatingCreate(BaseModel):
    estado_piso: int = Field(ge=1, le=5)
    calidad_precio: int = Field(ge=1, le=5)
    comportamiento_casero: int = Field(ge=1, le=5)
    ubicacion: int = Field(ge=1, le=5)
    fotos_reales: int = Field(ge=1, le=5)
    comentario: Optional[str] = None

class RatingResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    piso_id: str
    estado_piso: int
    calidad_precio: int
    comportamiento_casero: int
    ubicacion: int
    fotos_reales: int
    promedio: float
    comentario: Optional[str]
    created_at: datetime

class PisoCreate(BaseModel):
    direccion: str
    zona: str
    ciudad: str = "Granada"
    precio_mensual: float
    descripcion: Optional[str] = None
    fotos: List[str] = []

class PisoResponse(BaseModel):
    id: str
    direccion: str
    zona: str
    ciudad: str
    precio_mensual: float
    descripcion: Optional[str]
    fotos: List[str]
    promedio_general: float
    total_valoraciones: int
    created_by: str
    created_by_name: str
    created_at: datetime
    lat: Optional[float] = None
    lng: Optional[float] = None

class PisoDetail(PisoResponse):
    valoraciones: List[RatingResponse]

class ZoneStats(BaseModel):
    zona: str
    ciudad: str
    total_pisos: int
    precio_medio: float
    precio_min: float
    precio_max: float
    valoracion_media: float
    lat: float
    lng: float

class CityStats(BaseModel):
    ciudad: str
    emoji: str
    total_pisos: int
    precio_medio: float
    valoracion_media: float
    featured: bool

class GeneralStats(BaseModel):
    total_pisos: int
    total_valoraciones: int
    total_usuarios: int
    precio_medio_espana: float
    ciudades: List[CityStats]
    zonas: List[ZoneStats]

class NotificationSubscription(BaseModel):
    push_token: str
    ciudades: List[str] = []
    zonas: List[str] = []

# ==================== AUTH HELPERS ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    return user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email ya registrado")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "user_type": user_data.user_type,
        "ciudad": user_data.ciudad,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    access_token = create_access_token(data={"sub": user_id})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            user_type=user_data.user_type,
            ciudad=user_data.ciudad,
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contraseña incorrectos")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            user_type=user["user_type"],
            ciudad=user.get("ciudad", "Granada"),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        user_type=current_user["user_type"],
        ciudad=current_user.get("ciudad", "Granada"),
        created_at=current_user["created_at"]
    )

# ==================== CITIES ROUTES ====================

@api_router.get("/ciudades")
async def get_ciudades():
    """Get all available cities"""
    ciudades = []
    for ciudad, data in SPAIN_CITIES.items():
        ciudades.append({
            "nombre": ciudad,
            "lat": data["lat"],
            "lng": data["lng"],
            "emoji": data["emoji"],
            "featured": data["featured"],
            "num_zonas": len(data["zonas"])
        })
    # Sort with featured first, then alphabetically
    ciudades.sort(key=lambda x: (not x["featured"], x["nombre"]))
    return {"ciudades": ciudades}

@api_router.get("/ciudades/{ciudad}/zonas")
async def get_zonas_ciudad(ciudad: str):
    """Get zones for a specific city"""
    if ciudad not in SPAIN_CITIES:
        raise HTTPException(status_code=404, detail="Ciudad no encontrada")
    
    city_data = SPAIN_CITIES[ciudad]
    zonas = [{"nombre": zona, **coords} for zona, coords in city_data["zonas"].items()]
    return {"ciudad": ciudad, "zonas": zonas}

# ==================== PISO ROUTES ====================

@api_router.post("/pisos", response_model=PisoResponse)
async def create_piso(piso_data: PisoCreate, current_user: dict = Depends(get_current_user)):
    piso_id = str(uuid.uuid4())
    
    # Get coordinates
    lat, lng = None, None
    if piso_data.ciudad in SPAIN_CITIES:
        city_data = SPAIN_CITIES[piso_data.ciudad]
        if piso_data.zona in city_data["zonas"]:
            coords = city_data["zonas"][piso_data.zona]
            lat, lng = coords["lat"], coords["lng"]
        else:
            lat, lng = city_data["lat"], city_data["lng"]
    
    piso_doc = {
        "id": piso_id,
        "direccion": piso_data.direccion,
        "zona": piso_data.zona,
        "ciudad": piso_data.ciudad,
        "precio_mensual": piso_data.precio_mensual,
        "descripcion": piso_data.descripcion,
        "fotos": piso_data.fotos,
        "lat": lat,
        "lng": lng,
        "created_by": current_user["id"],
        "created_by_name": current_user["name"],
        "created_at": datetime.utcnow()
    }
    
    await db.pisos.insert_one(piso_doc)
    
    return PisoResponse(
        id=piso_id,
        direccion=piso_data.direccion,
        zona=piso_data.zona,
        ciudad=piso_data.ciudad,
        precio_mensual=piso_data.precio_mensual,
        descripcion=piso_data.descripcion,
        fotos=piso_data.fotos,
        promedio_general=0.0,
        total_valoraciones=0,
        created_by=current_user["id"],
        created_by_name=current_user["name"],
        created_at=piso_doc["created_at"],
        lat=lat,
        lng=lng
    )

@api_router.get("/pisos", response_model=List[PisoResponse])
async def get_pisos(ciudad: Optional[str] = None, zona: Optional[str] = None, min_rating: Optional[float] = None):
    query = {}
    if ciudad:
        query["ciudad"] = ciudad
    if zona:
        query["zona"] = {"$regex": zona, "$options": "i"}
    
    pisos = await db.pisos.find(query).to_list(1000)
    
    result = []
    for piso in pisos:
        valoraciones = await db.valoraciones.find({"piso_id": piso["id"]}).to_list(1000)
        total = len(valoraciones)
        promedio = 0.0
        if total > 0:
            promedios = [(v["estado_piso"] + v["calidad_precio"] + v["comportamiento_casero"] + 
                         v["ubicacion"] + v["fotos_reales"]) / 5 for v in valoraciones]
            promedio = sum(promedios) / total
        
        if min_rating and promedio < min_rating:
            continue
            
        result.append(PisoResponse(
            id=piso["id"],
            direccion=piso["direccion"],
            zona=piso["zona"],
            ciudad=piso.get("ciudad", "Granada"),
            precio_mensual=piso["precio_mensual"],
            descripcion=piso.get("descripcion"),
            fotos=piso.get("fotos", []),
            promedio_general=round(promedio, 1),
            total_valoraciones=total,
            created_by=piso["created_by"],
            created_by_name=piso["created_by_name"],
            created_at=piso["created_at"],
            lat=piso.get("lat"),
            lng=piso.get("lng")
        ))
    
    result.sort(key=lambda x: x.promedio_general, reverse=True)
    return result

@api_router.get("/pisos/{piso_id}", response_model=PisoDetail)
async def get_piso(piso_id: str):
    piso = await db.pisos.find_one({"id": piso_id})
    if not piso:
        raise HTTPException(status_code=404, detail="Piso no encontrado")
    
    valoraciones = await db.valoraciones.find({"piso_id": piso_id}).sort("created_at", -1).to_list(1000)
    
    total = len(valoraciones)
    promedio = 0.0
    if total > 0:
        promedios = [(v["estado_piso"] + v["calidad_precio"] + v["comportamiento_casero"] + 
                     v["ubicacion"] + v["fotos_reales"]) / 5 for v in valoraciones]
        promedio = sum(promedios) / total
    
    rating_responses = [
        RatingResponse(
            id=v["id"],
            user_id=v["user_id"],
            user_name=v["user_name"],
            piso_id=v["piso_id"],
            estado_piso=v["estado_piso"],
            calidad_precio=v["calidad_precio"],
            comportamiento_casero=v["comportamiento_casero"],
            ubicacion=v["ubicacion"],
            fotos_reales=v["fotos_reales"],
            promedio=(v["estado_piso"] + v["calidad_precio"] + v["comportamiento_casero"] + 
                     v["ubicacion"] + v["fotos_reales"]) / 5,
            comentario=v.get("comentario"),
            created_at=v["created_at"]
        ) for v in valoraciones
    ]
    
    return PisoDetail(
        id=piso["id"],
        direccion=piso["direccion"],
        zona=piso["zona"],
        ciudad=piso.get("ciudad", "Granada"),
        precio_mensual=piso["precio_mensual"],
        descripcion=piso.get("descripcion"),
        fotos=piso.get("fotos", []),
        promedio_general=round(promedio, 1),
        total_valoraciones=total,
        created_by=piso["created_by"],
        created_by_name=piso["created_by_name"],
        created_at=piso["created_at"],
        valoraciones=rating_responses,
        lat=piso.get("lat"),
        lng=piso.get("lng")
    )

# ==================== VALORACION ROUTES ====================

@api_router.post("/pisos/{piso_id}/valoraciones", response_model=RatingResponse)
async def create_valoracion(piso_id: str, rating_data: RatingCreate, current_user: dict = Depends(get_current_user)):
    piso = await db.pisos.find_one({"id": piso_id})
    if not piso:
        raise HTTPException(status_code=404, detail="Piso no encontrado")
    
    existing = await db.valoraciones.find_one({"piso_id": piso_id, "user_id": current_user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Ya has valorado este piso")
    
    rating_id = str(uuid.uuid4())
    promedio = (rating_data.estado_piso + rating_data.calidad_precio + rating_data.comportamiento_casero +
               rating_data.ubicacion + rating_data.fotos_reales) / 5
    
    rating_doc = {
        "id": rating_id,
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "piso_id": piso_id,
        "estado_piso": rating_data.estado_piso,
        "calidad_precio": rating_data.calidad_precio,
        "comportamiento_casero": rating_data.comportamiento_casero,
        "ubicacion": rating_data.ubicacion,
        "fotos_reales": rating_data.fotos_reales,
        "comentario": rating_data.comentario,
        "created_at": datetime.utcnow()
    }
    
    await db.valoraciones.insert_one(rating_doc)
    
    return RatingResponse(
        id=rating_id,
        user_id=current_user["id"],
        user_name=current_user["name"],
        piso_id=piso_id,
        estado_piso=rating_data.estado_piso,
        calidad_precio=rating_data.calidad_precio,
        comportamiento_casero=rating_data.comportamiento_casero,
        ubicacion=rating_data.ubicacion,
        fotos_reales=rating_data.fotos_reales,
        promedio=promedio,
        comentario=rating_data.comentario,
        created_at=rating_doc["created_at"]
    )

# ==================== STATS ROUTES ====================

@api_router.get("/stats", response_model=GeneralStats)
async def get_stats(ciudad: Optional[str] = None):
    """Get statistics, optionally filtered by city"""
    query = {}
    if ciudad:
        query["ciudad"] = ciudad
    
    pisos = await db.pisos.find(query).to_list(1000)
    all_pisos = await db.pisos.find().to_list(1000)
    valoraciones = await db.valoraciones.find().to_list(1000)
    usuarios = await db.users.find().to_list(1000)
    
    total_pisos = len(pisos)
    total_valoraciones = len(valoraciones)
    total_usuarios = len(usuarios)
    
    # Calculate average price for Spain
    if all_pisos:
        precio_medio_espana = sum(p["precio_mensual"] for p in all_pisos) / len(all_pisos)
    else:
        precio_medio_espana = 0
    
    # Stats by city
    cities_data = {}
    for piso in all_pisos:
        city = piso.get("ciudad", "Granada")
        if city not in cities_data:
            cities_data[city] = {"precios": [], "piso_ids": []}
        cities_data[city]["precios"].append(piso["precio_mensual"])
        cities_data[city]["piso_ids"].append(piso["id"])
    
    city_stats = []
    for city, data in cities_data.items():
        city_valoraciones = [v for v in valoraciones if v["piso_id"] in data["piso_ids"]]
        avg_rating = 0
        if city_valoraciones:
            avg_rating = sum(
                (v["estado_piso"] + v["calidad_precio"] + v["comportamiento_casero"] + 
                 v["ubicacion"] + v["fotos_reales"]) / 5 for v in city_valoraciones
            ) / len(city_valoraciones)
        
        city_info = SPAIN_CITIES.get(city, {"emoji": "🏠", "featured": False})
        
        city_stats.append(CityStats(
            ciudad=city,
            emoji=city_info.get("emoji", "🏠"),
            total_pisos=len(data["precios"]),
            precio_medio=round(sum(data["precios"]) / len(data["precios"]), 0),
            valoracion_media=round(avg_rating, 1),
            featured=city_info.get("featured", False)
        ))
    
    city_stats.sort(key=lambda x: (not x.featured, x.precio_medio))
    
    # Stats by zone (filtered by ciudad if provided)
    zones_data = {}
    for piso in pisos:
        key = f"{piso.get('ciudad', 'Granada')}|{piso['zona']}"
        if key not in zones_data:
            zones_data[key] = {"precios": [], "piso_ids": [], "ciudad": piso.get('ciudad', 'Granada'), "zona": piso['zona']}
        zones_data[key]["precios"].append(piso["precio_mensual"])
        zones_data[key]["piso_ids"].append(piso["id"])
    
    zone_stats = []
    for key, data in zones_data.items():
        zone_valoraciones = [v for v in valoraciones if v["piso_id"] in data["piso_ids"]]
        avg_rating = 0
        if zone_valoraciones:
            avg_rating = sum(
                (v["estado_piso"] + v["calidad_precio"] + v["comportamiento_casero"] + 
                 v["ubicacion"] + v["fotos_reales"]) / 5 for v in zone_valoraciones
            ) / len(zone_valoraciones)
        
        city_data = SPAIN_CITIES.get(data["ciudad"], {})
        zone_coords = city_data.get("zonas", {}).get(data["zona"], {"lat": 37.1773, "lng": -3.5986})
        
        zone_stats.append(ZoneStats(
            zona=data["zona"],
            ciudad=data["ciudad"],
            total_pisos=len(data["precios"]),
            precio_medio=round(sum(data["precios"]) / len(data["precios"]), 0),
            precio_min=min(data["precios"]),
            precio_max=max(data["precios"]),
            valoracion_media=round(avg_rating, 1),
            lat=zone_coords.get("lat", 37.1773),
            lng=zone_coords.get("lng", -3.5986)
        ))
    
    zone_stats.sort(key=lambda x: x.precio_medio)
    
    return GeneralStats(
        total_pisos=total_pisos,
        total_valoraciones=total_valoraciones,
        total_usuarios=total_usuarios,
        precio_medio_espana=round(precio_medio_espana, 0),
        ciudades=city_stats,
        zonas=zone_stats
    )

@api_router.get("/zonas")
async def get_zonas():
    """Get unique zones from all pisos"""
    pisos = await db.pisos.find().to_list(1000)
    zonas = list(set([p["zona"] for p in pisos]))
    return {"zonas": sorted(zonas)}

@api_router.get("/zonas/coords")
async def get_zonas_coords(ciudad: str = "Granada"):
    """Get zones with coordinates for a city"""
    if ciudad in SPAIN_CITIES:
        return {"zonas": SPAIN_CITIES[ciudad]["zonas"]}
    return {"zonas": {}}

# ==================== NOTIFICATIONS ROUTES ====================

@api_router.post("/notifications/subscribe")
async def subscribe_notifications(subscription: NotificationSubscription, current_user: dict = Depends(get_current_user)):
    sub_doc = {
        "user_id": current_user["id"],
        "push_token": subscription.push_token,
        "ciudades": subscription.ciudades,
        "zonas": subscription.zonas,
        "created_at": datetime.utcnow()
    }
    
    await db.notification_subscriptions.update_one(
        {"user_id": current_user["id"]},
        {"$set": sub_doc},
        upsert=True
    )
    
    return {"message": "Subscripción actualizada"}

@api_router.get("/")
async def root():
    return {"message": "Casero Stars API - Valora tu alquiler en toda España"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
