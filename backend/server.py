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

# ==================== MODELS ====================

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    user_type: str = "inquilino"  # inquilino or casero

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    user_type: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Rating Models
class RatingCreate(BaseModel):
    estado_piso: int = Field(ge=1, le=5)  # 1-5 stars
    calidad_precio: int = Field(ge=1, le=5)
    comportamiento_casero: int = Field(ge=1, le=5)
    ubicacion: int = Field(ge=1, le=5)
    fotos_reales: int = Field(ge=1, le=5)  # How real are the photos
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

# Piso (Apartment) Models
class PisoCreate(BaseModel):
    direccion: str
    zona: str
    precio_mensual: float
    descripcion: Optional[str] = None
    fotos: List[str] = []  # Base64 encoded images

class PisoUpdate(BaseModel):
    direccion: Optional[str] = None
    zona: Optional[str] = None
    precio_mensual: Optional[float] = None
    descripcion: Optional[str] = None
    fotos: Optional[List[str]] = None

class PisoResponse(BaseModel):
    id: str
    direccion: str
    zona: str
    precio_mensual: float
    descripcion: Optional[str]
    fotos: List[str]
    promedio_general: float
    total_valoraciones: int
    created_by: str
    created_by_name: str
    created_at: datetime

class PisoDetail(PisoResponse):
    valoraciones: List[RatingResponse]

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
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ya registrado"
        )
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "user_type": user_data.user_type,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        user_type=user_data.user_type,
        created_at=user_doc["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        user_type=user["user_type"],
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        user_type=current_user["user_type"],
        created_at=current_user["created_at"]
    )

# ==================== PISO ROUTES ====================

@api_router.post("/pisos", response_model=PisoResponse)
async def create_piso(piso_data: PisoCreate, current_user: dict = Depends(get_current_user)):
    piso_id = str(uuid.uuid4())
    
    piso_doc = {
        "id": piso_id,
        "direccion": piso_data.direccion,
        "zona": piso_data.zona,
        "precio_mensual": piso_data.precio_mensual,
        "descripcion": piso_data.descripcion,
        "fotos": piso_data.fotos,
        "created_by": current_user["id"],
        "created_by_name": current_user["name"],
        "created_at": datetime.utcnow()
    }
    
    await db.pisos.insert_one(piso_doc)
    
    return PisoResponse(
        id=piso_id,
        direccion=piso_data.direccion,
        zona=piso_data.zona,
        precio_mensual=piso_data.precio_mensual,
        descripcion=piso_data.descripcion,
        fotos=piso_data.fotos,
        promedio_general=0.0,
        total_valoraciones=0,
        created_by=current_user["id"],
        created_by_name=current_user["name"],
        created_at=piso_doc["created_at"]
    )

@api_router.get("/pisos", response_model=List[PisoResponse])
async def get_pisos(zona: Optional[str] = None, min_rating: Optional[float] = None):
    query = {}
    if zona:
        query["zona"] = {"$regex": zona, "$options": "i"}
    
    pisos = await db.pisos.find(query).to_list(1000)
    
    result = []
    for piso in pisos:
        # Calculate average rating
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
            precio_mensual=piso["precio_mensual"],
            descripcion=piso.get("descripcion"),
            fotos=piso.get("fotos", []),
            promedio_general=round(promedio, 1),
            total_valoraciones=total,
            created_by=piso["created_by"],
            created_by_name=piso["created_by_name"],
            created_at=piso["created_at"]
        ))
    
    # Sort by rating descending
    result.sort(key=lambda x: x.promedio_general, reverse=True)
    return result

@api_router.get("/pisos/{piso_id}", response_model=PisoDetail)
async def get_piso(piso_id: str):
    piso = await db.pisos.find_one({"id": piso_id})
    if not piso:
        raise HTTPException(status_code=404, detail="Piso no encontrado")
    
    # Get valoraciones
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
        precio_mensual=piso["precio_mensual"],
        descripcion=piso.get("descripcion"),
        fotos=piso.get("fotos", []),
        promedio_general=round(promedio, 1),
        total_valoraciones=total,
        created_by=piso["created_by"],
        created_by_name=piso["created_by_name"],
        created_at=piso["created_at"],
        valoraciones=rating_responses
    )

# ==================== VALORACION ROUTES ====================

@api_router.post("/pisos/{piso_id}/valoraciones", response_model=RatingResponse)
async def create_valoracion(piso_id: str, rating_data: RatingCreate, current_user: dict = Depends(get_current_user)):
    # Check if piso exists
    piso = await db.pisos.find_one({"id": piso_id})
    if not piso:
        raise HTTPException(status_code=404, detail="Piso no encontrado")
    
    # Check if user already rated this piso
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

@api_router.get("/zonas")
async def get_zonas():
    """Get unique zones from all pisos"""
    pisos = await db.pisos.find().to_list(1000)
    zonas = list(set([p["zona"] for p in pisos]))
    return {"zonas": sorted(zonas)}

@api_router.get("/")
async def root():
    return {"message": "Casero Stars API - Valora tu alquiler"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
