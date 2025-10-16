import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, BookOpen, Globe, BarChart, ArrowRight, LogIn, UserPlus, Star, Target, Brain, Database } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

function Home() {
  const [modelLeaderboard, setModelLeaderboard] = useState([]);
  const [totalScripts, setTotalScripts] = useState(0);
  const [completedChecks, setCompletedChecks] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  function fetchStats() {
    // Set up real-time listener for leaderboard
    const unsubscribe = onSnapshot(collection(db, "pilot"), (snapshot) => {
      const total = snapshot.size;
      setTotalScripts(total);

      let done = 0;
      const modelScores = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Count completed scripts
        if (data.status === "done") done++;
        
        // Calculate model scores
        if (data.predictions && Array.isArray(data.predictions)) {
          data.predictions.forEach(prediction => {
            if (prediction.model) {
              if (!modelScores[prediction.model]) {
                modelScores[prediction.model] = {
                  totalScore: 0,
                  gradedCount: 0
                };
              }

              // Check if grade exists and is not null
              if (prediction.grade !== undefined && prediction.grade !== null) {
                modelScores[prediction.model].totalScore += prediction.grade;
                modelScores[prediction.model].gradedCount += 1;
              }
            }
          });
        }
      });

      setCompletedChecks(done);

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
    });

    // Return cleanup function
    return unsubscribe;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">বাগধারা</h1>
              <span className="ml-3 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Pilot Project</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="inline-flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Join Research
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              বাগধারা<span className="text-indigo-600">_</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-4xl mx-auto">
              A Comprehensive Computational Corpus of Bangla Idioms for Figurative Language Processing
            </p>
            <p className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto">
              Advancing AI understanding of Bengali idioms through collaborative human evaluation and computational linguistics research
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/signup" 
                className="inline-flex items-center px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors duration-200 text-lg"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Join the Research
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link 
                to="/login" 
                className="inline-flex items-center px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border border-gray-300 transition-colors duration-200 text-lg"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Existing Contributor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">10,361</h3>
              <p className="text-gray-600">Unique Bengali Idioms</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{completedChecks}</h3>
              <p className="text-gray-600">Evaluations Completed</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{modelLeaderboard.length}</h3>
              <p className="text-gray-600">AI Models Evaluated</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">About the Initiative</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Addressing a critical gap in NLP resources for Bengali figurative language
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Mission</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-100 rounded-lg p-2">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Preserving Cultural Heritage</h4>
                    <p className="text-gray-600">Transforming Bengali idioms from intangible linguistic heritage into structured, machine-interpretable knowledge bases for future generations.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 rounded-lg p-2">
                    <Brain className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Advancing AI Understanding</h4>
                    <p className="text-gray-600">Enabling Large Language Models to master figurative semantics, pragmatic contexts, and cultural worldviews encoded within idiomatic expressions.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 rounded-lg p-2">
                    <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Cross-Cultural Research</h4>
                    <p className="text-gray-600">Facilitating comparative analysis across diverse socio-geographic contexts and temporal depths spanning three centuries of linguistic evolution.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Why Your Contribution Matters</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-yellow-300" />
                  <p>Help improve AI understanding of Bengali language nuances</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-yellow-300" />
                  <p>Contribute to important computational linguistics research</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-yellow-300" />
                  <p>Preserve cultural heritage for future generations</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-yellow-300" />
                  <p>Join a community of language enthusiasts and researchers</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-sm opacity-90">
                  <strong>Your expertise matters:</strong> As a human evaluator, you provide the cultural and contextual understanding that machines are still learning to grasp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Leaderboard Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Live AI Model Performance</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real-time rankings of how well different AI models understand Bengali idioms, based on human evaluations
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-800">Current Model Leaderboard</h3>
              </div>
              <p className="text-center text-gray-600 mt-2">Based on {completedChecks} completed evaluations</p>
            </div>
            
            {modelLeaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">Rank</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">AI Model</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">Total Score</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">Evaluations</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelLeaderboard.slice(0, 10).map((model, index) => (
                      <tr key={model.model} className="hover:bg-gray-50 border-b border-gray-200 transition-colors duration-150">
                        <td className="px-6 py-4 text-lg font-bold text-gray-900">
                          <div className="flex items-center">
                            {index < 3 && (
                              <div className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center text-white text-sm font-bold ${
                                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                              }`}>
                                {index + 1}
                              </div>
                            )}
                            {index >= 3 && <span className="mr-8">{index + 1}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-lg font-medium text-gray-900">
                          {model.model}
                        </td>
                        <td className="px-6 py-4 text-lg font-semibold text-green-600">
                          {model.totalScore} / {(model.gradedCount * 5) || 0}
                        </td>
                        <td className="px-6 py-4 text-lg text-gray-700">
                          {model.gradedCount}
                        </td>
                        <td className="px-6 py-4 text-lg">
                          <div className="flex items-center">
                            <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${((parseFloat(model.averageScore) / 5) * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-700 font-medium">
                              {((parseFloat(model.averageScore) / 5) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Evaluations in progress... Check back soon!</p>
              </div>
            )}
            
            {modelLeaderboard.length > 10 && (
              <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-200">
                <p className="text-gray-600">
                  Showing top 10 models. <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">Sign in</Link> to see complete rankings.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Contribute?</h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of contributors helping AI understand Bengali idioms. Your cultural knowledge makes the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup" 
              className="inline-flex items-center px-8 py-4 bg-white hover:bg-gray-100 text-indigo-600 font-bold rounded-lg transition-colors duration-200 text-lg"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Start Contributing Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link 
              to="/login" 
              className="inline-flex items-center px-8 py-4 bg-transparent hover:bg-white/10 text-white font-bold rounded-lg border-2 border-white transition-colors duration-200 text-lg"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Continue Your Work
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">বাগধারা_</h3>
              <p className="text-gray-400 mb-4">
                A computational corpus for Bengali idiom research, bridging cultural heritage with artificial intelligence.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Research Goals</h4>
              <ul className="space-y-2 text-gray-400">
                <li>• Figurative Language Processing</li>
                <li>• Cross-Cultural AI Understanding</li>
                <li>• Digital Heritage Preservation</li>
                <li>• Computational Linguistics</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Get Involved</h4>
              <div className="space-y-3">
                <Link to="/signup" className="block text-indigo-400 hover:text-indigo-300 transition-colors duration-200">
                  Join as Evaluator
                </Link>
                <Link to="/login" className="block text-indigo-400 hover:text-indigo-300 transition-colors duration-200">
                  Contributor Login
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Bagdhara Pilot Project. Contributing to the future of Bengali AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
