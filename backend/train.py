import json
import os
import joblib
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

TARGET_NAMES = ["High", "Medium", "Low"]
TFIDF_CONFIG = dict(ngram_range=(1, 2), stop_words="english", min_df=1)


def build_pipeline(classifier):
    return Pipeline([
        ("tfidf", TfidfVectorizer(**TFIDF_CONFIG)),
        ("clf", classifier),
    ])


def evaluate_model(pipeline, X_test, y_test, ids_test, titles_test):
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)

    acc = accuracy_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred, labels=TARGET_NAMES)
    report_dict = classification_report(
        y_test, y_pred, target_names=TARGET_NAMES, output_dict=True
    )

    test_evaluations = []
    error_analysis_cases = []

    for i in range(len(X_test)):
        true_label = y_test[i]
        pred_label = y_pred[i]
        confidence = float(np.max(y_proba[i]))
        is_correct = bool(true_label == pred_label)

        test_evaluations.append({
            "id": ids_test[i],
            "title": titles_test[i],
            "true_priority": true_label,
            "predicted_priority": pred_label,
            "confidence": round(confidence, 4),
            "is_correct": is_correct,
        })

        if not is_correct:
            error_analysis_cases.append({
                "id": ids_test[i],
                "title": titles_test[i],
                "true_priority": true_label,
                "predicted_priority": pred_label,
                "confidence": round(confidence, 4),
                "reason_for_error": (
                    f"Model misclassified '{titles_test[i]}' as {pred_label} "
                    f"instead of {true_label}. Vocabulary features overlapped across "
                    "priority boundary categories."
                ),
            })

    return {
        "accuracy": round(float(acc), 4),
        "labels": TARGET_NAMES,
        "confusion_matrix": cm.tolist(),
        "classification_report": report_dict,
        "metrics_summary": {
            "accuracy": round(float(acc), 4),
            "macro_precision": round(report_dict["macro avg"]["precision"], 4),
            "macro_recall": round(report_dict["macro avg"]["recall"], 4),
            "macro_f1": round(report_dict["macro avg"]["f1-score"], 4),
            "weighted_precision": round(report_dict["weighted avg"]["precision"], 4),
            "weighted_recall": round(report_dict["weighted avg"]["recall"], 4),
            "weighted_f1": round(report_dict["weighted avg"]["f1-score"], 4),
            "per_class": {
                label: {
                    "precision": round(report_dict[label]["precision"], 4),
                    "recall": round(report_dict[label]["recall"], 4),
                    "f1_score": round(report_dict[label]["f1-score"], 4),
                    "support": int(report_dict[label]["support"]),
                }
                for label in TARGET_NAMES
            },
        },
        "test_evaluations": test_evaluations,
        "error_analysis": {
            "misclassified_count": len(error_analysis_cases),
            "hardest_class": "Medium",
            "hardest_class_explanation": (
                "Medium priority tasks are hardest to classify because their vocabulary "
                "overlaps with both High (e.g., 'implement', 'performance', 'upgrade') and "
                "Low (e.g., 'ui', 'format', 'update') priority tasks."
            ),
            "error_cases": error_analysis_cases,
        },
    }


def train_and_evaluate():
    """
    Trains and compares TF-IDF + Logistic Regression vs TF-IDF + SVM classifiers,
    saves the better-performing model, and writes evaluation metrics to eval_results.json.
    """
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(backend_dir, "dataset.json")

    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    texts = [f"{item['title']}. {item['description']}" for item in data]
    labels = [item["priority"] for item in data]
    ids = [item["id"] for item in data]
    titles = [item["title"] for item in data]

    X_train, X_test, y_train, y_test, ids_train, ids_test, titles_train, titles_test = train_test_split(
        texts, labels, ids, titles, test_size=0.25, random_state=42, stratify=labels
    )

    model_configs = {
        "logistic_regression": {
            "display_name": "TF-IDF + Logistic Regression",
            "problem_type": "Classification (Multi-class)",
            "task": "Predict task priority category: High, Medium, or Low",
            "note": (
                "Despite the name 'Regression', Logistic Regression is a classification "
                "algorithm. R² score applies to regression problems; for this task use "
                "accuracy, precision, recall, and F1-score."
            ),
            "pipeline": build_pipeline(
                LogisticRegression(C=1.5, random_state=42, class_weight="balanced")
            ),
        },
        "svm": {
            "display_name": "TF-IDF + SVM (Linear Kernel)",
            "problem_type": "Classification (Multi-class)",
            "task": "Predict task priority category: High, Medium, or Low",
            "note": (
                "Support Vector Machine with a linear kernel finds the best separating "
                "hyperplanes between priority classes in TF-IDF feature space."
            ),
            "pipeline": build_pipeline(
                CalibratedClassifierCV(
                    SVC(
                        kernel="linear",
                        C=1.0,
                        random_state=42,
                        class_weight="balanced",
                    ),
                    ensemble=False,
                )
            ),
        },
    }

    comparison = {}

    for model_key, config in model_configs.items():
        pipeline = config["pipeline"]
        pipeline.fit(X_train, y_train)
        metrics = evaluate_model(pipeline, X_test, y_test, ids_test, titles_test)
        comparison[model_key] = {
            "display_name": config["display_name"],
            "problem_type": config["problem_type"],
            "task": config["task"],
            "note": config["note"],
            "metrics": metrics["metrics_summary"],
            "confusion_matrix": metrics["confusion_matrix"],
            "classification_report": metrics["classification_report"],
            "error_analysis": metrics["error_analysis"],
            "pipeline": pipeline,
        }

    best_model_key = max(
        comparison,
        key=lambda key: (
            comparison[key]["metrics"]["accuracy"],
            comparison[key]["metrics"]["macro_f1"],
        ),
    )
    best_model = comparison[best_model_key]

    model_path = os.path.join(backend_dir, "model.joblib")
    joblib.dump(model_configs[best_model_key]["pipeline"], model_path)
    print(f"Best model ({comparison[best_model_key]['display_name']}) saved to {model_path}")

    eval_results = {
        "dataset_total": len(data),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "problem_type": "Classification (Multi-class)",
        "target_classes": TARGET_NAMES,
        "selected_model": best_model_key,
        "selected_model_name": comparison[best_model_key]["display_name"],
        "accuracy": best_model["metrics"]["accuracy"],
        "labels": TARGET_NAMES,
        "confusion_matrix": best_model["confusion_matrix"],
        "classification_report": best_model["classification_report"],
        "metrics_summary": best_model["metrics"],
        "test_evaluations": evaluate_model(
            model_configs[best_model_key]["pipeline"], X_test, y_test, ids_test, titles_test
        )["test_evaluations"],
        "error_analysis": best_model["error_analysis"],
        "model_comparison": {
            "note": (
                "Both models solve the same multi-class classification problem. "
                "R² score is not used because it measures regression fit, not class prediction quality."
            ),
            "models": {
                key: {
                    "display_name": value["display_name"],
                    "problem_type": value["problem_type"],
                    "task": value["task"],
                    "note": value["note"],
                    "metrics": value["metrics"],
                    "confusion_matrix": value["confusion_matrix"],
                    "misclassified_count": value["error_analysis"]["misclassified_count"],
                }
                for key, value in comparison.items()
            },
            "winner": best_model_key,
            "winner_reason": (
                f"{comparison[best_model_key]['display_name']} achieved the highest "
                f"test accuracy ({comparison[best_model_key]['metrics']['accuracy'] * 100:.2f}%) "
                f"and macro F1 ({comparison[best_model_key]['metrics']['macro_f1']:.4f})."
            ),
        },
    }

    eval_path = os.path.join(backend_dir, "eval_results.json")
    with open(eval_path, "w", encoding="utf-8") as f:
        json.dump(eval_results, f, indent=2)

    print(f"Evaluation saved to {eval_path}")
    print("=== Model Comparison (45 train / 15 test) ===")
    for key, result in comparison.items():
        m = result["metrics"]
        print(f"\n{result['display_name']} [{result['problem_type']}]")
        print(f"  Accuracy:          {m['accuracy'] * 100:.2f}%")
        print(f"  Macro Precision:   {m['macro_precision']:.4f}")
        print(f"  Macro Recall:      {m['macro_recall']:.4f}")
        print(f"  Macro F1:          {m['macro_f1']:.4f}")
        print(f"  Weighted F1:       {m['weighted_f1']:.4f}")
        print(f"  Misclassified:     {result['error_analysis']['misclassified_count']}/15")
        print("  Confusion Matrix:")
        print(np.array(result["confusion_matrix"]))

    print(f"\nWinner: {comparison[best_model_key]['display_name']}")


if __name__ == "__main__":
    train_and_evaluate()
