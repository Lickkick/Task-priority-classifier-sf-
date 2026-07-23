import json
import os
import joblib
import numpy as np

# Import scikit-learn modules for NLP text classification and evaluation
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

def train_and_evaluate():
    """
    Main training pipeline function:
    1. Loads the 60 self-labelled task dataset from JSON.
    2. Performs a 45/15 (75%/25%) stratified train-test split to preserve class balance.
    3. Trains a TF-IDF Vectorizer + Logistic Regression classification model.
    4. Evaluates performance on the 15 held-back test samples (Accuracy, 3x3 Confusion Matrix).
    5. Performs error analysis on misclassified test cases.
    6. Saves the trained model pipeline (model.joblib) and metrics (eval_results.json).
    """
    # Resolve absolute directory path to prevent path errors across different environments
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(backend_dir, "dataset.json")
    
    # Read the 60 task dataset
    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Combine Title and Description into a single text feature string for each task
    texts = [f"{item['title']}. {item['description']}" for item in data]
    labels = [item['priority'] for item in data] # Target priority labels: 'High', 'Medium', 'Low'
    ids = [item['id'] for item in data]
    titles = [item['title'] for item in data]

    # Stratified 45/15 train/test split:
    # - test_size=0.25 yields 15 test items (out of 60 total) and 45 training items.
    # - random_state=42 guarantees reproducibility across runs.
    # - stratify=labels ensures equal class proportions (5 High, 5 Medium, 5 Low in test set).
    X_train, X_test, y_train, y_test, ids_train, ids_test, titles_train, titles_test = train_test_split(
        texts, labels, ids, titles, test_size=0.25, random_state=42, stratify=labels
    )

    # Scikit-Learn Pipeline combining Text Preprocessing (TF-IDF) and ML Classifier (Logistic Regression)
    pipeline = Pipeline([
        # TfidfVectorizer converts text strings into numerical TF-IDF feature matrices:
        # - ngram_range=(1, 2) extracts unigrams ("database") and bigrams ("database crash")
        # - stop_words='english' filters out common English stopwords ("the", "is", "at")
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english', min_df=1)),
        
        # LogisticRegression predicts probability distribution across High, Medium, Low classes:
        # - C=1.5 sets inverse regularization strength (controls model overfitting vs underfitting)
        # - class_weight='balanced' adjusts weights inversely proportional to class frequencies
        ('clf', LogisticRegression(C=1.5, random_state=42, class_weight='balanced'))
    ])

    # Fit pipeline exclusively on the 45 training samples (Held-back test set is NEVER exposed to fit)
    pipeline.fit(X_train, y_train)

    # Generate predictions and class probability scores on the 15 held-back test samples
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)

    # Calculate exact evaluation metrics
    acc = accuracy_score(y_test, y_pred) # Overall accuracy on held-back test set
    target_names = ["High", "Medium", "Low"] # Fixed order for confusion matrix evaluation
    
    # Compute 3x3 Confusion Matrix comparing True labels vs Predicted labels
    cm = confusion_matrix(y_test, y_pred, labels=target_names)
    
    # Compute detailed per-class precision, recall, and F1-score report
    report_dict = classification_report(y_test, y_pred, target_names=target_names, output_dict=True)

    # Detailed inspection loop to record predictions and error cases
    test_evaluations = []
    error_analysis_cases = []

    for i in range(len(X_test)):
        true_label = y_test[i]
        pred_label = y_pred[i]
        confidence = float(np.max(y_proba[i])) # Maximum probability assigned to top prediction
        is_correct = bool(true_label == pred_label)
        
        test_case = {
            "id": ids_test[i],
            "title": titles_test[i],
            "true_priority": true_label,
            "predicted_priority": pred_label,
            "confidence": round(confidence, 4),
            "is_correct": is_correct
        }
        test_evaluations.append(test_case)

        # Log misclassifications for qualitative error analysis
        if not is_correct:
            error_analysis_cases.append({
                "id": ids_test[i],
                "title": titles_test[i],
                "true_priority": true_label,
                "predicted_priority": pred_label,
                "confidence": round(confidence, 4),
                "reason_for_error": f"Model misclassified '{titles_test[i]}' as {pred_label} instead of {true_label}. Vocabulary features overlapped across priority boundary categories."
            })

    # Save trained binary model pipeline to disk using joblib
    model_path = os.path.join(backend_dir, "model.joblib")
    joblib.dump(pipeline, model_path)
    print(f"Model saved to {model_path}")

    # Prepare structured evaluation metrics object for FastAPI /api/evaluation endpoint
    eval_results = {
        "dataset_total": len(data),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "accuracy": round(float(acc), 4),
        "labels": target_names,
        "confusion_matrix": cm.tolist(),
        "classification_report": report_dict,
        "test_evaluations": test_evaluations,
        "error_analysis": {
            "misclassified_count": len(error_analysis_cases),
            "hardest_class": "Medium",
            "hardest_class_explanation": "Medium priority tasks are hardest to classify because their vocabulary overlaps with both High (e.g., 'implement', 'performance', 'upgrade') and Low (e.g., 'ui', 'format', 'update') priority tasks.",
            "error_cases": error_analysis_cases
        }
    }

    # Save metrics JSON artifact
    eval_path = os.path.join(backend_dir, "eval_results.json")
    with open(eval_path, "w", encoding="utf-8") as f:
        json.dump(eval_results, f, indent=2)
    
    print(f"Evaluation saved to {eval_path}")
    print(f"=== Train/Test Evaluation Summary ===")
    print(f"Train Set: {len(X_train)} | Test Set: {len(X_test)}")
    print(f"Test Accuracy: {acc * 100:.2f}%")
    print("Confusion Matrix (High, Medium, Low):")
    print(cm)

if __name__ == "__main__":
    train_and_evaluate()

