import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import Header from '../components/Header';
import {
  Info,
  Lightbulb,
  Heart,
  Tag,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  User
} from 'lucide-react';

function Navigator() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [scripts, setScripts] = useState([]);
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  const [currentPredictionIndex, setCurrentPredictionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentScript = scripts[currentScriptIndex];

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else {
      fetchScripts();
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!currentScript) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) {
          goToNextScript();
        } else {
          setCurrentPredictionIndex(prev => Math.min((currentScript.predictions?.length || 1) - 1, prev + 1));
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) {
          goToPrevScript();
        } else {
          setCurrentPredictionIndex(prev => Math.max(0, prev - 1));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScript, currentScriptIndex, currentPredictionIndex, scripts]);

  async function fetchScripts() {
    try {
      setLoading(true);
      const q = query(collection(db, "pilot"), where("status", "==", "done"), orderBy("__name__", "desc"));
      const snapshot = await getDocs(q);
      const fetchedScripts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setScripts(fetchedScripts);
      if (fetchedScripts.length === 0) {
        setError('No completed scripts available for review.');
      }
    } catch (err) {
      console.error("Error fetching scripts:", err);
      setError('Failed to load scripts.');
    } finally {
      setLoading(false);
    }
  }

  const goToNextScript = () => {
    if (currentScriptIndex < scripts.length - 1) {
      setCurrentScriptIndex(prev => prev + 1);
      setCurrentPredictionIndex(0);
    }
  };

  const goToPrevScript = () => {
    if (currentScriptIndex > 0) {
      setCurrentScriptIndex(prev => prev - 1);
      setCurrentPredictionIndex(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen text-lg">
        <Header title="Script Navigator" showBackButton={true} backTo="/dashboard" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading scripts...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-lg">
      <Header title="Script Navigator" showBackButton={true} backTo="/dashboard" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {error ? (
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">No Scripts Available</h2>
                <p className="text-gray-600">{error}</p>
              </div>
            </div>
          ) : currentScript ? (
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Info className="w-6 h-6 text-gray-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Script Details</h2>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={goToPrevScript}
                    disabled={currentScriptIndex === 0}
                    className="flex items-center px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 md:mr-1" />
                    <span className="hidden md:inline">Previous Script</span>
                  </button>
                  <span className="text-sm text-gray-600">
                    Script {currentScriptIndex + 1} of {scripts.length}
                  </span>
                  <button
                    onClick={goToNextScript}
                    disabled={currentScriptIndex >= scripts.length - 1}
                    className="flex items-center px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="hidden md:inline">Next Script</span>
                    <ChevronRight className="w-4 h-4 md:ml-1" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <h3 className="text-2xl md:text-3xl font-bold text-blue-900 mb-3 leading-tight">{currentScript.idiom}</h3>
                    <p className="text-base text-gray-700 italic font-medium">{currentScript.literal_meaning}</p>
                  </div>

                  <div>
                    <div className="flex items-center mb-1">
                      <Lightbulb className="w-5 h-5 text-gray-600 mr-2" />
                      <h4 className="text-lg font-medium text-gray-700">Figurative Meaning</h4>
                    </div>
                    <p className="text-gray-800"><strong>English:</strong> {currentScript.figurative_meaning_en}</p>
                    <p className="text-gray-800 mt-1"><strong>Bengali:</strong> {currentScript.figurative_meaning_bn}</p>
                  </div>

                  <div>
                    <div className="flex items-center mb-1">
                      <Heart className="w-5 h-5 text-gray-600 mr-2" />
                      <h4 className="text-lg font-medium text-gray-700">Sentiment</h4>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      currentScript.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                      currentScript.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {currentScript.sentiment}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center mb-1">
                      <Tag className="w-5 h-5 text-gray-600 mr-2" />
                      <h4 className="text-lg font-medium text-gray-700">Tags</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentScript.tags?.map((tag, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MessageSquare className="w-6 h-6 text-gray-600 mr-3" />
                      <h3 className="text-xl font-semibold text-gray-800">Model Responses</h3>
                    </div>
                    <span className="text-sm text-gray-600">
                      {currentPredictionIndex + 1} of {currentScript.predictions?.length || 0}
                    </span>
                  </div>
                  {currentScript.predictions && currentScript.predictions[currentPredictionIndex] && (
                    <>
                      <NavigatorResponse
                        prediction={currentScript.predictions[currentPredictionIndex]}
                        index={currentPredictionIndex}
                      />
                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <User className="w-5 h-5 text-gray-600 mr-2" />
                          <h4 className="text-lg font-medium text-gray-700">Evaluated By</h4>
                        </div>
                        <p className="text-gray-800">{currentScript.completedBy}</p>
                        <p className="text-gray-600 text-sm">
                          {currentScript.completedAt ? new Date(currentScript.completedAt.toDate()).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center justify-center space-x-4 mt-6">
                        <button
                          onClick={() => setCurrentPredictionIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentPredictionIndex === 0}
                          className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-5 h-5 mr-2" />
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPredictionIndex(prev => Math.min((currentScript.predictions?.length || 1) - 1, prev + 1))}
                          disabled={currentPredictionIndex >= (currentScript.predictions?.length || 0) - 1}
                          className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {currentScript && currentScript.predictions && (
            <div className="bg-white rounded-xl p-8 border border-gray-200 mt-8 hidden md:block">
              <div className="flex items-center mb-6">
                <ClipboardList className="w-6 h-6 text-gray-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-800">Grading Overview</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="">
                      <th className="w-1/4 px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Model</th>
                      <th className="w-3/5 px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Response</th>
                      <th className="w-[15%] px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentScript.predictions.map((pred, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 border-b border-gray-200">
                        <td className="px-4 py-3 text-base md:text-lg font-medium text-gray-900">
                          {pred.model}
                        </td>
                        <td className="px-4 py-3 text-base md:text-lg text-gray-700 whitespace-pre-wrap break-words">
                          {pred.prediction}
                        </td>
                        <td className="px-4 py-3 text-base md:text-lg">
                          {pred.grade !== undefined ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {pred.grade}/5
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">Not graded</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NavigatorResponse({ prediction, index }) {
  return (
    <div className="rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base md:text-lg font-semibold text-gray-800">{prediction.model}</h4>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          Grade: {prediction.grade !== undefined ? `${prediction.grade}/5` : 'Not graded'}
        </span>
      </div>
      <div className="bg-white mt-6">
        <p className="text-base md:text-lg text-gray-800 whitespace-pre-wrap break-words">{prediction.prediction}</p>
      </div>
    </div>
  );
}

export default Navigator;
