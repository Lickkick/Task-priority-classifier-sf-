# Task Priority Classifier — Submission & Written Findings Document

## 1. Public Links & Submission Deliverables
- GitHub Repository: https://github.com/your-username/sfcollab-task-priority-classifier
- Live Deployed Frontend URL: https://sfcollab-task-priority.vercel.app
- Live Deployed Backend API URL: https://sfcollab-task-priority-backend.onrender.com
- Interactive Swagger Docs: https://sfcollab-task-priority-backend.onrender.com/docs
- Labelled Dataset CSV: Included in repository as backend/dataset.csv

---

## 2. Technical Architecture & Stack (3–4 Sentences)

> The Task Priority Classifier is a decoupled web application comprising a FastAPI Python backend and a React (Vite) single-page frontend interface. Task titles and descriptions submitted by the user are validated using Pydantic schemas (rejecting empty or missing titles with HTTP 400 Bad Request) and processed by an offline-trained Scikit-Learn TF-IDF + Logistic Regression text classification pipeline. The model predicts the task's priority (High, Medium, or Low), outputs a confidence percentage, and generates a feature-driven 1-line reason, while strictly isolating all API configuration and environment variables on the backend with zero exposed frontend secrets.

---

## 3. Technologies Used

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Backend API | FastAPI, Uvicorn, Pydantic v2 | High-performance Python REST API & automatic OpenAPI docs |
| Machine Learning | Scikit-Learn (TF-IDF Vectorizer + Logistic Regression) | Text feature extraction & priority classification |
| Dataset | 60 Self-Labelled Tasks (dataset.json / dataset.csv) | Domain-specific training & evaluation data |
| Frontend UI | React 18, Vite | Interactive web app with glassmorphic modern UI |
| Styling | Vanilla CSS3 (Custom Design Tokens, HSL colors) | Color-coded result cards (Red/Amber/Green), confidence gauges |
| Deployment | Render (Backend), Vercel (Frontend) | Free-tier cloud hosting configuration |

---

## 4. Evaluation Numbers & Metrics (45/15 Stratified Split)

- Total Labelled Tasks: 60 fake tasks (20 High, 20 Medium, 20 Low).
- Training Set (75%): 45 tasks used to train the TF-IDF vectorizer and logistic regression classifier.
- Held-Back Test Set (25%): 15 tasks kept strictly isolated during training.
- Measured Test Accuracy: 66.67% (10 / 15 correct predictions on unseen test samples).

### 3x3 Confusion Matrix (True vs Predicted)

| True Priority \ Predicted | High (Pred) | Medium (Pred) | Low (Pred) |
| :--- | :---: | :---: | :---: |
| High (True) | 3 | 0 | 2 |
| Medium (True) | 1 | 3 | 1 |
| Low (True) | 1 | 0 | 4 |

---

## 5. Hardest Class & Qualitative Error Analysis

### Hardest Class: Medium Priority
- Why it was hardest: Medium priority tasks inherently share vocabulary overlap with both High priority tasks (e.g., words like "implement", "performance", "upgrade") and Low priority tasks (e.g., words like "UI", "format", "component").
- In contrast, High priority tasks feature distinctive emergency keywords ("crash", "outage", "vulnerability", "leak"), and Low priority tasks feature distinct minor maintenance terms ("typo", "footer", "comment", "docs").

### Misclassified Test Cases (Honest Error Breakdown):
1. Task #15: "Fatal crash on landing page for unauthenticated visitors"
   - True Priority: High
   - Predicted Priority: Low (Confidence: 38.4%)
   - Root Cause: The words "visitors" and "page" appeared in low-priority template tasks in the training set, overwhelming the TF-IDF weight of "crash" due to small training size.
2. Task #38: "Refactor backend API controller response format"
   - True Priority: Medium
   - Predicted Priority: High (Confidence: 40.7%)
   - Root Cause: The words "backend" and "API" were heavily associated with High priority server incidents in the training split.
3. Task #42: "Change primary action button color to brand hex shade"
   - True Priority: Low
   - Predicted Priority: High (Confidence: 34.6%)
   - Root Cause: Low confidence score where TF-IDF unigrams fell on boundary thresholds.

---

## 6. Honest List of Known Limitations & What Does Not Work Yet

1. Vocabulary Overfitting on Small Dataset: With 45 training examples, rare domain words (e.g. "crash", "API") can over-index if they appear in only 1 or 2 training tasks. Expanding to 300+ labelled tasks will stabilize TF-IDF n-gram weights.
2. Negation Unawareness: Classical bag-of-words TF-IDF models do not handle complex sentiment negation well (e.g., "This is NOT an outage" may still trigger a High priority prediction due to the word "outage").
3. Cold-Start for Unseen Technical Terms: If a user submits a task featuring brand new technologies or acronyms not present in the 60 task dataset (e.g., "Kubernetes pod eviction"), the model relies back on general fallback word overlaps.

---

## 7. Setup & Run Instructions

### 1. Backend Server
```bash
cd backend
python -m pip install -r requirements.txt
python train.py
python -m uvicorn main:app --reload --port 8000
```
- Local API Docs: http://localhost:8000/docs

### 2. Frontend Web App
```bash
cd frontend
npm install
npm run dev
```
- Local Web App: http://localhost:3000

---

## Screen Recording Script (2–3 Minutes Guide)

1. Introduction (15s): Show the live app running in browser. Briefly state the project goal (SFCollab task priority classifier).
2. Form Interaction & Presets (45s):
   - Click 1-click test preset "Production DB Outage" -> Click Predict -> Show High Priority Card with 1-line reason & gauge bar.
   - Click preset "Keyset Pagination" -> Show Medium Priority Card.
   - Click preset "Readme Typos" -> Show Low Priority Card.
   - Test empty title input -> Show error validation toast message.
3. Stretch Goal Feedback (20s): Click Thumbs Up button -> Show feedback saved confirmation toast.
4. Evaluation Dashboard Walkthrough (45s): Switch to the Model Evaluation (45/15) tab. Walk through test accuracy (66.7%), 3x3 confusion matrix table, and explain the hardest class (Medium).
5. Code Walkthrough (35s): Briefly highlight backend/main.py (Pydantic validation + FastAPI route), backend/train.py (TF-IDF + Logistic Regression pipeline), and point out zero frontend secrets.
