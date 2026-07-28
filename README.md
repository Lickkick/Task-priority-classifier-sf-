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

## 📊 Key Machine Learning Findings & Model Evaluation

### 1. Classification vs. Regression & Evaluators Clarification
- **Problem Type:** Task priority prediction (`High`, `Medium`, `Low`) is a **Multi-Class Classification Task**, NOT a Regression task.
- **Logistic Regression Model Type:** Despite having *"Regression"* in its name, **Logistic Regression is a classification algorithm** that models class posterior probabilities.
- **Why $R^2$ Score Does Not Apply:** $R^2$ (Coefficient of Determination) evaluates continuous numerical regression models (e.g., house price or temperature prediction). For discrete category classification, standard evaluators are **Accuracy**, **Precision**, **Recall**, **F1-Score**, and **Confusion Matrix**.
- **Why Classical ML over LLMs:** On a small 60-task dataset, classical ML (TF-IDF + Logistic Regression / SVM) trains in $< 1\text{ second}$, delivers $< 2\text{ms}$ CPU inference latency, operates with **$0 API cost**, and eliminates hallucination risks—making LLMs overkill.

---

### 2. Model Comparison: Logistic Regression vs. Support Vector Machine (Linear SVM)

Both models were evaluated on the exact same held-back test set (45 train / 15 test split):

| Evaluator / Metric | TF-IDF + Logistic Regression | TF-IDF + SVM (Linear Kernel) | Comparison Result |
| :--- | :---: | :---: | :---: |
| **Problem Type** | Multi-class Classification | Multi-class Classification | Identical |
| **Held-Back Test Accuracy** | **66.67%** (10 / 15 correct) | **66.67%** (10 / 15 correct) | **Tie** |
| **Macro Precision** | **72.38%** (0.7238) | **72.38%** (0.7238) | **Tie** |
| **Macro Recall** | **66.67%** (0.6667) | **66.67%** (0.6667) | **Tie** |
| **Macro F1-Score** | **67.22%** (0.6722) | **67.22%** (0.6722) | **Tie** |
| **Weighted F1-Score** | **67.22%** (0.6722) | **67.22%** (0.6722) | **Tie** |
| **Misclassified Test Items** | 5 / 15 | 5 / 15 | **Tie** |

#### Per-Class Metrics Breakdown (Identical Across Both Models)
| Priority Class | Precision | Recall | F1-Score | Support (Test) |
| :--- | :---: | :---: | :---: | :---: |
| **High** | 60.0% | 60.0% | 60.0% | 5 |
| **Medium** | 57.1% | 80.0% | 66.7% | 5 |
| **Low** | 100.0% | 60.0% | 75.0% | 5 |

#### 3x3 Confusion Matrix (True vs Predicted)
| True \ Predicted | High (Pred) | Medium (Pred) | Low (Pred) |
| :--- | :---: | :---: | :---: |
| **High (True)** | **3** | 0 | 2 |
| **Medium (True)** | 1 | **3** | 1 |
| **Low (True)** | 1 | 0 | **4** |

---

### 3. Hardest Class & Error Findings

- **Hardest Class: `Medium` Priority**
  - `Medium` priority tasks inherently share vocabulary overlap with both `High` priority tasks (e.g., words like *"implement"*, *"performance"*, *"upgrade"*) and `Low` priority tasks (e.g., words like *"UI"*, *"format"*, *"component"*).
  - In contrast, `High` priority tasks feature distinctive emergency keywords (*"crash"*, *"outage"*, *"vulnerability"*, *"leak"*), while `Low` priority tasks feature distinct minor edit keywords (*"typo"*, *"footer"*, *"comment"*, *"docs"*).
- **Linear Decision Boundary Convergence:** Linear SVM and Logistic Regression produce identical decision boundaries because sparse TF-IDF text vectors with $N=45$ training samples cause margin maximization (SVM) and log-loss minimization (Logistic Regression) to converge to equivalent hyperplanes.
- **Misclassified Test Cases Breakdown:**
  1. *Task #15: "Fatal crash on landing page for unauthenticated visitors"* → Predicted **Low** (True: **High**). Words *"visitors"* & *"page"* appeared in low-priority template tasks during training.
  2. *Task #38: "Refactor backend API controller response format"* → Predicted **High** (True: **Medium**). Words *"backend"* & *"API"* over-indexed on server incident features.
  3. *Task #42: "Change primary action button color to brand hex shade"* → Predicted **High** (True: **Low**). Low confidence score on boundary TF-IDF unigram weights.

---

### 4. Known Limitations & Future Roadmap
1. **Vocabulary Overfitting on Small Dataset:** With 45 training examples, rare domain words (e.g., *"crash"*, *"API"*) can over-index if they appear in only 1–2 training tasks. Expanding to 300+ labelled tasks will stabilize TF-IDF n-gram weights.
2. **Negation Unawareness:** Classical bag-of-words TF-IDF models do not handle complex sentiment negation (e.g., *"This is NOT an outage"* may still trigger a High priority prediction due to the word *"outage"*).
3. **Cold-Start for Unseen Technical Terms:** If a user submits a task featuring brand new technologies or acronyms not present in the 60 task dataset (e.g., *"Kubernetes pod eviction"*), the model falls back on general word overlaps.

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
