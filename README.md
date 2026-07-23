# SFCollab Task Priority Classifier ⚡

An end-to-end AI-powered web application built for **SFCollab** that automatically predicts task priority (**High**, **Medium**, or **Low**) based on title and description using a machine learning model trained on a self-labelled dataset of 60 realistic tasks.

Designed specifically for **100% free-tier deployment** with **zero exposed secrets** on the frontend.

---

## 🔗 Live Application Links & Documentation

- **Live Frontend URL**: [https://sfcollab-task-priority-classifier.vercel.app](https://sfcollab-task-priority-classifier.vercel.app) *(Replace with your Vercel/Netlify URL)*
- **Live Backend API URL**: [https://sfcollab-task-priority-backend.onrender.com](https://sfcollab-task-priority-backend.onrender.com) *(Replace with your Render URL)*
- **Interactive API Documentation (Swagger)**: [https://sfcollab-task-priority-backend.onrender.com/docs](https://sfcollab-task-priority-backend.onrender.com/docs)
- **Public GitHub Repository**: [https://github.com/your-username/sfcollab-task-priority-classifier](https://github.com/your-username/sfcollab-task-priority-classifier)

### 📁 Submission & Interview Helper Guides (`submission_docs/`)
- [`submission_docs/STEP_BY_STEP_GUIDE.md`](submission_docs/STEP_BY_STEP_GUIDE.md) — Step-by-step local setup, testing, and AI model guide without emojis.
- [`submission_docs/CODE_EXPLANATION_CHEATSHEET.md`](submission_docs/CODE_EXPLANATION_CHEATSHEET.md) — Line-by-line code explanation cheat sheet and top 10 interview Q&A.
- [`submission_docs/written_findings.md`](submission_docs/written_findings.md) — Submission findings document containing exact evaluation metrics, confusion matrix, error analysis, and 2-3 minute screen recording script.

---

## 🏛️ System Architecture

The **Task Priority Classifier** follows a decoupled client-server architecture. The frontend is an interactive **React + Vite** single-page web app that communicates asynchronously with a **FastAPI** Python backend via REST API endpoints. Incoming tasks are validated using Pydantic schemas (rejecting requests with missing or empty titles) and classified by a pre-trained **Scikit-Learn TF-IDF + Logistic Regression** machine learning pipeline trained on 60 realistic tasks. The system returns the predicted priority (**High**, **Medium**, **Low**), a confidence score percentage, a 1-line reason, and a class probability breakdown, keeping all credentials and AI logic securely isolated on the backend.

```
+-----------------------------------+        POST /api/classify-priority        +----------------------------------+
|          React + Vite UI          | ----------------------------------------> |         FastAPI Backend          |
| (Form, Result Card, Metrics Dash) | <---------------------------------------- | (Pydantic, TF-IDF + LogisticReg) |
+-----------------------------------+           { priority, reason, confidence } +----------------------------------+
```

---

## 🧰 Technologies Used

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend API** | Python 3.10+, FastAPI, Uvicorn | High-performance REST API with automatic OpenAPI docs |
| **Machine Learning** | Scikit-Learn (TF-IDF Vectorizer + Logistic Regression) | Text feature extraction & priority classification |
| **Data & Validation** | Pydantic v2, Joblib, NumPy | Input validation & model binary persistence |
| **Frontend UI** | React 18, Vite | Interactive UI with glassmorphic modern design system |
| **Styling** | Vanilla CSS3 (Custom Design Tokens, HSL colors) | Responsive layout, dark mode, color-coded result cards |
| **Deployment** | Render (Backend), Vercel (Frontend) | Free-tier cloud hosting configuration |

---

## 📊 Dataset & Model Evaluation (45/15 Train-Test Split)

### 1. Labelled Dataset
- **Total Samples**: 60 fake tasks modeled after real SFCollab engineering and ops workflows.
  - **High Priority (20 tasks)**: Database crashes, security vulnerabilities, billing webhook failures, expired SSL certificates.
  - **Medium Priority (20 tasks)**: Feature enhancements, CSV exports, pagination optimizations, dark mode toggles.
  - **Low Priority (20 tasks)**: Documentation typos, Prettier formatting, footer copyright updates, hover tooltips.
- **File Locations**: [`backend/dataset.json`](backend/dataset.json) and [`backend/dataset.csv`](backend/dataset.csv).

---

### 2. Train-Test Evaluation Results
- **Training Set (75%)**: 45 tasks (15 High, 15 Medium, 15 Low) used to train the TF-IDF n-gram vectorizer and logistic regression classifier.
- **Held-back Test Set (25%)**: 15 tasks kept completely isolated during training.
- **Held-Back Test Accuracy**: **66.67%** (10 / 15 correct predictions).

#### 3x3 Confusion Matrix (True vs Predicted)

| True \ Predicted | High (Pred) | Medium (Pred) | Low (Pred) |
| :--- | :---: | :---: | :---: |
| **High (True)** | **3** | 0 | 2 |
| **Medium (True)** | 1 | **3** | 1 |
| **Low (True)** | 1 | 0 | **4** |

---

### 3. Hardest Class & Error Analysis

#### Hardest Class: `Medium` Priority
- **Why it was hardest**: `Medium` priority tasks inherently share vocabulary overlap with both `High` priority tasks (e.g., words like *"implement"*, *"performance"*, *"upgrade"*) and `Low` priority tasks (e.g., words like *"UI"*, *"format"*, *"component"*). 
- In contrast, `High` priority tasks feature distinctive emergency keywords (*"crash"*, *"outage"*, *"vulnerability"*, *"leak"*), and `Low` priority tasks feature distinct minor edit keywords (*"typo"*, *"footer"*, *"comment"*, *"docs"*).

---

## 🔒 Security Practices

1. **Zero Secrets in Frontend**: No API keys, secret tokens, or `.env` files are stored or bundled in the React frontend.
2. **Backend Input Validation**: FastAPI uses Pydantic validators (`check_title_not_empty`) to reject missing, null, or empty whitespace titles with an HTTP 400 Bad Request error.
3. **CORS Policy**: Configured explicitly for cross-origin request security between deployed frontend and backend origins.

---

## 🚀 Quick Setup Commands

### 1. Backend Server
```bash
cd backend
python -m pip install -r requirements.txt
python train.py
python -m uvicorn main:app --reload --port 8000
```

### 2. Frontend Web App
```bash
cd frontend
npm install
npm run dev
```

For full line-by-line explanations, walkthrough instructions, and interview Q&A guides, refer to [`submission_docs/`](submission_docs/).
