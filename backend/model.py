import os
import json
import joblib
import numpy as np

class PriorityClassifier:
    """
    Inference class wrapper for loading the trained TF-IDF + Logistic Regression model
    and generating priority classifications with 1-line explanations.
    """
    def __init__(self):
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(backend_dir, "model.joblib")
        self.eval_path = os.path.join(backend_dir, "eval_results.json")
        self.pipeline = None
        self.eval_data = None
        
        # Load artifacts upon initialization
        self.load_model()
        self.load_eval_data()

    def load_model(self):
        """Loads serialized scikit-learn pipeline (model.joblib)."""
        if os.path.exists(self.model_path):
            try:
                self.pipeline = joblib.load(self.model_path)
            except Exception as e:
                print(f"Error loading model pipeline: {e}")
                self.pipeline = None
        else:
            print(f"Model file not found at {self.model_path}. Train model first.")

    def load_eval_data(self):
        """Loads precomputed train-test evaluation metrics (eval_results.json)."""
        if not os.path.exists(self.eval_path):
            try:
                from train import train_and_evaluate
                print("eval_results.json missing, auto-running train_and_evaluate()...")
                train_and_evaluate()
            except Exception as e:
                print(f"Error auto-generating evaluation data: {e}")

        if os.path.exists(self.eval_path):
            try:
                with open(self.eval_path, "r", encoding="utf-8") as f:
                    self.eval_data = json.load(f)
            except Exception as e:
                print(f"Error loading eval data: {e}")

    def generate_reason(self, title: str, description: str, priority: str, confidence: float, top_features: list) -> str:
        """
        Generates a concise, human-readable 1-line explanation for why a task was assigned its priority label.
        Uses key domain trigger words detected in the input title and description.
        """
        text_lower = f"{title} {description}".lower()
        
        # Domain trigger keywords representing system severity levels
        high_triggers = ["outage", "crash", "vulnerability", "security", "fail", "broken", "fatal", "drop", "stalled", "expired", "leak", "cors", "database", "injection", "down", "prod", "production", "block"]
        medium_triggers = ["implement", "add", "optimize", "refactor", "build", "upgrade", "integrate", "export", "filter", "batch", "date", "calendar", "component", "state"]
        low_triggers = ["typo", "readme", "comment", "docs", "documentation", "footer", "color", "favicon", "license", "prettier", "avatar", "tooltip", "css", "asset", "padding", "spellcheck"]

        found_high = [w for w in high_triggers if w in text_lower]
        found_medium = [w for w in medium_triggers if w in text_lower]
        found_low = [w for w in low_triggers if w in text_lower]

        if priority == "High":
            if found_high:
                return f"High priority — task mentions critical system indicators: {', '.join(found_high[:2])}."
            return "High priority — task indicates severe technical impact, system outage, or security vulnerability."
        elif priority == "Medium":
            if found_medium:
                return f"Medium priority — task involves feature enhancement or system optimization ({', '.join(found_medium[:2])})."
            return "Medium priority — standard feature request or architectural improvement without critical downtime risk."
        else: # Low
            if found_low:
                return f"Low priority — task focuses on minor maintenance or UI tweak ({', '.join(found_low[:2])})."
            return "Low priority — cosmetic, documentation, or minor code formatting task with low operational impact."

    def classify(self, title: str, description: str = "") -> dict:
        """
        Classifies input task title and description into High, Medium, or Low priority.
        Returns priority label, confidence score, 1-line reason, and probability distribution.
        """
        if not title or not title.strip():
            raise ValueError("Task title is required and cannot be empty.")

        text = f"{title}. {description}".strip()

        if self.pipeline is None:
            self.load_model()
            if self.pipeline is None:
                raise RuntimeError("ML Model pipeline is not loaded. Please run train.py first.")

        # Compute probability array for each class: [P(High), P(Medium), P(Low)]
        proba = self.pipeline.predict_proba([text])[0]
        classes = list(self.pipeline.classes_)
        
        pred_idx = np.argmax(proba) # Index of class with highest probability score
        priority = str(classes[pred_idx])
        confidence = float(proba[pred_idx])

        # Extract top feature words contributing to the prediction
        top_features = []
        try:
            tfidf = self.pipeline.named_steps['tfidf']
            vectorized = tfidf.transform([text])
            feature_names = np.array(tfidf.get_feature_names_out())
            nonzero_indices = vectorized.nonzero()[1]
            if len(nonzero_indices) > 0:
                top_features = [feature_names[i] for i in nonzero_indices[:4]]
        except Exception:
            pass

        # Generate 1-line explanation string
        explanation = self.generate_reason(title, description, priority, confidence, top_features)

        # Dictionary of class probabilities
        prob_dict = {classes[i]: round(float(proba[i]), 4) for i in range(len(classes))}

        return {
            "priority": priority,
            "confidence": round(confidence, 4),
            "confidence_percentage": round(confidence * 100, 1),
            "reason": explanation,
            "probabilities": prob_dict,
            "model_type": "TF-IDF + Logistic Regression (scikit-learn)"
        }

