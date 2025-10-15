import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Play, Eye, Trophy, Users, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import Header from '../components/Header';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [totalScripts, setTotalScripts] = useState(0);
  const [completedChecks, setCompletedChecks] = useState(0);
  const [pendingIssues, setPendingIssues] = useState(0);
  const [modelLeaderboard, setModelLeaderboard] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [contributorLeaderboard, setContributorLeaderboard] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = fetchStats();
      return unsubscribe; // Cleanup listener on unmount
    }
  }, [currentUser]);

  function fetchStats() {
    // Set up real-time listener for both stats and leaderboard
    const unsubscribe = onSnapshot(collection(db, "pilot"), (snapshot) => {
      const total = snapshot.size;
      setTotalScripts(total);

      let done = 0;
      const modelScores = {};
      const activeUsersMap = {};
      const contributorStats = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const docId = doc.id;
        
        // Debug: log document structure for first few docs
        if (snapshot.docs.indexOf(doc) < 3) {
          console.log('Document data:', data);
        }
        
        // Count completed scripts
        if (data.status === "done") done++;
        
        // Track contributors (completed scripts)
        if (data.status === "done" && data.completedBy) {
          const username = data.completedBy.split('@')[0];
          if (!contributorStats[username]) {
            contributorStats[username] = {
              totalCompleted: 0,
              completedAt: []
            };
          }
          contributorStats[username].totalCompleted += 1;
          if (data.completedAt) {
            contributorStats[username].completedAt.push(data.completedAt.toDate());
          }
        }
        
        // Track active users (any locked documents)
        if (data.lock && data.lock.state === true && data.lock.user) {
          if (!activeUsersMap[data.lock.user]) {
            activeUsersMap[data.lock.user] = [];
          }
          activeUsersMap[data.lock.user].push({
            docId: docId,
            lockedAt: data.lock.time,
            status: data.status,
            idiom: data.idiom || 'Idiom not available'
          });
        }
        
        // Calculate model scores
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

      const pending = total - done;
      setCompletedChecks(done);
      setPendingIssues(pending);

      // Convert active users map to array
      const activeUsersArray = Object.entries(activeUsersMap).map(([user, documents]) => ({
        user,
        documents: documents.sort((a, b) => b.lockedAt?.toMillis() - a.lockedAt?.toMillis()) // Most recent first
      }));
      setActiveUsers(activeUsersArray);

      // Convert to sorted leaderboard array
      const leaderboard = Object.entries(modelScores)
        .map(([model, stats]) => ({
          model,
          totalScore: stats.totalScore,
          gradedCount: stats.gradedCount,
          averageScore: stats.gradedCount > 0 ? (stats.totalScore / stats.gradedCount).toFixed(2) : 0
        }))
        .sort((a, b) => b.totalScore - a.totalScore);

      setModelLeaderboard(leaderboard);

      // Convert contributor stats to sorted leaderboard
      const contributorBoard = Object.entries(contributorStats)
        .map(([username, stats]) => ({
          username,
          totalCompleted: stats.totalCompleted,
          completedAt: stats.completedAt.sort((a, b) => a - b) // Sort timestamps
        }))
        .sort((a, b) => b.totalCompleted - a.totalCompleted);

      setContributorLeaderboard(contributorBoard);
    });

    // Return cleanup function
    return unsubscribe;
  }

  function handleStartScriptCheck() {
    navigate('/script');
  }

  function generateHourlyProgressData(completedTimestamps) {
    if (!completedTimestamps || completedTimestamps.length === 0) return [];

    // Get the date range
    const sortedTimestamps = completedTimestamps.sort((a, b) => a - b);
    const startDate = new Date(sortedTimestamps[0]);
    const endDate = new Date(sortedTimestamps[sortedTimestamps.length - 1]);
    
    // Create hourly buckets from start to end
    const hourlyData = [];
    const current = new Date(startDate);
    current.setMinutes(0, 0, 0); // Start of hour
    
    while (current <= endDate) {
      const hourStart = new Date(current);
      const hourEnd = new Date(current);
      hourEnd.setHours(hourEnd.getHours() + 1);
      
      const completionsInHour = completedTimestamps.filter(
        timestamp => timestamp >= hourStart && timestamp < hourEnd
      ).length;
      
      hourlyData.push({
        hour: hourStart.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          hour12: true 
        }),
        completions: completionsInHour,
        cumulative: hourlyData.length > 0 ? hourlyData[hourlyData.length - 1].cumulative + completionsInHour : completionsInHour
      });
      
      current.setHours(current.getHours() + 1);
    }
    
    return hourlyData;
  }

  async function copyLeaderboardToClipboard() {
    try {
      const leaderboardData = {
        timestamp: new Date().toISOString(),
        totalModels: modelLeaderboard.length,
        models: modelLeaderboard.map((model, index) => ({
          rank: index + 1,
          name: model.model,
          totalScore: model.totalScore,
          maxPossibleScore: model.gradedCount * 5,
          evaluationsCount: model.gradedCount,
          averageScore: parseFloat(model.averageScore),
          percentage: parseFloat(((parseFloat(model.averageScore) / 5) * 100).toFixed(1))
        }))
      };

      await navigator.clipboard.writeText(JSON.stringify(leaderboardData, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy leaderboard:', err);
      alert('Failed to copy leaderboard data to clipboard');
    }
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

        {/* Contributor Ranks Section */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 mt-8">
          <div className="flex items-center mb-4">
            <Trophy className="w-6 h-6 text-purple-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Contributor Ranks</h2>
          </div>
          <p className="text-gray-600 mb-6">Top contributors based on completed idiom evaluations.</p>
          
          {contributorLeaderboard.length > 0 ? (
            <div className="space-y-4">
              {contributorLeaderboard.map((contributor, index) => (
                <div key={contributor.username} className="border border-gray-200 rounded-lg">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedUser(expandedUser === contributor.username ? null : contributor.username)}
                  >
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-500 mr-4">#{index + 1}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{contributor.username}</h3>
                        <p className="text-sm text-gray-600">{contributor.totalCompleted} evaluations completed</p>
                      </div>
                    </div>
                    {expandedUser === contributor.username ? 
                      <ChevronDown className="w-5 h-5 text-gray-500" /> : 
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    }
                  </div>
                  
                  {expandedUser === contributor.username && (
                    <div className="px-4 pb-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Hour-by-Hour Progress</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={generateHourlyProgressData(contributor.completedAt)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="hour" 
                                tick={{ fontSize: 12 }}
                                interval="preserveStartEnd"
                              />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip 
                                labelFormatter={(label) => `Time: ${label}`}
                                formatter={(value, name) => [
                                  name === 'completions' ? `${value} completions` : `${value} total`,
                                  name === 'completions' ? 'Hourly' : 'Cumulative'
                                ]}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="cumulative" 
                                stackId="1" 
                                stroke="#8b5cf6" 
                                fill="#8b5cf6" 
                                fillOpacity={0.6}
                                name="cumulative"
                              />
                              <Area 
                                type="monotone" 
                                dataKey="completions" 
                                stackId="2" 
                                stroke="#06b6d4" 
                                fill="#06b6d4" 
                                fillOpacity={0.8}
                                name="completions"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Blue area shows hourly completions, Purple area shows cumulative progress over time
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No completed evaluations yet.</p>
          )}
        </div>

        {/* Active Users Section */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 mt-8">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Active Evaluators</h2>
          </div>
          <p className="text-gray-600 mb-6">Users currently working on idiom evaluation scripts.</p>
          
          {activeUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeUsers.map((activeUser) => (
                <div key={activeUser.user} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{activeUser.user.split('@')[0]}</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 font-medium">Working on:</p>
                    {activeUser.documents.map((doc, index) => (
                      <div key={index} className="bg-gray-50 rounded p-3">
                        <div className="flex items-center justify-between mb-1">
                          {/* <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            doc.status === 'done' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {doc.status === 'done' ? 'Completed' : 'In Progress'}
                          </span> */}
                          {doc.lockedAt && (
                            <span className="text-xs text-gray-500">
                              {Math.floor((Date.now() - doc.lockedAt.toMillis()) / (1000 * 60))}m ago
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2" title={doc.idiom}>
                          {doc.idiom}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No active evaluators at the moment.</p>
          )}
        </div>

        {/* Model Leaderboard */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Trophy className="w-6 h-6 text-yellow-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Model Leaderboard</h2>
            </div>
            {modelLeaderboard.length > 0 && (
              <button
                onClick={copyLeaderboardToClipboard}
                className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 text-sm font-medium"
                title="Copy leaderboard data as JSON"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copySuccess ? 'Copied!' : 'Copy JSON'}
              </button>
            )}
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
                        {model.totalScore} / {(model.gradedCount * 5) || 0}
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
