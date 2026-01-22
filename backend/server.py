from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT and Password Config
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 1 week
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# OpenAI Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI(title="ZenCycle API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    office_start_time: str = "09:00"
    office_end_time: str = "17:00"
    linkedin_headline: Optional[str] = None
    linkedin_role: Optional[str] = None
    career_goal: Optional[str] = None
    created_at: str

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    office_start_time: Optional[str] = None
    office_end_time: Optional[str] = None
    linkedin_headline: Optional[str] = None
    linkedin_role: Optional[str] = None
    career_goal: Optional[str] = None

class MoodCreate(BaseModel):
    mood: str  # energized, neutral, stressed, optimistic

class MoodResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    date: str
    mood: str
    created_at: str

class AffirmationGenerate(BaseModel):
    mood: str
    career_goal: Optional[str] = None

class AffirmationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    date: str
    text: str
    mood: str
    career_goal: Optional[str] = None
    created_at: str

class SessionCreate(BaseModel):
    session_type: str  # work, break

class SessionUpdate(BaseModel):
    end_time: Optional[str] = None
    completed: Optional[bool] = None
    duration_minutes: Optional[int] = None

class SessionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    start_time: str
    end_time: Optional[str] = None
    session_type: str
    duration_minutes: Optional[int] = None
    completed: bool = False
    created_at: str

class WaterIntakeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    timestamp: str
    created_at: str

class ReflectionCreate(BaseModel):
    reflection_text: Optional[str] = None
    hydration_count: Optional[int] = 0
    break_count: Optional[int] = 0

class ReflectionUpdate(BaseModel):
    reflection_text: Optional[str] = None

class ReflectionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    date: str
    reflection_text: Optional[str] = None
    hydration_count: int = 0
    break_count: int = 0
    affirmation_shown: Optional[str] = None
    created_at: str

class ProgressResponse(BaseModel):
    total_sessions: int = 0
    completed_sessions: int = 0
    completion_rate: float = 0.0
    total_water_intakes: int = 0
    total_breaks: int = 0
    mood_counts: dict = {}
    days_tracked: int = 0

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "office_start_time": "09:00",
        "office_end_time": "17:00",
        "linkedin_headline": None,
        "linkedin_role": None,
        "career_goal": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_access_token(user_id)
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        created_at=now
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(user["id"])
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        first_name=user.get("first_name"),
        last_name=user.get("last_name"),
        office_start_time=user.get("office_start_time", "09:00"),
        office_end_time=user.get("office_end_time", "17:00"),
        linkedin_headline=user.get("linkedin_headline"),
        linkedin_role=user.get("linkedin_role"),
        career_goal=user.get("career_goal"),
        created_at=user["created_at"]
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        first_name=current_user.get("first_name"),
        last_name=current_user.get("last_name"),
        office_start_time=current_user.get("office_start_time", "09:00"),
        office_end_time=current_user.get("office_end_time", "17:00"),
        linkedin_headline=current_user.get("linkedin_headline"),
        linkedin_role=current_user.get("linkedin_role"),
        career_goal=current_user.get("career_goal"),
        created_at=current_user["created_at"]
    )

# ============ USER PROFILE ROUTES ============

@api_router.patch("/user/profile", response_model=UserResponse)
async def update_profile(profile_data: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_dict = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({"id": current_user["id"]}, {"$set": update_dict})
    
    updated_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    return UserResponse(
        id=updated_user["id"],
        email=updated_user["email"],
        first_name=updated_user.get("first_name"),
        last_name=updated_user.get("last_name"),
        office_start_time=updated_user.get("office_start_time", "09:00"),
        office_end_time=updated_user.get("office_end_time", "17:00"),
        linkedin_headline=updated_user.get("linkedin_headline"),
        linkedin_role=updated_user.get("linkedin_role"),
        career_goal=updated_user.get("career_goal"),
        created_at=updated_user["created_at"]
    )

# ============ MOOD ROUTES ============

@api_router.post("/mood", response_model=MoodResponse)
async def create_mood(mood_data: MoodCreate, current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Check if mood already exists for today
    existing = await db.moods.find_one(
        {"user_id": current_user["id"], "date": today},
        {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Mood already logged for today")
    
    mood_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    mood_doc = {
        "id": mood_id,
        "user_id": current_user["id"],
        "date": today,
        "mood": mood_data.mood,
        "created_at": now
    }
    
    await db.moods.insert_one(mood_doc)
    return MoodResponse(**mood_doc)

@api_router.get("/mood/today", response_model=Optional[MoodResponse])
async def get_today_mood(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    mood = await db.moods.find_one(
        {"user_id": current_user["id"], "date": today},
        {"_id": 0}
    )
    if not mood:
        return None
    return MoodResponse(**mood)

# ============ AFFIRMATION ROUTES ============

@api_router.post("/affirmation/generate", response_model=AffirmationResponse)
async def generate_affirmation(data: AffirmationGenerate, current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Check if affirmation already exists for today
    existing = await db.affirmations.find_one(
        {"user_id": current_user["id"], "date": today},
        {"_id": 0}
    )
    if existing:
        return AffirmationResponse(**existing)
    
    # Generate affirmation using OpenAI
    career_goal = data.career_goal or current_user.get("career_goal") or "professional growth"
    
    prompt = f"""Generate a personalized, uplifting affirmation for someone who is feeling {data.mood} today. 
Their career goal is: {career_goal}. 
The affirmation must be exactly 15 words, inspiring, and help them start their day positively.
Return ONLY the affirmation text, nothing else."""
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"affirmation_{current_user['id']}_{today}",
            system_message="You are a wellness coach that creates exactly 15-word motivational affirmations."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=prompt)
        affirmation_text = await chat.send_message(user_message)
        affirmation_text = affirmation_text.strip().strip('"')
    except Exception as e:
        logger.error(f"Error generating affirmation: {e}")
        # Fallback affirmations
        fallbacks = {
            "energized": "Your energy today will fuel incredible achievements. Channel this momentum into your greatest goals.",
            "neutral": "Today offers fresh possibilities. Each small step forward brings you closer to your dreams.",
            "stressed": "Breathe deeply and trust your abilities. You have overcome challenges before and will again.",
            "optimistic": "Your positive outlook attracts wonderful opportunities. Keep believing in your journey ahead always."
        }
        affirmation_text = fallbacks.get(data.mood, fallbacks["neutral"])
    
    affirmation_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    affirmation_doc = {
        "id": affirmation_id,
        "user_id": current_user["id"],
        "date": today,
        "text": affirmation_text,
        "mood": data.mood,
        "career_goal": career_goal,
        "created_at": now
    }
    
    await db.affirmations.insert_one(affirmation_doc)
    return AffirmationResponse(**affirmation_doc)

@api_router.get("/affirmation/today", response_model=Optional[AffirmationResponse])
async def get_today_affirmation(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    affirmation = await db.affirmations.find_one(
        {"user_id": current_user["id"], "date": today},
        {"_id": 0}
    )
    if not affirmation:
        return None
    return AffirmationResponse(**affirmation)

# ============ SESSION ROUTES ============

@api_router.post("/session", response_model=SessionResponse)
async def create_session(session_data: SessionCreate, current_user: dict = Depends(get_current_user)):
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    session_doc = {
        "id": session_id,
        "user_id": current_user["id"],
        "start_time": now,
        "end_time": None,
        "session_type": session_data.session_type,
        "duration_minutes": None,
        "completed": False,
        "created_at": now
    }
    
    await db.sessions.insert_one(session_doc)
    return SessionResponse(**session_doc)

@api_router.patch("/session/{session_id}", response_model=SessionResponse)
async def update_session(session_id: str, session_data: SessionUpdate, current_user: dict = Depends(get_current_user)):
    session = await db.sessions.find_one(
        {"id": session_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    update_dict = {k: v for k, v in session_data.model_dump().items() if v is not None}
    if update_dict:
        await db.sessions.update_one({"id": session_id}, {"$set": update_dict})
    
    updated_session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    return SessionResponse(**updated_session)

@api_router.get("/session/today", response_model=List[SessionResponse])
async def get_today_sessions(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    sessions = await db.sessions.find(
        {"user_id": current_user["id"], "start_time": {"$regex": f"^{today}"}},
        {"_id": 0}
    ).to_list(100)
    return [SessionResponse(**s) for s in sessions]

# ============ WATER INTAKE ROUTES ============

@api_router.post("/water", response_model=WaterIntakeResponse)
async def log_water_intake(current_user: dict = Depends(get_current_user)):
    # Check for duplicate within 60 seconds
    now = datetime.now(timezone.utc)
    one_minute_ago = (now - timedelta(seconds=60)).isoformat()
    
    recent = await db.water_intakes.find_one(
        {"user_id": current_user["id"], "timestamp": {"$gte": one_minute_ago}},
        {"_id": 0}
    )
    if recent:
        raise HTTPException(status_code=400, detail="Water already logged within the last minute")
    
    water_id = str(uuid.uuid4())
    timestamp = now.isoformat()
    
    water_doc = {
        "id": water_id,
        "user_id": current_user["id"],
        "timestamp": timestamp,
        "created_at": timestamp
    }
    
    await db.water_intakes.insert_one(water_doc)
    return WaterIntakeResponse(**water_doc)

@api_router.get("/water/today")
async def get_today_water_count(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    count = await db.water_intakes.count_documents(
        {"user_id": current_user["id"], "timestamp": {"$regex": f"^{today}"}}
    )
    return {"count": count}

# ============ REFLECTION ROUTES ============

@api_router.post("/reflection", response_model=ReflectionResponse)
async def create_reflection(reflection_data: ReflectionCreate, current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Check if reflection exists for today
    existing = await db.reflections.find_one(
        {"user_id": current_user["id"], "date": today},
        {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Reflection already exists for today")
    
    # Get today's affirmation
    affirmation = await db.affirmations.find_one(
        {"user_id": current_user["id"], "date": today},
        {"_id": 0}
    )
    
    reflection_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    reflection_doc = {
        "id": reflection_id,
        "user_id": current_user["id"],
        "date": today,
        "reflection_text": reflection_data.reflection_text,
        "hydration_count": reflection_data.hydration_count,
        "break_count": reflection_data.break_count,
        "affirmation_shown": affirmation["text"] if affirmation else None,
        "created_at": now
    }
    
    await db.reflections.insert_one(reflection_doc)
    return ReflectionResponse(**reflection_doc)

@api_router.patch("/reflection", response_model=ReflectionResponse)
async def update_reflection(reflection_data: ReflectionUpdate, current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    reflection = await db.reflections.find_one(
        {"user_id": current_user["id"], "date": today},
        {"_id": 0}
    )
    if not reflection:
        raise HTTPException(status_code=404, detail="Reflection not found for today")
    
    update_dict = {k: v for k, v in reflection_data.model_dump().items() if v is not None}
    if update_dict:
        await db.reflections.update_one(
            {"user_id": current_user["id"], "date": today},
            {"$set": update_dict}
        )
    
    updated = await db.reflections.find_one(
        {"user_id": current_user["id"], "date": today},
        {"_id": 0}
    )
    return ReflectionResponse(**updated)

@api_router.get("/reflection/today", response_model=Optional[ReflectionResponse])
async def get_today_reflection(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    reflection = await db.reflections.find_one(
        {"user_id": current_user["id"], "date": today},
        {"_id": 0}
    )
    if not reflection:
        return None
    return ReflectionResponse(**reflection)

# ============ PROGRESS ROUTES ============

@api_router.get("/progress/{period}", response_model=ProgressResponse)
async def get_progress(period: str, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    
    if period == "weekly":
        start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    elif period == "monthly":
        start_date = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    elif period == "quarterly":
        start_date = (now - timedelta(days=90)).strftime("%Y-%m-%d")
    else:
        raise HTTPException(status_code=400, detail="Invalid period. Use: weekly, monthly, quarterly")
    
    end_date = now.strftime("%Y-%m-%d")
    
    # Get sessions with projection for optimization
    sessions = await db.sessions.find(
        {
            "user_id": current_user["id"],
            "start_time": {"$gte": start_date, "$lte": end_date + "T23:59:59"}
        },
        {"_id": 0, "session_type": 1, "completed": 1}
    ).to_list(1000)
    
    # Single iteration for efficiency
    total_sessions = 0
    completed_sessions = 0
    total_breaks = 0
    for s in sessions:
        if s["session_type"] == "work":
            total_sessions += 1
            if s.get("completed"):
                completed_sessions += 1
        elif s["session_type"] == "break":
            total_breaks += 1
    
    # Get water intakes
    water_count = await db.water_intakes.count_documents(
        {
            "user_id": current_user["id"],
            "timestamp": {"$gte": start_date, "$lte": end_date + "T23:59:59"}
        }
    )
    
    # Get mood counts with projection for optimization
    moods = await db.moods.find(
        {
            "user_id": current_user["id"],
            "date": {"$gte": start_date, "$lte": end_date}
        },
        {"_id": 0, "mood": 1}
    ).to_list(100)
    
    mood_counts = {}
    for mood in moods:
        m = mood["mood"]
        mood_counts[m] = mood_counts.get(m, 0) + 1
    
    completion_rate = (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0
    
    return ProgressResponse(
        total_sessions=total_sessions,
        completed_sessions=completed_sessions,
        completion_rate=round(completion_rate, 1),
        total_water_intakes=water_count,
        total_breaks=total_breaks,
        mood_counts=mood_counts,
        days_tracked=len(moods)
    )

# ============ HEALTH CHECK ============

@api_router.get("/")
async def root():
    return {"message": "ZenCycle API is running", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
