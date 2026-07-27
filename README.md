 Task Priority Classifier 

An end-to-end AI-powered web application built for **SFCollab** that automatically predicts task priority (**High**, **Medium**, or **Low**) based on title and description using a machine learning model trained on a self-labelled dataset of 60 realistic tasks.

Designed specifically for **100% free-tier deployment** with **zero exposed secrets** on the frontend.

---


 System Architecture

The **Task Priority Classifier** follows a decoupled client-server architecture. The frontend is an interactive **React + Vite** single-page web app that communicates asynchronously with a **FastAPI** Python backend via REST API endpoints. Incoming tasks are validated using Pydantic schemas (rejecting requests with missing or empty titles) and classified by a pre-trained **Scikit-Learn TF-IDF + Logistic Regression** machine learning pipeline trained on 60 realistic tasks. The system returns the predicted priority (**High**, **Medium**, **Low**), a confidence score percentage, a 1-line reason, and a class probability breakdown, keeping all credentials and AI logic securely isolated on the backend.


 Technologies Used

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend API** | Python 3.10+, FastAPI, Uvicorn | High-performance REST API with automatic OpenAPI docs |
| **Machine Learning** | Scikit-Learn (TF-IDF Vectorizer + Logistic Regression) | Text feature extraction & priority classification |
| **Data & Validation** | Pydantic v2, Joblib, NumPy | Input validation & model binary persistence |
| **Frontend UI** | React 18, Vite | Interactive UI with glassmorphic modern design system |
| **Styling** | Vanilla CSS3 (Custom Design Tokens, HSL colors) | Responsive layout, dark mode, color-coded result cards |
| **Deployment** | Render (Backend), Vercel (Frontend) | Free-tier cloud hosting configuration |

---

 Dataset & Model Evaluation (45/15 Train-Test Split)

1. Labelled Dataset
Total Samples**: 60 fake tasks modeled after real SFCollab engineering and ops workflows.
  - **High Priority (20 tasks)**: Database crashes, security vulnerabilities, billing webhook failures, expired SSL certificates.
  - **Medium Priority (20 tasks)**: Feature enhancements, CSV exports, pagination optimizations, dark mode toggles.
  - **Low Priority (20 tasks)**: Documentation typos, Prettier formatting, footer copyright updates, hover tooltips.
- **File Locations**: [`backend/dataset.json`](backend/dataset.json) and [`backend/dataset.csv`](backend/dataset.csv).

---

### 2. Train-Test Evaluation Results
- **Training Set (75%)**: 45 tasks (15 High, 15 Medium, 15 Low) used to train the TF-IDF n-gram vectorizer and logistic regression classifier.
- **Held-back Test Set (25%)**: 15 tasks kept completely isolated during training.
- **Held-Back Test Accuracy**: **66.67%** (10 / 15 correct predictions).

### 3. Problem Type & Evaluators Note
- **Classification vs Regression**: Predicting task priority categories (`High`, `Medium`, `Low`) is a **Multi-class Classification task**. 
- **Why $R^2$ Score Does Not Apply**: $R^2$ (Coefficient of Determination) evaluates continuous numeric regression models. For discrete category classification, standard evaluators are **Accuracy, Precision, Recall, and F1-Score**.
- **Why Classical ML over LLMs**: On a small 60-task dataset, classical ML (TF-IDF + Logistic Regression / SVM) trains in $< 1\text{ second}$, has sub-2ms CPU inference, zero cost, and zero hallucination risk—making LLMs overkill.

---

### 4. Model Comparison: Logistic Regression vs Support Vector Machine (Linear SVM)

| Evaluator / Metric | TF-IDF + Logistic Regression | TF-IDF + SVM (Linear Kernel) | Comparison |
| :--- | :---: | :---: | :---: |
| **Problem Type** | Multi-class Classification | Multi-class Classification | Identical |
| **Held-Back Test Accuracy** | **66.67%** (10 / 15 correct) | **66.67%** (10 / 15 correct) | **Tie** |
| **Macro Precision** | **72.38%** (0.7238) | **72.38%** (0.7238) | **Tie** |
| **Macro Recall** | **66.67%** (0.6667) | **66.67%** (0.6667) | **Tie** |
| **Macro F1-Score** | **67.22%** (0.6722) | **67.22%** (0.6722) | **Tie** |
| **Weighted F1-Score** | **67.22%** (0.6722) | **67.22%** (0.6722) | **Tie** |
| **Misclassified Test Cases** | 5 / 15 | 5 / 15 | **Tie** |

#### Per-Class Metrics Breakdown (Identical across both models)

| Priority Class | Precision | Recall | F1-Score | Support (Test) |
| :--- | :---: | :---: | :---: | :---: |
| **High** | 60.0% | 60.0% | 60.0% | 5 |
| **Medium** | 57.1% | 80.0% | 66.7% | 5 |
| **Low** | 100.0% | 60.0% | 75.0% | 5 |

---

### 5. 3x3 Confusion Matrix (True vs Predicted)

| True \ Predicted | High (Pred) | Medium (Pred) | Low (Pred) |
| :--- | :---: | :---: | :---: |
| **High (True)** | **3** | 0 | 2 |
| **Medium (True)** | 1 | **3** | 1 |
| **Low (True)** | 1 | 0 | **4** |

---

### 6. Hardest Class & Qualitative Error Analysis

 Hardest Class: `Medium` Priority
- **Why it was hardest**: `Medium` priority tasks inherently share vocabulary overlap with both `High` priority tasks (e.g., words like *"implement"*, *"performance"*, *"upgrade"*) and `Low` priority tasks (e.g., words like *"UI"*, *"format"*, *"component"*). 
- In contrast, `High` priority tasks feature distinctive emergency keywords (*"crash"*, *"outage"*, *"vulnerability"*, *"leak"*), and `Low` priority tasks feature distinct minor edit keywords (*"typo"*, *"footer"*, *"comment"*, *"docs"*).
- **Linear Equivalence**: Linear SVM and Logistic Regression produce identical decision boundaries because sparse TF-IDF text vectors with $N=45$ training samples cause margin maximization (SVM) and log-loss minimization (Logistic Regression) to converge to the same separating hyperplanes.

---

 Security Practices

1. **Zero Secrets in Frontend**: No API keys, secret tokens, or `.env` files are stored or bundled in the React frontend.
2. **Backend Input Validation**: FastAPI uses Pydantic validators (`check_title_not_empty`) to reject missing, null, or empty whitespace titles with an HTTP 400 Bad Request error.
3. **CORS Policy**: Configured explicitly for cross-origin request security between deployed frontend and backend origins.

---

 Quick Setup Commands

1. Backend Server
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
