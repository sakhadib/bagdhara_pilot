import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Play, Eye, Trophy } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import Header from '../components/Header';

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [totalScripts, setTotalScripts] = useState(0);
  const [completedChecks, setCompletedChecks] = useState(0);
  const [pendingIssues, setPendingIssues] = useState(0);
  const [modelLeaderboard, setModelLeaderboard] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser]);

  async function fetchStats() {
    try {
      const totalSnapshot = await getDocs(collection(db, "pilot"));
      const total = totalSnapshot.size;
      const doneQuery = query(collection(db, "pilot"), where("status", "==", "done"));
      const doneSnapshot = await getDocs(doneQuery);
      const done = doneSnapshot.size;
      const pending = total - done;
      setTotalScripts(total);
      setCompletedChecks(done);
      setPendingIssues(pending);

      // Calculate model leaderboard
      const modelScores = {};
      const allDocsSnapshot = await getDocs(collection(db, "pilot"));
      
      allDocsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.predictions && Array.isArray(data.predictions)) {
          data.predictions.forEach(prediction => {
            if (prediction.grade !== undefined && prediction.grade !== null && prediction.model) {
              if (!modelScores[prediction.model]) {
                modelScores[prediction.model] = {
                  totalScore: 0,
                  gradedCount: 0
                };
              }
              modelScores[prediction.model].totalScore += prediction.grade;
              modelScores[prediction.model].gradedCount += 1;
            }
          });
        }
      });

      // Convert to sorted array
      const leaderboard = Object.entries(modelScores)
        .map(([model, stats]) => ({
          model,
          totalScore: stats.totalScore,
          gradedCount: stats.gradedCount,
          averageScore: stats.gradedCount > 0 ? (stats.totalScore / stats.gradedCount).toFixed(2) : 0
        }))
        .sort((a, b) => b.totalScore - a.totalScore);

      setModelLeaderboard(leaderboard);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }

  function handleStartScriptCheck() {
    navigate('/script');
  }

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" />
      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* Main Content */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Stats Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Scripts</p>
                <p className="text-2xl font-bold text-gray-900">{totalScripts}</p>
              </div>
            </div>
          </div>

          {/* Another Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Checks</p>
                <p className="text-2xl font-bold text-gray-900">{completedChecks}</p>
              </div>
            </div>
          </div>

          {/* Third Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Scripts</p>
                <p className="text-2xl font-bold text-gray-900">{pendingIssues}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action and Navigator Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Action Section */}
          <div className="bg-white rounded-xl p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Idiom Evaluation</h2>
            <p className="text-gray-600 mb-6">Evaluate AI model responses to Bengali idioms and grade their understanding and interpretation accuracy.</p>
            <button
              onClick={handleStartScriptCheck}
              className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 text-lg font-semibold"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Evaluation
            </button>
          </div>

          {/* Navigator Section */}
          <div className="bg-white rounded-xl p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Script Navigator</h2>
            <p className="text-gray-600 mb-6">Review completed scripts and their grades. Check the model responses and have a laugh</p>
            <button
              onClick={() => navigate('/navigator')}
              className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 text-lg font-semibold"
            >
              <Eye className="w-5 h-5 mr-2" />
              Open Navigator
            </button>
          </div>
        </div>

        {/* Model Leaderboard */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 mt-8">
          <div className="flex items-center mb-4">
            <Trophy className="w-6 h-6 text-yellow-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Model Leaderboard</h2>
          </div>
          <p className="text-gray-600 mb-6">AI model performance based on cumulative grades across all evaluated scripts.</p>
          
          {modelLeaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Model</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Total Score</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Evaluations</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {modelLeaderboard.map((model, index) => (
                    <tr key={model.model} className="hover:bg-gray-50 border-b border-gray-200">
                      <td className="px-4 py-3 text-lg font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-lg font-medium text-gray-900">
                        {model.model}
                      </td>
                      <td className="px-4 py-3 text-lg font-semibold text-green-600">
                        {model.totalScore}
                      </td>
                      <td className="px-4 py-3 text-lg text-gray-700">
                        {model.gradedCount}
                      </td>
                      <td className="px-4 py-3 text-lg text-gray-700">
                        {((parseFloat(model.averageScore) / 5) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No model evaluations available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
