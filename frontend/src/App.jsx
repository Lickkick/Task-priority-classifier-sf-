import React, { useState } from 'react';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import CompletionPredictor from './components/CompletionPredictor';
import TaskForm from './components/TaskForm';
import ResultCard from './components/ResultCard';
import EvaluationDashboard from './components/EvaluationDashboard';
import DatasetViewer from './components/DatasetViewer';
import Footer from './components/Footer';
import WorkloadsDashboard from './components/WorkloadsDashboard';
import { getApiHost } from './config';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing'); // Default view is the Landing Page
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTaskTitle, setCurrentTaskTitle] = useState('');
  const [currentTaskDescription, setCurrentTaskDescription] = useState('');

  const API_HOST = getApiHost();

  const handleClassify = async ({ title, description }) => {
    setIsLoading(true);
    setError(null);
    setCurrentTaskTitle(title);
    setCurrentTaskDescription(description);

    try {
      const response = await fetch(`${API_HOST}/api/classify-priority`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to classify task priority.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Classification error:", err);
      setError(err.message || "Could not connect to classification backend service.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (feedbackPayload) => {
    try {
      await fetch(`${API_HOST}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackPayload),
      });
    } catch (err) {
      console.warn("Feedback submission failed:", err);
    }
  };

  return (
    <div className="app-container">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {activeTab === 'landing' && (
          <LandingPage 
            onLaunchClassifier={() => setActiveTab('classifier')}
            onLaunchEvaluation={() => setActiveTab('evaluation')}
            onLaunchPredictor={() => setActiveTab('predictor')}
          />
        )}

        {activeTab === 'classifier' && (
          <div className="main-grid">
            <TaskForm onClassify={handleClassify} isLoading={isLoading} error={error} />
            <ResultCard 
              result={result} 
              onFeedback={handleFeedback} 
              currentTaskTitle={currentTaskTitle} 
              currentTaskDescription={currentTaskDescription}
              apiHost={API_HOST}
            />
          </div>
        )}

        {activeTab === 'evaluation' && (
          <EvaluationDashboard apiHost={API_HOST} />
        )}

        {activeTab === 'predictor' && (
          <CompletionPredictor apiHost={API_HOST} />
        )}

        {activeTab === 'dataset' && (
          <DatasetViewer apiHost={API_HOST} />
        )}

        {activeTab === 'workloads' && (
          <WorkloadsDashboard apiHost={API_HOST} />
        )}
      </main>

      <Footer />
    </div>
  );
}
