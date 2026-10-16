import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { quizzesApi } from '../api/quizzes';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Award, 
  ArrowRight, 
  Loader2,
  AlertCircle
} from 'lucide-react';

export const QuizTakePage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [topic, setTopic] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await quizzesApi.getQuizById(quizId);
        const loaded = res.data?.questions || [];
        if (loaded.length === 0) {
          setError('This quiz has no questions.');
        }
        setQuestions(loaded);
        setTopic(res.data?.topic || '');
      } catch (err) {
        console.error('Error loading quiz:', err);
        setError(err.response?.data?.detail || 'Could not load this quiz.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleSelectOption = (questionId, optionText) => {
    if (submitted) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionText,
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await quizzesApi.submitQuiz(quizId, { answers: selectedAnswers });
      setResult(res.data);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setError(err.response?.data?.detail || 'Could not submit this quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm text-slate-300">{error}</p>
          <Link to="/quiz" className="inline-block text-sm text-violet-300">Back to quizzes</Link>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex] || {};
  const questionId = currentQ.question_id || `q${currentIndex + 1}`;
  const progressPercent = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const isAnswered = selectedAnswers[questionId] !== undefined;
  const allAnswered = questions.every((q, idx) => selectedAnswers[q.question_id || `q${idx + 1}`]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6">
      {/* Top Bar */}
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800">
        <Link
          to="/quiz"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Quiz</span>
        </Link>
        <div className="text-xs font-bold text-violet-400">
          Question {currentIndex + 1} of {questions.length}
        </div>
      </header>

      {/* Main Question Card */}
      <main className="max-w-3xl mx-auto w-full py-8 flex-1 flex flex-col justify-center">
        {/* Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-2 mb-8 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-violet-600 to-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {!submitted ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl">
            {topic && <p className="text-xs text-violet-300 mb-3">{topic}</p>}
            <h2 className="text-lg sm:text-xl font-bold text-white mb-6 leading-relaxed">
              {currentQ.question_text || currentQ.question || currentQ.text}
            </h2>

            {/* Options List */}
            <div className="space-y-3">
              {(currentQ.options || []).map((opt, optIdx) => {
                const optionText = typeof opt === 'string' ? opt : opt.text || opt.label;
                const isSelected = selectedAnswers[questionId] === optionText;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(questionId, optionText)}
                    className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? 'bg-violet-600/20 border-violet-500 text-violet-200 shadow-md shadow-violet-600/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{optionText}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="mt-4 text-xs text-rose-300">{error}</p>
            )}

            {/* Controls */}
            <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
              >
                Previous
              </button>

              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={!allAnswered || submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25 flex items-center space-x-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Submit Quiz</span>
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!isAnswered}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-600/25 flex items-center space-x-2"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Result Card */
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center max-w-md mx-auto backdrop-blur-xl shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-1">Quiz Completed!</h2>
            <p className="text-slate-400 text-xs mb-6">{topic || 'Chapter quiz complete'}</p>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 mb-6">
              <div className="text-3xl font-extrabold text-violet-400">
                {result?.correct_count ?? 0} / {result?.total_questions ?? questions.length}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Score: {result?.score ?? 0}% • +{result?.xp_earned ?? 0} XP Earned
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <Link
                to="/quiz"
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                Back to Quizzes
              </Link>
              <button
                type="button"
                onClick={() => {
                  const mistakes = (result?.feedback || []).filter((item) => !item.correct);
                  const quizTopic = topic || 'this chapter';
                  const prompt = mistakes.length
                    ? `I just finished a quiz on "${quizTopic}". Please review only the questions I got wrong. For each one, explain why my answer is wrong and why the correct answer is right, in simple language.\n\n${mistakes.map((item, index) => `${index + 1}. Question: ${item.question_text}\nMy answer: ${item.user_answer || 'Not answered'}\nCorrect answer: ${item.correct_answer}`).join('\n\n')}`
                    : `I finished a quiz on "${quizTopic}" and got every question right. Please give me a short recap of the key ideas and one harder practice question.`;
                  navigate('/chat', {
                    state: {
                      reviewPrompt: prompt,
                      quizId,
                      topic: `Review: ${quizTopic}`.slice(0, 80),
                    },
                  });
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Ask DigiMasterJi to Review Mistakes
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
