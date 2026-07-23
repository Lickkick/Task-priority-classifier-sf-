# Complete Code Explanation Cheat Sheet and Interview Defense Guide

Do not be afraid of being asked about any line of code. Every line in this project follows standard, simple Python and JavaScript patterns. 

This guide breaks down every single important line in your codebase so you can confidently explain it if an evaluator points to any line during your interview or walkthrough.

---

## Section 1: Backend Code Line-by-Line Explanation

### 1. backend/train.py (Model Training and Evaluation)

#### Lines 1-10: Imports
- import json: Standard Python library used to read and write JSON files (dataset.json and eval_results.json).
- import os: Standard Python library used to construct absolute file paths (os.path.join) so the script runs on any operating system without path errors.
- import joblib: Library used to serialize (save) and deserialize (load) trained Scikit-Learn machine learning model pipelines to binary files (model.joblib).
- import numpy as np: Numerical Python library used for matrix operations and finding maximum probability indices (np.max, np.argmax).
- from sklearn.feature_extraction.text import TfidfVectorizer: Converts text strings (title and description) into numerical feature matrices based on word frequency and uniqueness.
- from sklearn.linear_model import LogisticRegression: Machine learning algorithm that learns decision boundaries between High, Medium, and Low priorities based on TF-IDF features.
- from sklearn.pipeline import Pipeline: Bundles text preprocessing (TF-IDF) and machine learning classification (Logistic Regression) into a single reusable object.
- from sklearn.model_selection import train_test_split: Splits the dataset into training samples (45) and held-back test samples (15).
- from sklearn.metrics import accuracy_score, classification_report, confusion_matrix: Functions used to evaluate model accuracy, calculate per-class precision and recall, and build the 3x3 confusion matrix.

#### Lines 20-30: Dataset Loading and Preprocessing
- texts = [f"{item['title']}. {item['description']}" for item in data]: Combines title and description into a single text string for each task so the model reads both fields together.
- labels = [item['priority'] for item in data]: Extracts the target ground-truth priority label ("High", "Medium", "Low") for each task.

#### Lines 35-40: Stratified 45/15 Train-Test Split
- X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.25, random_state=42, stratify=labels):
  - test_size=0.25: Sets aside 25% of the dataset (15 items) as the held-back test set and 75% (45 items) as the training set.
  - random_state=42: Seeds the random number generator so the exact same 45/15 split is produced every time you run the script.
  - stratify=labels: Guarantees that both train and test sets have equal proportions of High (5), Medium (5), and Low (5) tasks.

#### Lines 42-50: Scikit-Learn Pipeline Setup
- TfidfVectorizer(ngram_range=(1, 2), stop_words='english', min_df=1):
  - ngram_range=(1, 2): Extracts single words ("database") and two-word combinations ("database crash").
  - stop_words='english': Automatically removes non-informative English words ("the", "is", "and").
- LogisticRegression(C=1.5, random_state=42, class_weight='balanced'):
  - C=1.5: Sets inverse regularization strength (controls model fitting balance).
  - class_weight='balanced': Automatically adjusts weights inversely proportional to class frequencies to treat all three priority classes fairly.

#### Lines 52-60: Fitting and Testing
- pipeline.fit(X_train, y_train): Learns word weights exclusively from the 45 training items. The 15 test items are never seen during this step.
- y_pred = pipeline.predict(X_test): Generates priority predictions ("High", "Medium", or "Low") for the 15 test items.
- y_proba = pipeline.predict_proba(X_test): Calculates the probability distribution (for example: High 70%, Medium 20%, Low 10%) for each test item.

#### Lines 62-75: Metrics and Confusion Matrix Calculation
- acc = accuracy_score(y_test, y_pred): Compares predicted labels against true test labels to calculate accuracy (10 out of 15 = 66.67%).
- cm = confusion_matrix(y_test, y_pred, labels=["High", "Medium", "Low"]): Generates the 3x3 table showing how many tasks of each true priority were correctly predicted or misclassified.

---

### 2. backend/model.py (Inference Engine)

- self.pipeline = joblib.load(self.model_path): Loads the pre-trained model.joblib pipeline into memory when the server starts.
- proba = self.pipeline.predict_proba([text])[0]: Runs live inference on user-submitted text and outputs probability scores for High, Medium, and Low.
- pred_idx = np.argmax(proba): Finds the index of the highest probability score to pick the winning priority label.
- generate_reason(): Checks the task title and description for key domain words (such as "crash", "outage", "refactor", "typo") and constructs a clear one-line explanation sentence explaining why the priority was chosen.

---

### 3. backend/main.py (FastAPI Server and REST API)

- app = FastAPI(...): Initializes the FastAPI backend application framework.
- app.add_middleware(CORSMiddleware, allow_origins=["*"], ...): Enables Cross-Origin Resource Sharing so the browser can send fetch requests from the React frontend port to the FastAPI backend port without being blocked by browser security.
- class ClassifyRequest(BaseModel): Defines the Pydantic data schema requiring title (string) and optional description (string).
- @field_validator('title'): Intercepts incoming requests before processing. If title is missing, null, or empty whitespace, it raises a ValueError which FastAPI converts into an HTTP 400 Bad Request error.
- @app.post("/api/classify-priority"): Defines the REST API endpoint accepting JSON inputs and returning { priority, reason, confidence, probabilities, model_type }.

---

## Section 2: Frontend Code Line-by-Line Explanation (frontend/src/App.jsx)

- import React, { useState } from 'react': Imports React library and the useState hook for managing local state (result data, loading state, active navigation tab).
- fetch('/api/classify-priority', { method: 'POST', body: JSON.stringify({ title, description }) }): Makes an HTTP POST request to the FastAPI backend API with task input payload.
- const data = await response.json(): Parses the JSON response body returned by FastAPI.
- setResult(data): Updates React state with the returned priority, confidence, and reason so the UI re-renders the result card immediately.

---

## Section 3: Top 10 Evaluator Interview Questions and Answers

### Question 1: "Why did you choose TF-IDF + Logistic Regression instead of a huge Deep Learning model or LLM?"
Answer: "Because for a text classification task on 60 items, classical ML with TF-IDF and Logistic Regression trains in less than one second, requires zero paid GPU infrastructure, runs completely free on Render, and provides deterministic probability outputs without hallucinating."

### Question 2: "How did you split your data, and why does it matter?"
Answer: "I used a 45/15 stratified train-test split (75% training, 25% test). Stratification is critical because it ensures equal class distribution (5 High, 5 Medium, 5 Low) in both training and test sets, preventing class imbalance bias."

### Question 3: "How does your app handle missing inputs or invalid requests?"
Answer: "Input validation is handled strictly on the backend using Pydantic field validators in backend/main.py. If a request has a missing or empty task title, Pydantic rejects it before it reaches the model and returns an HTTP 400 Bad Request response."

### Question 4: "Where are your API keys stored?"
Answer: "There are zero API keys in the frontend code. All configuration and backend settings are stored strictly in backend environment variables (.env), ensuring complete credential security."

### Question 5: "What is your measured test accuracy, and why is it 66.67%?"
Answer: "The measured test accuracy on the 15 held-back test cases is 66.67% (10 out of 15 correct). I chose to report honest held-back test numbers rather than fake training numbers. Medium priority was the hardest class because its vocabulary overlaps with both High and Low priority tasks."

### Question 6: "What is a 3x3 Confusion Matrix?"
Answer: "A 3x3 confusion matrix displays true priority classes on the vertical axis and predicted priority classes on the horizontal axis. Diagonals represent correct predictions, while off-diagonals show exact misclassification patterns."

### Question 7: "What is the purpose of model.joblib?"
Answer: "model.joblib is a serialized binary artifact generated by train.py. It freezes the trained TF-IDF vocabulary weights and Logistic Regression coefficients so the FastAPI backend can instantly load them at startup without retraining."

### Question 8: "How does your 1-line reason explanation work?"
Answer: "The generate_reason() function in backend/model.py combines the top TF-IDF features and key domain trigger words (such as 'crash', 'outage', 'refactor', 'typo') detected in the task text to format a human-readable sentence."

### Question 9: "What is CORS and why did you configure it?"
Answer: "CORS stands for Cross-Origin Resource Sharing. I added CORSMiddleware in backend/main.py so the React frontend hosted on Vercel can securely make HTTP fetch calls to the FastAPI backend hosted on Render without browser security blocks."

### Question 10: "How does your stretch goal user feedback work?"
Answer: "When a user clicks the Thumbs Up or Thumbs Down button on the result card, the frontend sends a payload to POST /api/feedback, which appends the user feedback to backend/feedback.json for future model retraining."
