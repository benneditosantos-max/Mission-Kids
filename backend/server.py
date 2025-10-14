from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt
import jwt
import shutil
from enum import Enum
import secrets
from datetime import timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ['JWT_SECRET']
ALGORITHM = "HS256"

# Create directories for uploads
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(title="MissionKids API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

class UserRole(str, Enum):
    PARENT = "parent"
    CHILD = "child"

class TaskFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    AWAITING_VALIDATION = "awaiting_validation"
    APPROVED = "approved"
    REJECTED = "rejected"

class ItemType(str, Enum):
    AVATAR = "avatar"
    ACCESSORY = "accessory"

class ItemClassification(str, Enum):
    SIMPLE = "simple"
    COMMON = "common"
    IMPORTANT = "important"
    RARE = "rare"
    DIAMOND = "diamond"

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: UserRole
    password: Optional[str] = None  # For parents
    pin: Optional[str] = None  # For children
    parent_id: Optional[str] = None  # For children
    xp: int = 0
    level: int = 1
    avatar: str = "hero1"
    allowance_goal: float = 50.0
    earned: float = 0.0  # Current balance available
    total_allowance: float = 0.0  # Total accumulated allowance over time
    # XP Store fields
    inventory: List[str] = []  # List of purchased item IDs
    current_avatar: Optional[str] = None  # Currently equipped avatar ID
    current_accessories: List[str] = []  # Currently equipped accessories IDs
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    role: UserRole
    pin: Optional[str] = None
    parent_id: Optional[str] = None
    allowance_goal: Optional[float] = 50.0

class UserLogin(BaseModel):
    email: str
    password: Optional[str] = None
    pin: Optional[str] = None

class PasswordReset(BaseModel):
    email: str
    name: str
    new_password: str

class PinReset(BaseModel):
    email: str
    name: str
    new_pin: str

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    child_id: str
    value: float
    xp: int
    frequency: TaskFrequency
    photo_required: bool = False
    approval_required: bool = False
    status: TaskStatus = TaskStatus.PENDING
    photo_url: Optional[str] = None
    completed_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    child_id: str
    value: float
    xp: int
    frequency: TaskFrequency
    photo_required: bool = False
    approval_required: bool = False

class SavingsGoal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    child_id: str
    name: str
    target: float
    progress: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Achievement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    child_id: str
    name: str
    description: str
    icon: str
    earned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    child_id: str
    task_id: Optional[str] = None
    amount: float
    type: str  # "task_completion", "allowance_payment", "savings_deposit"
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StoreItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_name: str
    item_type: ItemType
    classification: ItemClassification
    xp_cost: int
    asset_url: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PasswordResetToken(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    token: str
    expires_at: datetime
    used: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Auth helpers
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Auth routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user_dict = user_data.model_dump()
    user_dict['password'] = hashed_password
    user_obj = User(**user_dict)
    
    # Convert to dict and serialize datetime
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    # Create token
    token = create_access_token({"user_id": user_obj.id, "role": user_obj.role})
    
    return {"token": token, "user": user_obj}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Ensure user has role field (defensive programming)
    if "role" not in user:
        raise HTTPException(status_code=500, detail="User account data incomplete")
    
    # For children, verify PIN
    if user["role"] == "child":
        if not login_data.pin or login_data.pin != user.get("pin"):
            raise HTTPException(status_code=401, detail="Invalid PIN")
    else:
        # For parents, verify password
        if not login_data.password or not user.get("password") or not verify_password(login_data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Remove password from user data before returning
    user_response = {k: v for k, v in user.items() if k != "password"}
    token = create_access_token({"user_id": user["id"], "role": user["role"]})
    return {"token": token, "user": user_response}

@api_router.post("/auth/verify-identity")
async def verify_identity(verification_data: dict):
    email = verification_data.get("email")
    name = verification_data.get("name")
    
    if not email or not name:
        raise HTTPException(status_code=400, detail="Email and name are required")
    
    # Find user by email
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Email não encontrado")
    
    # Verify name matches (security check)
    if user["name"].lower() != name.lower():
        raise HTTPException(status_code=400, detail="Nome não confere com o email informado")
    
    return {"message": "Identidade verificada com sucesso!"}

@api_router.post("/auth/reset-password")
async def reset_password(reset_data: PasswordReset):
    # Find user by email
    user = await db.users.find_one({"email": reset_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Email não encontrado")
    
    # Verify name matches (security check)
    if user["name"].lower() != reset_data.name.lower():
        raise HTTPException(status_code=400, detail="Nome não confere com o email informado")
    
    # Hash new password
    new_hashed_password = hash_password(reset_data.new_password)
    
    # Update password
    await db.users.update_one(
        {"email": reset_data.email},
        {"$set": {"password": new_hashed_password}}
    )
    
    return {"message": "Senha redefinida com sucesso!"}

@api_router.post("/auth/reset-pin")
async def reset_pin(reset_data: PinReset):
    # Find user by email
    user = await db.users.find_one({"email": reset_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Email não encontrado")
    
    # Check if it's a child account
    if user["role"] != "child":
        raise HTTPException(status_code=400, detail="Esta função é apenas para contas de crianças")
    
    # Verify name matches (security check)
    if user["name"].lower() != reset_data.name.lower():
        raise HTTPException(status_code=400, detail="Nome não confere com o email informado")
    
    # Validate PIN format (4 digits)
    if not reset_data.new_pin.isdigit() or len(reset_data.new_pin) != 4:
        raise HTTPException(status_code=400, detail="PIN deve ter exatamente 4 dígitos")
    
    # Update PIN
    await db.users.update_one(
        {"email": reset_data.email},
        {"$set": {"pin": reset_data.new_pin}}
    )
    
    return {"message": "PIN redefinido com sucesso!"}

@api_router.post("/auth/forgot-password")
async def forgot_password(request_data: dict):
    """Request password reset token"""
    email = request_data.get("email")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email é obrigatório")
    
    # Find user by email
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        # Return success even if user not found (security best practice)
        return {
            "success": True,
            "message": "Se o email existir, um link de recuperação será enviado"
        }
    
    # Check if it's a parent account (children use PIN, not password)
    if user["role"] == "child":
        raise HTTPException(
            status_code=400, 
            detail="Contas de crianças usam PIN. Use a recuperação de PIN."
        )
    
    # Generate secure token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store token
    reset_token = PasswordResetToken(
        user_id=user["id"],
        token=token,
        expires_at=expires_at
    )
    
    token_doc = reset_token.model_dump()
    token_doc['created_at'] = token_doc['created_at'].isoformat()
    token_doc['expires_at'] = token_doc['expires_at'].isoformat()
    
    await db.password_reset_tokens.insert_one(token_doc)
    
    # In production, send email here
    # For now, return token (mock email system)
    return {
        "success": True,
        "message": "Token de recuperação gerado com sucesso!",
        "token": token,  # In production, this would be sent via email
        "note": "Copie este token para usar na próxima tela (válido por 1 hora)"
    }

@api_router.post("/auth/reset-password-with-token")
async def reset_password_with_token(reset_data: dict):
    """Reset password using token"""
    token = reset_data.get("token")
    new_password = reset_data.get("new_password")
    
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token e nova senha são obrigatórios")
    
    # Find valid token
    token_doc = await db.password_reset_tokens.find_one(
        {"token": token, "used": False},
        {"_id": 0}
    )
    
    if not token_doc:
        raise HTTPException(status_code=400, detail="Token inválido ou já utilizado")
    
    # Check if token expired
    expires_at = datetime.fromisoformat(token_doc["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Token expirado. Solicite um novo.")
    
    # Hash new password
    new_hashed_password = hash_password(new_password)
    
    # Update user password
    await db.users.update_one(
        {"id": token_doc["user_id"]},
        {"$set": {"password": new_hashed_password}}
    )
    
    # Mark token as used
    await db.password_reset_tokens.update_one(
        {"token": token},
        {"$set": {"used": True}}
    )
    
    return {
        "success": True,
        "message": "Senha redefinida com sucesso! Você já pode fazer login."
    }

# User routes
@api_router.get("/users/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return current_user

@api_router.get("/users/children")
async def get_children(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can access this")
    
    children = await db.users.find({"parent_id": current_user["id"]}, {"_id": 0}).to_list(100)
    return children

@api_router.post("/children")
async def register_child(child_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can register children")
    
    # Validate required fields
    if not child_data.get("name") or not child_data.get("email") or not child_data.get("pin"):
        raise HTTPException(status_code=400, detail="Name, email, and PIN are required")
    
    # Check if email already exists
    existing = await db.users.find_one({"email": child_data["email"]})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate PIN format (4 digits)
    if not child_data["pin"].isdigit() or len(child_data["pin"]) != 4:
        raise HTTPException(status_code=400, detail="PIN must be exactly 4 digits")
    
    # Create child user
    child_user = User(
        email=child_data["email"],
        name=child_data["name"],
        role=UserRole.CHILD,
        pin=child_data["pin"],
        parent_id=current_user["id"],
        avatar=child_data.get("avatar", "hero1"),
        allowance_goal=child_data.get("allowance_goal", 50.0)
    )
    
    # Convert to dict and serialize datetime
    doc = child_user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    return {"success": True, "child": child_user}

@api_router.put("/users/avatar")
async def update_avatar(request: dict, current_user: dict = Depends(get_current_user)):
    avatar = request.get("avatar")
    if not avatar:
        raise HTTPException(status_code=400, detail="Avatar is required")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"avatar": avatar}}
    )
    return {"success": True}

@api_router.get("/children/{child_id}/financial")
async def get_child_financial_data(child_id: str, current_user: dict = Depends(get_current_user)):
    # Verify access - parents can access their children's data, children can access their own
    child = await db.users.find_one({"id": child_id}, {"_id": 0})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    if current_user["role"] == "parent":
        if child.get("parent_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user["role"] == "child":
        if current_user["id"] != child_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get savings goals
    savings_goals = await db.savings_goals.find({"child_id": child_id}, {"_id": 0}).to_list(3)
    
    # Get recent transactions
    transactions = await db.transactions.find({"child_id": child_id}, {"_id": 0}).sort("created_at", -1).to_list(10)
    
    # Calculate XP progress to next level
    current_xp = child.get("xp", 0)
    current_level = child.get("level", 1)
    xp_for_next_level = current_level * 100
    xp_progress = current_xp % 100
    
    return {
        "balance": child.get("earned", 0.0),
        "total_allowance": child.get("total_allowance", 0.0),
        "allowance_goal": child.get("allowance_goal", 50.0),
        "xp": current_xp,
        "level": current_level,
        "xp_progress": xp_progress,
        "xp_for_next_level": xp_for_next_level,
        "avatar": child.get("avatar", "hero1"),
        "savings_goals": savings_goals,
        "recent_transactions": transactions
    }

# Task routes
@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can create tasks")
    
    task_obj = Task(**task_data.model_dump())
    doc = task_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc['completed_at']:
        doc['completed_at'] = doc['completed_at'].isoformat()
    if doc['approved_at']:
        doc['approved_at'] = doc['approved_at'].isoformat()
    
    await db.tasks.insert_one(doc)
    return task_obj

@api_router.get("/tasks")
async def get_tasks(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "child":
        # Children see only their tasks
        tasks = await db.tasks.find({"child_id": current_user["id"]}, {"_id": 0}).to_list(100)
    else:
        # Parents see all tasks for their children
        children = await db.users.find({"parent_id": current_user["id"]}, {"_id": 0}).to_list(100)
        child_ids = [child["id"] for child in children]
        tasks = await db.tasks.find({"child_id": {"$in": child_ids}}, {"_id": 0}).to_list(100)
    
    return tasks

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, task_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can update tasks")
    
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Verify parent owns this child
    child = await db.users.find_one({"id": task["child_id"]}, {"_id": 0})
    if not child or child.get("parent_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update fields
    update_fields = {}
    if "title" in task_data:
        update_fields["title"] = task_data["title"]
    if "description" in task_data:
        update_fields["description"] = task_data["description"]
    if "value" in task_data:
        update_fields["value"] = float(task_data["value"])
    if "xp" in task_data:
        update_fields["xp"] = int(task_data["xp"])
    if "frequency" in task_data:
        update_fields["frequency"] = task_data["frequency"]
    if "photo_required" in task_data:
        update_fields["photo_required"] = task_data["photo_required"]
    if "approval_required" in task_data:
        update_fields["approval_required"] = task_data["approval_required"]
    
    if update_fields:
        await db.tasks.update_one({"id": task_id}, {"$set": update_fields})
    
    return {"success": True, "message": "Tarefa atualizada com sucesso"}

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can delete tasks")
    
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Verify parent owns this child
    child = await db.users.find_one({"id": task["child_id"]}, {"_id": 0})
    if not child or child.get("parent_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.tasks.delete_one({"id": task_id})
    
    return {"success": True, "message": "Tarefa deletada com sucesso"}


@api_router.post("/tasks/{task_id}/complete")
async def complete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if current_user["role"] == "child" and task["child_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update task status to AWAITING_VALIDATION (do NOT credit R$/XP yet)
    update_data = {
        "status": TaskStatus.AWAITING_VALIDATION.value,
        "completed_at": datetime.now(timezone.utc).isoformat()
    }
    
    # If no approval required, auto-approve and add XP/money immediately
    if not task["approval_required"]:
        update_data["status"] = TaskStatus.APPROVED.value
        update_data["approved_at"] = datetime.now(timezone.utc).isoformat()
        
        # Update child's XP, earned amount, and total allowance
        await db.users.update_one(
            {"id": task["child_id"]},
            {
                "$inc": {
                    "xp": task["xp"],
                    "earned": task["value"],
                    "total_allowance": task["value"]
                }
            }
        )
        
        # Check for level up
        child = await db.users.find_one({"id": task["child_id"]}, {"_id": 0})
        new_xp = child["xp"] + task["xp"]
        new_level = (new_xp // 100) + 1  # Level up every 100 XP
        if new_level > child["level"]:
            await db.users.update_one(
                {"id": task["child_id"]},
                {"$set": {"level": new_level}}
            )
        
        # Create transaction record
        transaction = Transaction(
            child_id=task["child_id"],
            task_id=task_id,
            amount=task["value"],
            type="task_completion",
            description=f"Completed: {task['title']}"
        )
        trans_doc = transaction.model_dump()
        trans_doc['created_at'] = trans_doc['created_at'].isoformat()
        await db.transactions.insert_one(trans_doc)
    
    await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    
    # Create mock notification for parents (if approval required)
    if task["approval_required"]:
        child = await db.users.find_one({"id": task["child_id"]}, {"_id": 0})
        notification_message = f"🎯 {child['name']} concluiu a tarefa '{task['title']}' e aguarda sua aprovação!"
        # Store notification in database (mock)
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "parent_id": child.get("parent_id"),
            "child_id": task["child_id"],
            "task_id": task_id,
            "message": notification_message,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"success": True, "status": update_data["status"]}

@api_router.post("/tasks/{task_id}/approve")
async def approve_task(task_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can approve tasks")
    
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Task must be awaiting validation
    if task["status"] != TaskStatus.AWAITING_VALIDATION.value:
        raise HTTPException(status_code=400, detail="Task is not awaiting validation")
    
    # Verify parent owns this child
    child = await db.users.find_one({"id": task["child_id"]}, {"_id": 0})
    if not child or child.get("parent_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Approve task
    await db.tasks.update_one(
        {"id": task_id},
        {"$set": {
            "status": TaskStatus.APPROVED.value,
            "approved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # NOW credit R$, XP, and total allowance
    await db.users.update_one(
        {"id": task["child_id"]},
        {"$inc": {"xp": task["xp"], "earned": task["value"], "total_allowance": task["value"]}}
    )
    
    # Check for level up
    child = await db.users.find_one({"id": task["child_id"]}, {"_id": 0})
    new_xp = child["xp"] + task["xp"]
    new_level = (new_xp // 100) + 1
    if new_level > child["level"]:
        await db.users.update_one(
            {"id": task["child_id"]},
            {"$set": {"level": new_level}}
        )
    
    # Create transaction
    transaction = Transaction(
        child_id=task["child_id"],
        task_id=task_id,
        amount=task["value"],
        type="task_completion",
        description=f"Approved: {task['title']}"
    )
    trans_doc = transaction.model_dump()
    trans_doc['created_at'] = trans_doc['created_at'].isoformat()
    await db.transactions.insert_one(trans_doc)
    
    # Mark notification as read
    await db.notifications.update_many(
        {"task_id": task_id, "parent_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    
    return {"success": True, "message": "Tarefa aprovada e creditada com sucesso!"}

@api_router.post("/tasks/{task_id}/reject")
async def reject_task(task_id: str, reason: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can reject tasks")
    
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Task must be awaiting validation
    if task["status"] != TaskStatus.AWAITING_VALIDATION.value:
        raise HTTPException(status_code=400, detail="Task is not awaiting validation")
    
    # Verify parent owns this child
    child = await db.users.find_one({"id": task["child_id"]}, {"_id": 0})
    if not child or child.get("parent_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Reject task (set back to pending)
    await db.tasks.update_one(
        {"id": task_id},
        {"$set": {
            "status": TaskStatus.PENDING.value,
            "completed_at": None,
            "rejection_reason": reason.get("reason", "Não aprovado pelos pais")
        }}
    )
    
    # Mark notification as read
    await db.notifications.update_many(
        {"task_id": task_id, "parent_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    
    return {"success": True, "message": "Tarefa rejeitada. Status voltou para pendente."}
    transaction = Transaction(
        child_id=task["child_id"],
        task_id=task_id,
        amount=task["value"],
        type="task_completion",
        description=f"Approved: {task['title']}"
    )
    trans_doc = transaction.model_dump()
    trans_doc['created_at'] = trans_doc['created_at'].isoformat()
    await db.transactions.insert_one(trans_doc)
    
    return {"success": True}

@api_router.post("/tasks/{task_id}/upload")
async def upload_task_photo(task_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if current_user["role"] == "child" and task["child_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Save file
    file_extension = file.filename.split('.')[-1]
    filename = f"{task_id}_{uuid.uuid4().hex}.{file_extension}"
    file_path = uploads_dir / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update task with photo URL
    photo_url = f"/uploads/{filename}"
    await db.tasks.update_one(
        {"id": task_id},
        {"$set": {"photo_url": photo_url}}
    )
    
    return {"photo_url": photo_url}

# Savings goals
@api_router.post("/savings-goals", response_model=SavingsGoal)
async def create_savings_goal(goal_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can create savings goals")
    
    # Check if child already has 3 goals
    child_id = goal_data.get("child_id")
    if not child_id:
        raise HTTPException(status_code=400, detail="child_id is required")
    
    existing_goals = await db.savings_goals.find({"child_id": child_id}, {"_id": 0}).to_list(100)
    if len(existing_goals) >= 3:
        raise HTTPException(status_code=400, detail="Each child can have a maximum of 3 savings goals")
    
    goal_obj = SavingsGoal(**goal_data)
    doc = goal_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.savings_goals.insert_one(doc)
    return goal_obj

@api_router.get("/savings-goals/{child_id}")
async def get_savings_goals(child_id: str, current_user: dict = Depends(get_current_user)):
    # Verify access
    if current_user["role"] == "child" and current_user["id"] != child_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    goals = await db.savings_goals.find({"child_id": child_id}, {"_id": 0}).to_list(100)
    return goals

@api_router.put("/savings-goals/{goal_id}")
async def update_savings_goal(goal_id: str, goal_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can update savings goals")
    
    goal = await db.savings_goals.find_one({"id": goal_id}, {"_id": 0})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Update goal
    update_fields = {}
    if "name" in goal_data:
        update_fields["name"] = goal_data["name"]
    if "target" in goal_data:
        update_fields["target"] = goal_data["target"]
    
    if update_fields:
        await db.savings_goals.update_one({"id": goal_id}, {"$set": update_fields})
    
    return {"success": True}

@api_router.delete("/savings-goals/{goal_id}")
async def delete_savings_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can delete savings goals")
    
    goal = await db.savings_goals.find_one({"id": goal_id}, {"_id": 0})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    await db.savings_goals.delete_one({"id": goal_id})
    
    return {"success": True}

@api_router.post("/savings-goals/{goal_id}/deposit")
async def deposit_to_goal(goal_id: str, amount: float, current_user: dict = Depends(get_current_user)):
    goal = await db.savings_goals.find_one({"id": goal_id}, {"_id": 0})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Verify user has enough money
    if current_user["role"] == "child":
        if current_user["earned"] < amount:
            raise HTTPException(status_code=400, detail="Insufficient funds")
        
        # Update user balance and goal progress
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$inc": {"earned": -amount}}
        )
        
        await db.savings_goals.update_one(
            {"id": goal_id},
            {"$inc": {"progress": amount}}
        )
        
        # Create transaction
        transaction = Transaction(
            child_id=current_user["id"],
            amount=-amount,
            type="savings_deposit",
            description=f"Deposit to {goal['name']}"
        )
        trans_doc = transaction.model_dump()
        trans_doc['created_at'] = trans_doc['created_at'].isoformat()
        await db.transactions.insert_one(trans_doc)
    
    return {"success": True}

# Transactions and reports
@api_router.get("/transactions/{child_id}")
async def get_transactions(child_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "child" and current_user["id"] != child_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    transactions = await db.transactions.find({"child_id": child_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return transactions

@api_router.post("/allowance/pay")
async def pay_allowance(request: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can pay allowance")
    
    child_id = request.get("child_id")
    if not child_id:
        raise HTTPException(status_code=400, detail="Child ID is required")
    
    child = await db.users.find_one({"id": child_id}, {"_id": 0})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Reset earned amount
    paid_amount = child["earned"]
    await db.users.update_one(
        {"id": child_id},
        {"$set": {"earned": 0.0}}
    )
    
    # Create payment transaction
    transaction = Transaction(
        child_id=child_id,
        amount=-paid_amount,
        type="allowance_payment",
        description=f"Allowance payment: R${paid_amount:.2f}"
    )
    trans_doc = transaction.model_dump()
    trans_doc['created_at'] = trans_doc['created_at'].isoformat()
    await db.transactions.insert_one(trans_doc)
    
    return {"success": True, "amount_paid": paid_amount}

# Notifications endpoints
@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can view notifications")
    
    notifications = await db.notifications.find(
        {"parent_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return notifications

@api_router.post("/notifications/mark-read")
async def mark_notifications_read(notification_ids: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can mark notifications")
    
    ids = notification_ids.get("ids", [])
    if ids:
        await db.notifications.update_many(
            {"id": {"$in": ids}, "parent_id": current_user["id"]},
            {"$set": {"read": True}}
        )
    
    return {"success": True}

# XP Store endpoints
@api_router.get("/store/items")
async def get_store_items(current_user: dict = Depends(get_current_user)):
    """Get all items available in the XP store"""
    items = await db.xp_store_items.find({}, {"_id": 0}).to_list(100)
    return items

@api_router.post("/store/purchase")
async def purchase_item(purchase_data: dict, current_user: dict = Depends(get_current_user)):
    """Purchase an item from the store using XP"""
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Only children can purchase items")
    
    item_id = purchase_data.get("item_id")
    if not item_id:
        raise HTTPException(status_code=400, detail="item_id is required")
    
    # Get item details
    item = await db.xp_store_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if already owned
    if item_id in current_user.get("inventory", []):
        raise HTTPException(status_code=400, detail="You already own this item")
    
    # Check if user has enough XP
    if current_user["xp"] < item["xp_cost"]:
        raise HTTPException(status_code=400, detail=f"Insufficient XP. Need {item['xp_cost']} XP, have {current_user['xp']} XP")
    
    # Deduct XP and add item to inventory
    new_xp = current_user["xp"] - item["xp_cost"]
    await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$set": {"xp": new_xp},
            "$push": {"inventory": item_id}
        }
    )
    
    return {
        "success": True,
        "message": f"Parabéns! Você adquiriu {item['item_name']}!",
        "new_xp": new_xp,
        "item": item
    }

@api_router.get("/store/inventory")
async def get_inventory(current_user: dict = Depends(get_current_user)):
    """Get user's inventory"""
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Only children have inventory")
    
    inventory_ids = current_user.get("inventory", [])
    if not inventory_ids:
        return []
    
    # Get full item details for inventory
    items = await db.xp_store_items.find({"id": {"$in": inventory_ids}}, {"_id": 0}).to_list(100)
    return items

@api_router.post("/store/equip")
async def equip_item(equip_data: dict, current_user: dict = Depends(get_current_user)):
    """Equip an avatar or accessory"""
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Only children can equip items")
    
    item_id = equip_data.get("item_id")
    if not item_id:
        raise HTTPException(status_code=400, detail="item_id is required")
    
    # Check if item is in inventory
    if item_id not in current_user.get("inventory", []):
        raise HTTPException(status_code=400, detail="Item not in inventory")
    
    # Get item details
    item = await db.xp_store_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Equip based on type
    if item["item_type"] == "avatar":
        # Equip avatar
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"current_avatar": item_id, "avatar": item["asset_url"]}}
        )
        return {"success": True, "message": f"Avatar {item['item_name']} equipado!"}
    else:
        # Equip accessory (add to current_accessories if not already there)
        current_accessories = current_user.get("current_accessories", [])
        if item_id not in current_accessories:
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$push": {"current_accessories": item_id}}
            )
            return {"success": True, "message": f"Acessório {item['item_name']} equipado!"}
        else:
            raise HTTPException(status_code=400, detail="Accessory already equipped")

@api_router.post("/store/unequip")
async def unequip_item(unequip_data: dict, current_user: dict = Depends(get_current_user)):
    """Unequip an accessory"""
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Only children can unequip items")
    
    item_id = unequip_data.get("item_id")
    if not item_id:
        raise HTTPException(status_code=400, detail="item_id is required")
    
    # Remove from current_accessories
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$pull": {"current_accessories": item_id}}
    )
    
    return {"success": True, "message": "Acessório removido!"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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