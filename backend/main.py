import os
import json
import math
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from model import PriorityClassifier

# Initialize FastAPI web application
app = FastAPI(
    title="SFCollab Task Priority Classifier API",
    description="FastAPI service classifying task priority (High, Medium, Low) using TF-IDF + Logistic Regression trained on realistic tasks.",
    version="2.0.0"
)

# Enable CORS (Cross-Origin Resource Sharing) middleware to allow browser requests from deployed frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate priority classifier model instance
classifier = PriorityClassifier()

# Storage paths for data persistence
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
FEEDBACK_FILE = os.path.join(BACKEND_DIR, "feedback.json")
USERS_DB_FILE = os.path.join(BACKEND_DIR, "users_db.json")
FIX_KB_FILE = os.path.join(BACKEND_DIR, "fix_knowledge_base.json")
TASKS_DB_FILE = os.path.join(BACKEND_DIR, "tasks_db.json")

def load_feedback():
    """Utility to load stored feedback entries from disk."""
    if os.path.exists(FEEDBACK_FILE):
        try:
            with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_feedback(data):
    """Utility to save updated user feedback entries to disk."""
    try:
        with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving feedback: {e}")

def load_users_db():
    """Load user productivity profiles from users_db.json."""
    if os.path.exists(USERS_DB_FILE):
        try:
            with open(USERS_DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def load_fix_knowledge_base():
    """Load AI fix patterns from fix_knowledge_base.json (persistent memory)."""
    if os.path.exists(FIX_KB_FILE):
        try:
            with open(FIX_KB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def load_tasks_db():
    """Load assigned tasks from tasks_db.json."""
    if os.path.exists(TASKS_DB_FILE):
        try:
            with open(TASKS_DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_tasks_db(data):
    """Save assigned tasks to tasks_db.json."""
    try:
        with open(TASKS_DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving tasks: {e}")

# Day name to weekday number mapping
DAY_MAP = {"Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6}

# Pydantic Schemas for Strict Request/Response Validation
class ClassifyRequest(BaseModel):
    """Input payload for classification request."""
    title: str = Field(..., description="The title of the task (Required)")
    description: Optional[str] = Field(default="", description="The optional detailed task description")

    @field_validator('title')
    def check_title_not_empty(cls, v):
        """
        Pydantic Field Validator:
        Strictly rejects requests where the task title is missing, null, or empty whitespace.
        Returns HTTP 400 Bad Request error if validation fails.
        """
        if not v or not v.strip():
            raise ValueError("Task title is required and cannot be empty.")
        if len(v.strip()) < 3:
            raise ValueError("Task title must be at least 3 characters long.")
        return v.strip()

class ClassifyResponse(BaseModel):
    """Structured response payload returned by /api/classify-priority."""
    priority: str
    reason: str
    confidence: float
    confidence_percentage: float
    probabilities: dict
    model_type: str

class FeedbackRequest(BaseModel):
    """Input payload for user feedback submission (Stretch Goal)."""
    task_title: str
    predicted_priority: str
    user_feedback: str  # "thumbs_up" or "thumbs_down"
    correct_priority: Optional[str] = None

class CompletionPredictionRequest(BaseModel):
    """Input payload for smart completion time prediction."""
    user_id: str = Field(..., description="ID of the assigned user from users database")
    title: str = Field(..., description="Task title for priority classification")
    description: Optional[str] = Field(default="", description="Task description for classification context")
    planned_start_date: str = Field(..., description="ISO format planned start date (e.g., 2026-08-01T09:00:00)")

class AIInsightRequest(BaseModel):
    """Input payload for AI fix insight generation from knowledge base."""
    title: str = Field(..., description="Task title to match against fix knowledge base")
    description: Optional[str] = Field(default="", description="Task description for deeper keyword matching")
    priority: Optional[str] = Field(default=None, description="Pre-classified priority label (optional)")

class TaskCreateRequest(BaseModel):
    """Input payload to save a task."""
    title: str = Field(..., description="Task title")
    description: Optional[str] = Field(default="", description="Task description")
    priority: str = Field(..., description="Classified priority")
    user_id: str = Field(..., description="User ID to assign to")
    planned_start_date: str = Field(..., description="Planned start date ISO string")
    predicted_completion: str = Field(..., description="Predicted completion date ISO string")
    hours_required: float = Field(..., description="Efficiency-adjusted hours required")

# API Route Handlers

@app.get("/")
def read_root():
    """Root landing endpoint providing API overview links."""
    return {
        "message": "Welcome to SFCollab Task Priority Classifier API",
        "health": "/api/health",
        "docs": "/docs",
        "classify_endpoint": "/api/classify-priority",
        "users_endpoint": "/api/users",
        "predict_completion": "/api/predict-completion",
        "ai_insights": "/api/ai-insights"
    }

@app.get("/api/health")
def health_check():
    """Healthcheck endpoint confirming backend server status and loaded artifacts."""
    return {
        "status": "healthy",
        "model_loaded": classifier.pipeline is not None,
        "eval_loaded": classifier.eval_data is not None
    }

@app.post("/api/classify-priority", response_model=ClassifyResponse)
def classify_task_priority(payload: ClassifyRequest):
    """
    POST /api/classify-priority:
    Accepts task title and description, runs TF-IDF + Logistic Regression classification model,
    and returns predicted priority, confidence score, and 1-line reason explanation.
    """
    try:
        result = classifier.classify(title=payload.title, description=payload.description or "")
        return result
    except ValueError as ve:
        # Returns HTTP 400 Bad Request on invalid empty input
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        # Returns HTTP 500 Internal Server Error on unexpected failures
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Classification error: {str(e)}")

@app.get("/api/evaluation")
def get_evaluation_metrics():
    """Returns 45/15 train-test split evaluation metrics, confusion matrix, and error analysis."""
    if classifier.eval_data is None:
        classifier.load_eval_data()
    if classifier.eval_data is None:
        raise HTTPException(status_code=404, detail="Evaluation results not found. Run train.py first.")
    return classifier.eval_data

@app.get("/api/dataset")
def get_dataset():
    """Returns the complete 60 labelled task dataset for UI dataset browser."""
    dataset_path = os.path.join(BACKEND_DIR, "dataset.json")
    if not os.path.exists(dataset_path):
        raise HTTPException(status_code=404, detail="Dataset file not found.")
    with open(dataset_path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/api/feedback")
def submit_feedback(payload: FeedbackRequest):
    """Stretch Goal: Stores user thumbs-up/down feedback for future retraining."""
    feedbacks = load_feedback()
    entry = {
        "task_title": payload.task_title,
        "predicted_priority": payload.predicted_priority,
        "user_feedback": payload.user_feedback,
        "correct_priority": payload.correct_priority
    }
    feedbacks.append(entry)
    save_feedback(feedbacks)
    return {"status": "success", "message": "Feedback stored successfully", "total_feedback_count": len(feedbacks)}

@app.get("/api/feedback")
def get_all_feedback():
    """Returns stored feedback entries."""
    return load_feedback()

# ─── NEW: User Productivity Database Endpoints ──────────────────────────────

@app.get("/api/users")
def get_all_users():
    """Returns all user profiles from the productivity database."""
    users = load_users_db()
    if not users:
        raise HTTPException(status_code=404, detail="Users database not found or empty.")
    return users

@app.get("/api/users/{user_id}")
def get_user_by_id(user_id: str):
    """Returns a single user profile by user_id."""
    users = load_users_db()
    for user in users:
        if user["user_id"] == user_id:
            return user
    raise HTTPException(status_code=404, detail=f"User '{user_id}' not found in database.")

# ─── NEW: Smart Completion Prediction Endpoint ──────────────────────────────

@app.post("/api/predict-completion")
def predict_completion(payload: CompletionPredictionRequest):
    """
    POST /api/predict-completion:
    Accepts user_id, task title/description, and planned start date.
    1. Classifies task priority using the ML model
    2. Looks up user efficiency profile from users_db.json
    3. Calculates adjusted work hours based on efficiency
    4. Projects completion date factoring in work schedule and startup delays
    5. Returns full prediction breakdown with delay warnings
    """
    # Step 1: Find the user
    users = load_users_db()
    user = None
    for u in users:
        if u["user_id"] == payload.user_id:
            user = u
            break
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{payload.user_id}' not found.")

    # Step 2: Classify the task priority
    try:
        classification = classifier.classify(
            title=payload.title,
            description=payload.description or ""
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")

    priority = classification["priority"]
    confidence = classification["confidence"]

    # Step 3: Calculate base hours from user's historical data
    priority_key = f"{priority.lower()}_avg_hours"
    base_hours = user["historical_tasks"].get(priority_key, 10)

    # Step 4: Adjust hours based on user efficiency
    efficiency = user["efficiency_score"]
    adjusted_hours = round(base_hours / efficiency, 1)

    # Step 5: Parse planned start date
    try:
        planned_start = datetime.fromisoformat(payload.planned_start_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format: YYYY-MM-DDTHH:MM:SS")

    # Step 6: Factor in user's average startup delay
    avg_delay = user["avg_delay_days"]
    actual_start = planned_start + timedelta(days=avg_delay)

    # Step 7: Calculate completion date based on work schedule
    work_days_list = [DAY_MAP[d] for d in user["work_schedule"]["work_days"]]
    hours_per_day = user["avg_hours_per_day"]
    remaining_hours = adjusted_hours
    work_days_needed = 0
    current_date = actual_start

    while remaining_hours > 0:
        if current_date.weekday() in work_days_list:
            hours_today = min(remaining_hours, hours_per_day)
            remaining_hours -= hours_today
            work_days_needed += 1
        current_date += timedelta(days=1)

    # Completion date is the last work day
    completion_date = current_date - timedelta(days=1)
    # Set completion time to end of work hours
    completion_date = completion_date.replace(
        hour=user["work_schedule"]["end_hour"],
        minute=0, second=0
    )

    # Step 8: Calculate calendar days span
    calendar_days = (completion_date - planned_start).days

    # Step 9: Generate startup delay insight
    delay_warning = None
    delay_risk_level = "low"
    if avg_delay >= 3.0:
        delay_risk_level = "critical"
        delay_warning = f"⚠ Critical delay risk: {user['name']} historically starts {avg_delay} days late. Projects often miss initial deadlines significantly."
    elif avg_delay >= 1.5:
        delay_risk_level = "high"
        delay_warning = f"⚠ High delay risk: {user['name']} typically starts {avg_delay} days behind schedule. Factor this into planning."
    elif avg_delay >= 0.8:
        delay_risk_level = "moderate"
        delay_warning = f"Moderate delay risk: {user['name']} averages {avg_delay} days late to start. Minor buffer recommended."

    # Step 10: Build timeline phases
    timeline_phases = [
        {
            "phase": "Planned Start",
            "date": planned_start.isoformat(),
            "description": "Originally scheduled start time"
        },
        {
            "phase": "Predicted Actual Start",
            "date": actual_start.isoformat(),
            "description": f"Expected start after {avg_delay} day avg delay",
            "delay_days": avg_delay
        },
        {
            "phase": "Deep Work Phase",
            "date": (actual_start + timedelta(days=max(1, work_days_needed // 2))).isoformat(),
            "description": f"{adjusted_hours} efficiency-adjusted hours of focused work"
        },
        {
            "phase": "Predicted Completion",
            "date": completion_date.isoformat(),
            "description": f"Task expected complete by {completion_date.strftime('%b %d, %Y at %I:%M %p')}"
        }
    ]

    return {
        "prediction": {
            "planned_start": planned_start.isoformat(),
            "predicted_actual_start": actual_start.isoformat(),
            "predicted_completion": completion_date.isoformat(),
            "completion_formatted": completion_date.strftime("%B %d, %Y at %I:%M %p"),
            "calendar_days": calendar_days,
            "work_days_needed": work_days_needed,
            "base_hours": base_hours,
            "efficiency_adjusted_hours": adjusted_hours,
            "efficiency_multiplier": round(1 / efficiency, 2)
        },
        "classification": {
            "priority": priority,
            "confidence": confidence,
            "confidence_percentage": classification["confidence_percentage"],
            "reason": classification["reason"]
        },
        "user_profile": {
            "user_id": user["user_id"],
            "name": user["name"],
            "role": user["role"],
            "efficiency_score": efficiency,
            "avg_hours_per_day": hours_per_day,
            "task_completion_rate": user["task_completion_rate"],
            "total_tasks_completed": user["total_tasks_completed"]
        },
        "delay_analysis": {
            "avg_delay_days": avg_delay,
            "delay_risk_level": delay_risk_level,
            "delay_warning": delay_warning,
            "startup_insight": f"{user['name']}'s projects get started very late — taking an average of {avg_delay} extra days not because the project was sleeping, but due to context switching, priority juggling, and ramp-up time." if avg_delay >= 1.5 else None
        },
        "timeline": timeline_phases
    }

# ─── NEW: AI Fix Insights from Knowledge Base (Persistent Memory) ───────────

@app.post("/api/ai-insights")
def get_ai_insights(payload: AIInsightRequest):
    """
    POST /api/ai-insights:
    Matches task title and description against the fix knowledge base (persistent memory).
    Returns relevant fix patterns, recommendations, files to check, and estimated fix times.
    Acts as an AI-powered suggestion engine backed by curated engineering knowledge.
    """
    knowledge_base = load_fix_knowledge_base()
    if not knowledge_base:
        raise HTTPException(status_code=404, detail="Fix knowledge base not found.")

    text_lower = f"{payload.title} {payload.description or ''}".lower()

    # Score each pattern by keyword match count
    matched_patterns = []
    for pattern in knowledge_base:
        match_count = sum(1 for kw in pattern["trigger_keywords"] if kw in text_lower)
        if match_count > 0:
            matched_patterns.append({
                **pattern,
                "match_score": match_count,
                "match_relevance": round(match_count / len(pattern["trigger_keywords"]), 2)
            })

    # Sort by match score (most relevant first)
    matched_patterns.sort(key=lambda p: p["match_score"], reverse=True)

    # Take top 5 matches
    top_matches = matched_patterns[:5]

    # Generate summary insights
    total_fix_hours = sum(p["estimated_fix_hours"] for p in top_matches)
    all_files = []
    all_mistakes = []
    categories = set()

    for p in top_matches:
        all_files.extend(p["files_to_check"])
        all_mistakes.extend(p["common_mistakes"])
        categories.add(p["category"])

    # Deduplicate
    unique_files = list(dict.fromkeys(all_files))[:10]
    unique_mistakes = list(dict.fromkeys(all_mistakes))[:8]

    # Generate AI recommendation summary
    if len(top_matches) == 0:
        recommendation = "No matching fix patterns found in the knowledge base. This may be a novel task type. Consider documenting the fix approach for future reference."
    elif top_matches[0]["match_score"] >= 3:
        recommendation = f"Strong match found: '{top_matches[0]['fix_title']}'. This task closely matches a known pattern. Follow the resolution steps for fastest resolution."
    elif len(top_matches) >= 2:
        recommendation = f"Multiple partial matches found across {', '.join(categories)}. Review the top matches and combine relevant resolution steps."
    else:
        recommendation = f"Weak match found: '{top_matches[0]['fix_title']}'. Some keywords overlap but this may need custom investigation beyond the knowledge base."

    return {
        "matched_patterns": [
            {
                "pattern_id": p["pattern_id"],
                "fix_title": p["fix_title"],
                "fix_description": p["fix_description"],
                "category": p["category"],
                "severity": p["severity"],
                "estimated_fix_hours": p["estimated_fix_hours"],
                "files_to_check": p["files_to_check"],
                "common_mistakes": p["common_mistakes"],
                "resolution_steps": p["resolution_steps"],
                "match_score": p["match_score"],
                "match_relevance": p["match_relevance"]
            }
            for p in top_matches
        ],
        "summary": {
            "total_matches": len(matched_patterns),
            "top_matches_shown": len(top_matches),
            "total_estimated_hours": round(total_fix_hours, 1),
            "affected_categories": list(categories),
            "files_to_check": unique_files,
            "common_mistakes_to_avoid": unique_mistakes,
            "ai_recommendation": recommendation
        },
        "knowledge_base_stats": {
            "total_patterns": len(knowledge_base),
            "last_updated": "2026-07-29"
        }
    }

# ─── NEW: Task Assignment and Workload Endpoints ────────────────────────────

@app.get("/api/tasks")
def get_all_tasks():
    """Returns all assigned tasks."""
    return load_tasks_db()

@app.post("/api/tasks")
def create_task(payload: TaskCreateRequest):
    """Saves a new assigned task."""
    tasks = load_tasks_db()
    users = load_users_db()
    
    # Verify user exists
    user = next((u for u in users if u["user_id"] == payload.user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{payload.user_id}' not found.")
        
    task_id = f"task_{int(datetime.utcnow().timestamp() * 1000)}"
    new_task = {
        "id": task_id,
        "title": payload.title,
        "description": payload.description,
        "priority": payload.priority,
        "user_id": payload.user_id,
        "user_name": user["name"],
        "user_role": user["role"],
        "planned_start_date": payload.planned_start_date,
        "predicted_completion": payload.predicted_completion,
        "hours_required": payload.hours_required,
        "status": "assigned",  # assigned, in_progress, completed
        "created_at": datetime.utcnow().isoformat()
    }
    tasks.append(new_task)
    save_tasks_db(tasks)
    return new_task

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str):
    """Deletes an assigned task."""
    tasks = load_tasks_db()
    filtered_tasks = [t for t in tasks if t["id"] != task_id]
    if len(filtered_tasks) == len(tasks):
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found.")
    save_tasks_db(filtered_tasks)
    return {"status": "success", "message": f"Task '{task_id}' deleted successfully."}

