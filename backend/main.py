import os
import json
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from model import PriorityClassifier

# Initialize FastAPI web application
app = FastAPI(
    title="SFCollab Task Priority Classifier API",
    description="FastAPI service classifying task priority (High, Medium, Low) using TF-IDF + Logistic Regression trained on realistic tasks.",
    version="1.0.0"
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

# Storage path for stretch goal user feedback persistence
FEEDBACK_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "feedback.json")

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

# API Route Handlers

@app.get("/")
def read_root():
    """Root landing endpoint providing API overview links."""
    return {
        "message": "Welcome to SFCollab Task Priority Classifier API",
        "health": "/api/health",
        "docs": "/docs",
        "classify_endpoint": "/api/classify-priority"
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
    dataset_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dataset.json")
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

