import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import Header from '../components/Header';
import { FileText, ChevronLeft, ChevronRight, Info, MessageSquare, ClipboardList, CheckCircle, Lightbulb, Heart, Tag, Bot, AlertTriangle } from 'lucide-react';

function Script() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [scriptData, setScriptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPredictionIndex, setCurrentPredictionIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const handleSubmitScript = async () => {
    if (!scriptData || !scriptData.predictions) return;
    
    // Check if all predictions are graded
    const allGraded = scriptData.predictions.every(pred => pred.grade !== undefined);
    
    if (!allGraded) {
      alert('Please grade all model responses before submitting.');
      return;
    }

    try {
      const docRef = doc(db, 'pilot', scriptData.id.toString());
      await updateDoc(docRef, {
        status: 'done',
        'lock.state': false,
        'lock.user': null,
        'lock.time': null,
        completedBy: currentUser.email,
        completedAt: serverTimestamp()
      });

      // Fetch next script
      setCurrentPredictionIndex(0); // Reset to first prediction
      await fetchScript();
    } catch (err) {
      console.error('Error submitting script:', err);
      alert('Failed to submit script. Please try again.');
    }
  };

  const goToNextPrediction = () => {
    setCurrentPredictionIndex(prev => 
      Math.min((scriptData.predictions?.length || 1) - 1, prev + 1)
    );
  };

  const handleGradeUpdate = (index, grade) => {
    setScriptData(prev => ({
      ...prev,
      predictions: prev.predictions.map((pred, i) => 
        i === index ? { ...pred, grade } : pred
      )
    }));
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchScript();
  }, [currentUser, navigate]);

  async function fetchScript() {
    try {
      setLoading(true);
      setError('');

      const expiredTime = new Date(Date.now() - 40 * 60 * 1000); // 40 minutes ago

      // First, get count of completed scripts
      const completedQuery = query(
        collection(db, 'pilot'),
        orderBy('__name__')
      );
      
      const completedSnapshot = await getDocs(completedQuery);
      const completedCount = completedSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.status === 'done';
      }).length;
      
      setCompletedCount(completedCount);

      // Query all scripts, limit to 20 for efficiency
      const q = query(
        collection(db, 'pilot'),
        orderBy('__name__'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      let scriptDoc = null;

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();

        // Skip if status exists and is not 'pending'
        if (data.status && data.status !== 'pending') {
          continue;
        }

        const lock = data.lock;

        // Check if unlocked
        if (!lock || lock.state === false) {
          scriptDoc = docSnap;
          break;
        }

        // Check if locked by current user
        if (lock.state === true && lock.user === currentUser.email) {
          scriptDoc = docSnap;
          break;
        }

        // Check if lock expired
        if (lock.state === true && lock.time) {
          const lockTime = lock.time.toDate();
          if (lockTime < expiredTime) {
            // Expired, can take it
            scriptDoc = docSnap;
            break;
          }
        }
      }

      if (scriptDoc) {
        // Lock the document
        const scriptRef = doc(db, 'pilot', scriptDoc.id);
        await updateDoc(scriptRef, {
          'lock.state': true,
          'lock.user': currentUser.email,
          'lock.time': serverTimestamp()
        });

        setScriptData({ id: scriptDoc.id, ...scriptDoc.data() });
      } else {
        setError('No pending scripts available at this time.');
      }
    } catch (err) {
      console.error('Error fetching script:', err);
      setError('Failed to load script. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading script...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-lg">
      <Header title="খাতা দেখা" showBackButton={true} backTo="/dashboard" />
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
          ) : scriptData ? (
            <div className="bg-transparent md:bg-white rounded-none md:rounded-xl p-0 md:p-8 border-0 md:border md:border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center hidden md:flex">
                  <Info className="w-6 h-6 text-gray-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Script Details</h2>
                </div>
                <div className="w-full md:w-2/5 border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-around">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm font-medium text-gray-700">Done: {completedCount}</span>
                    </div>
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mr-1" />
                      <span className="text-sm font-medium text-gray-700">Pending: {100 - completedCount}</span>
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-blue-600 mr-1" />
                      <span className="text-sm font-medium text-gray-700">Total: 100</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Idiom Details */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-transparent p-2 rounded-lg">
                    <h3 className="text-2xl md:text-4xl font-bold text-blue-900 leading-tight text-center md:text-left">{scriptData.idiom}</h3>
                    {/* <p className="text-base text-gray-700 italic font-medium">{scriptData.literal_meaning}</p> */}
                  </div>

                  <div>
                  <div className="flex items-center mb-1 hidden md:flex">
                    <Lightbulb className="w-5 h-5 text-gray-600 mr-2" />
                    <h4 className="text-lg font-medium text-gray-700">Figurative Meaning</h4>
                  </div>
                    <p className="text-gray-800 mt-1"><strong>Bengali:</strong> {scriptData.figurative_meaning_bn}</p>
                    <p className="text-gray-800"><strong>English:</strong> {scriptData.figurative_meaning_en}</p>
                  </div>

                  <div className="hidden md:block">
                    <div className="flex items-center mb-1">
                      <Heart className="w-5 h-5 text-gray-600 mr-2" />
                      <h4 className="text-lg font-medium text-gray-700">Sentiment</h4>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      scriptData.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                      scriptData.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {scriptData.sentiment}
                    </span>
                  </div>

                  <div className="hidden md:block">
                    <div className="flex items-center mb-1">
                      <Tag className="w-5 h-5 text-gray-600 mr-2" />
                      <h4 className="text-lg font-medium text-gray-700">Tags</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {scriptData.tags?.map((tag, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 hidden lg:block">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-gray-600 mr-2" />
                      <h4 className="text-lg font-medium text-gray-700">Complete Script Review</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Once you've graded all {scriptData.predictions?.length || 0} model responses, submit this script to mark it as complete and move to the next one.
                    </p>
                    <button
                      onClick={handleSubmitScript}
                      disabled={!scriptData.predictions?.every(pred => pred.grade !== undefined)}
                      className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
                    >
                      {scriptData.predictions?.every(pred => pred.grade !== undefined) 
                        ? 'Submit & Move to Next Script' 
                        : `Grade ${scriptData.predictions?.filter(pred => pred.grade === undefined).length || 0} more responses`
                      }
                    </button>
                  </div>
                </div>

                {/* Right Column: Model Responses */}
                <div className="lg:col-span-2 space-y-6">
                  <hr className="mb-6 border-gray-300 lg:hidden" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MessageSquare className="w-6 h-6 text-gray-600 mr-3" />
                      <h3 className="text-xl font-semibold text-gray-800">Model Responses</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPredictionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentPredictionIndex === 0}
                        className="flex items-center p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded hover:bg-gray-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPredictionIndex(prev => Math.min((scriptData.predictions?.length || 1) - 1, prev + 1))}
                        disabled={currentPredictionIndex >= (scriptData.predictions?.length || 0) - 1}
                        className="flex items-center p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded hover:bg-gray-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-4 hidden md:flex">
                      <button
                        onClick={() => setCurrentPredictionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentPredictionIndex === 0}
                        className="flex items-center px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        {currentPredictionIndex + 1} of {scriptData.predictions?.length || 0}
                      </span>
                      <button
                        onClick={() => setCurrentPredictionIndex(prev => Math.min((scriptData.predictions?.length || 1) - 1, prev + 1))}
                        disabled={currentPredictionIndex >= (scriptData.predictions?.length || 0) - 1}
                        className="flex items-center px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                  {scriptData.predictions && scriptData.predictions[currentPredictionIndex] && (
                    <ModelResponse
                      prediction={scriptData.predictions[currentPredictionIndex]}
                      index={currentPredictionIndex}
                      total={scriptData.predictions?.length || 0}
                      docId={scriptData.id}
                      onNext={goToNextPrediction}
                      onGradeUpdate={handleGradeUpdate}
                    />
                  )}

                  {/* Mobile Submit Button */}
                  <div className="pt-4 lg:hidden">
                    <hr className="mb-4 border-gray-300" />
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-gray-600 mr-2" />
                      <h4 className="text-lg font-medium text-gray-700">Complete Script Review</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Once you've graded all {scriptData.predictions?.length || 0} model responses, submit this script to mark it as complete and move to the next one.
                    </p>
                    <button
                      onClick={handleSubmitScript}
                      disabled={!scriptData.predictions?.every(pred => pred.grade !== undefined)}
                      className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
                    >
                      {scriptData.predictions?.every(pred => pred.grade !== undefined) 
                        ? 'Submit & Move to Next Script' 
                        : `Grade ${scriptData.predictions?.filter(pred => pred.grade === undefined).length || 0} more responses`
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Marks Sheet Card */}
          {scriptData && scriptData.predictions && (
            <div className="bg-white rounded-xl p-8 border border-gray-200 mt-8 hidden md:block">
              <div className="flex items-center mb-6">
                <ClipboardList className="w-6 h-6 text-gray-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-800">Grading Progress</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="w-1/4 px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Model</th>
                      <th className="w-3/5 px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Response</th>
                      <th className="w-[15%] px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scriptData.predictions.map((pred, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 border-b border-gray-200">
                        <td className="px-4 py-3 text-lg font-medium text-gray-900">
                          {pred.model}
                        </td>
                        <td className="px-4 py-3 text-lg text-gray-700 whitespace-pre-wrap break-words">
                          {pred.prediction}
                        </td>
                        <td className="px-4 py-3 text-lg">
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

export default Script;

function ModelResponse({ prediction, index, total, docId, onNext, onGradeUpdate }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(null);

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only handle keyboard events for number keys 0-5 and Enter
      if (event.key >= '0' && event.key <= '5') {
        const gradeValue = parseInt(event.key);
        setSelectedGrade(gradeValue);
        event.preventDefault();
      } else if (event.key === 'Enter' && selectedGrade !== null) {
        handleSave();
        event.preventDefault();
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [selectedGrade]);

  const handleGradeSelect = (gradeNum) => {
    setSelectedGrade(gradeNum);
  };

  const handleSave = async () => {
    if (selectedGrade === null || selectedGrade < 0 || selectedGrade > 5) {
      setMessage('Please select a grade first');
      return;
    }

    // Immediately transition to next prediction for smooth UX
    const currentGrade = selectedGrade;
    onNext();
    setSelectedGrade(null); // Reset for next prediction
    setMessage(''); // Clear any previous messages

    // Save in background
    try {
      const docRef = doc(db, 'pilot', docId.toString());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentData = docSnap.data();
        const updatedPredictions = [...currentData.predictions];
        updatedPredictions[index] = { ...updatedPredictions[index], grade: currentGrade };

        await updateDoc(docRef, {
          predictions: updatedPredictions
        });

        // Update local state
        onGradeUpdate(index, currentGrade);

        // Optional: Show brief success feedback (could be removed for even smoother UX)
        setTimeout(() => {
          setMessage('Grade saved successfully!');
          setTimeout(() => setMessage(''), 1500);
        }, 100);
      }
    } catch (err) {
      console.error('Error saving grade:', err);
      // Show error message briefly, but don't block the flow
      setTimeout(() => {
        setMessage('Failed to save grade. Please try again.');
        setTimeout(() => setMessage(''), 3000);
      }, 100);
    }
  };

  const handleRemoveGrade = async () => {
    // Immediately update UI for smooth UX
    onGradeUpdate(index, undefined);
    setMessage('Grade removed successfully!');
    setSelectedGrade(null);
    setTimeout(() => setMessage(''), 2000);

    // Remove in background
    try {
      const docRef = doc(db, 'pilot', docId.toString());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentData = docSnap.data();
        const updatedPredictions = [...currentData.predictions];
        const updatedPrediction = { ...updatedPredictions[index] };
        delete updatedPrediction.grade;
        updatedPredictions[index] = updatedPrediction;

        await updateDoc(docRef, {
          predictions: updatedPredictions
        });
      }
    } catch (err) {
      console.error('Error removing grade:', err);
      // Show error message briefly
      setTimeout(() => {
        setMessage('Failed to remove grade. Please try again.');
        setTimeout(() => setMessage(''), 3000);
      }, 100);
    }
  };

  return (
    <div className="border-0 md:border md:border-gray-200 rounded-none md:rounded-lg p-0 md:p-6 bg-transparent md:bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Bot className="w-5 h-5 text-blue-600 mr-2" />
          <h4 className="font-semibold text-blue-700 text-lg">{prediction.model}</h4>
        </div>
        <span className="text-sm text-gray-500">{index + 1}/{total}</span>
      </div>
      <div className="mb-6">
        <p className="text-gray-900 text-lg md:text-2xl leading-relaxed whitespace-pre-wrap font-medium">
          {prediction.prediction}
        </p>
      </div>
      {prediction.grade !== undefined && (
        <p className="text-base text-blue-600 mb-4">Current Grade: {prediction.grade}/5</p>
      )}
      <div className="mb-4">
        <p className="text-base text-gray-700 mb-2">Rate this response:</p>
        <div className="flex space-x-2 mb-3">
          {[0, 1, 2, 3, 4, 5].map((gradeValue) => (
            <button
              key={gradeValue}
              onClick={() => handleGradeSelect(gradeValue)}
              className={`px-4 py-2 rounded text-base font-medium transition-colors duration-200 ${
                selectedGrade === gradeValue
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              {gradeValue}
            </button>
          ))}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            disabled={selectedGrade === null}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-base rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Grade
          </button>
          {prediction.grade !== undefined && (
            <button
              onClick={handleRemoveGrade}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-base rounded"
            >
              Remove Grade
            </button>
          )}
        </div>
      </div>
      {message && <p className="text-base mt-3 text-green-600">{message}</p>}
    </div>
  );
}
