# Task Priority Classifier - Step-by-Step Guide

This guide explains how to run the project locally, test all features, deploy to free hosting, and understand the code line-by-line.

---

## Part 1: How to Run the Project Locally

### Step 1: Open Terminal and Navigate to the Project Root
```bash
cd "c:\Games\aiml bigenner\text to classifer"
```

### Step 2: Set Up and Start the FastAPI Backend
1. Open a terminal window and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install the required Python packages:
   ```bash
   python -m pip install -r requirements.txt
   ```
3. Train the Machine Learning model on the 60-task dataset:
   ```bash
   python train.py
   ```
   This command creates two files inside the backend folder:
   - model.joblib: The trained machine learning model pipeline.
   - eval_results.json: The metrics, accuracy score (66.67%), 3x3 confusion matrix, and error analysis.

4. Start the FastAPI backend server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
   - The backend API is now active at: http://localhost:8000
   - Interactive Swagger API Documentation is available at: http://localhost:8000/docs

---

### Step 3: Set Up and Start the React Frontend
1. Open a second terminal window and navigate to the frontend folder:
   ```bash
   cd "c:\Games\aiml bigenner\text to classifer\frontend"
   ```
2. Install Node.js frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   - The web user interface is now live at: http://localhost:3000

---

## Part 2: How to Test the Web Application

1. Open your browser and go to http://localhost:3000.
2. Test Preset 1 (High Priority): Click the button "Production DB Outage". Click "Predict Priority Class".
   - The app sends a request to POST /api/classify-priority.
   - The result card turns red and displays "High Priority" along with a one-line reason.
3. Test Preset 2 (Medium Priority): Click "Keyset Pagination". Click "Predict Priority Class".
   - The result card turns amber and displays "Medium Priority".
4. Test Preset 3 (Low Priority): Click "Readme Typos". Click "Predict Priority Class".
   - The result card turns green and displays "Low Priority".
5. Test Missing Input Validation: Erase the title input completely and click Predict.
   - The system prevents submission and shows an error message because empty task titles are rejected.
6. Test Feedback Button: Click the Thumbs Up or Thumbs Down button on the result card.
   - This stores your feedback entry inside backend/feedback.json.
7. View Model Evaluation: Click the "Model Evaluation (45/15)" tab at the top.
   - View the test set accuracy (66.67%), the 3x3 confusion matrix table, and the misclassified test cases.
8. View Dataset Browser: Click the "Labelled Dataset (60)" tab at the top.
   - Search and filter through all 60 tasks in the dataset.

---

## Part 3: Understanding How the AI Model Works

### 1. The Dataset (backend/dataset.json and backend/dataset.csv)
- Contains 60 tasks created specifically for SFCollab.
- Balanced evenly: 20 High priority tasks, 20 Medium priority tasks, 20 Low priority tasks.

### 2. The Train-Test Split (45 Train / 15 Test)
- train.py splits the dataset into 45 training tasks (75%) and 15 held-back test tasks (25%).
- The split uses stratify=labels so that the test set contains exactly 5 High, 5 Medium, and 5 Low priority tasks.
- The model trains only on the 45 training tasks and is evaluated exclusively on the 15 held-back tasks.

### 3. Text Preprocessing: TF-IDF Vectorizer
- TF-IDF stands for Term Frequency-Inverse Document Frequency.
- It converts text words into numbers based on how frequently a word appears in a task versus across all tasks.
- ngram_range=(1, 2) extracts single words (unigrams like "database") and two-word pairs (bigrams like "database crash").
- stop_words='english' removes unhelpful words like "the", "is", and "at".

### 4. Machine Learning Classifier: Logistic Regression
- Logistic Regression calculates the probability of a task belonging to High, Medium, or Low priority.
- class_weight='balanced' ensures equal weight across all priority classes.
- predict_proba() returns probabilities for each class (for example: High 60%, Medium 30%, Low 10%).

### 5. Measured Metrics and Confusion Matrix
- Test Accuracy: 66.67% (10 out of 15 held-back test cases predicted correctly).
- 3x3 Confusion Matrix:
  - High Priority: 3 predicted correctly, 2 misclassified as Low.
  - Medium Priority: 3 predicted correctly, 1 misclassified as High, 1 misclassified as Low.
  - Low Priority: 4 predicted correctly, 1 misclassified as High.
- Hardest Class: Medium priority is the hardest class to predict because its vocabulary (words like "implement", "update", "format") overlaps with both High and Low priority tasks.

---

## Part 4: Code Walkthrough and Line Explanation

### 1. backend/train.py Explanation
- train_test_split(texts, labels, test_size=0.25, random_state=42, stratify=labels): Divides the dataset into 45 train and 15 test items while keeping class proportions equal.
- Pipeline([('tfidf', TfidfVectorizer(...)), ('clf', LogisticRegression(...))]): Bundles text conversion and machine learning classification into a single pipeline.
- pipeline.fit(X_train, y_train): Trains the model on the 45 training examples.
- confusion_matrix(y_test, y_pred, labels=["High", "Medium", "Low"]): Builds the 3x3 table comparing true labels against predicted labels.
- joblib.dump(pipeline, "model.joblib"): Saves the trained model to disk.

### 2. backend/model.py Explanation
- PriorityClassifier: Loads model.joblib and exposes the classify(title, description) method.
- generate_reason(): Checks the task text for domain trigger words (such as "crash", "outage", "refactor", "typo") and constructs a clear one-line explanation.
- np.argmax(proba): Finds the index of the highest probability to determine the winning priority class.

### 3. backend/main.py Explanation
- FastAPI(): Initializes the web server framework.
- CORSMiddleware: Enables cross-origin HTTP requests so the React frontend can talk to the FastAPI backend.
- @field_validator('title'): Pydantic validation rule that checks if title is empty or missing. If empty, FastAPI automatically returns an HTTP 400 error.
- @app.post("/api/classify-priority"): The REST API endpoint accepting { title, description } and returning { priority, reason, confidence, probabilities }.

### 4. frontend/src/App.jsx Explanation
- fetch('/api/classify-priority', ...): Sends the task data from the React form to the FastAPI backend via an asynchronous HTTP POST request.
- setResult(data): Updates React component state with the classification result.
- activeTab: Controls switching between the Classifier Workspace, Evaluation Dashboard, and Dataset Viewer.

---

## Part 5: Free-Tier Deployment Strategy

1. Backend Deployment (Render):
   - Host your backend on Render free tier using render.yaml.
   - Command: pip install -r requirements.txt && python train.py
   - Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT

2. Frontend Deployment (Vercel):
   - Host your React frontend on Vercel free tier using vercel.json.
   - Framework preset: Vite.
   - Build Command: npm run build. Output directory: dist.

3. Security Guarantee:
   - No API keys or secret credentials exist in the frontend code.
   - .gitignore prevents uploading .env files, node_modules/, or temporary logs to GitHub.
