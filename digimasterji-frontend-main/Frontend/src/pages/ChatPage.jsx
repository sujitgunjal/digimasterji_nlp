import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useChatService } from '../hooks/useChatService';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useProfile } from '../hooks/useProfile';
import { 
  Send, 
  Mic, 
  Square, 
  Sparkles, 
  Plus, 
  MessageSquare, 
  Volume2, 
  Flame, 
  Award, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Trash2, 
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Clock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  '⚡ Explain Newton\'s Third Law with real-world examples',
  '🌱 How does photosynthesis convert sunlight to glucose?',
  '🧬 Why do cells divide and what is mitosis?',
  '🪐 Explain why the planets orbit the Sun',
  '🧪 What is the difference between an acid and a base?',
];

export const ChatPage = () => {
  const { activeProfile, deactivateProfile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    conversations,
    activeConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSendingMessage,
    isTyping,
    error,
    fetchConversations,
    createConversation,
    selectConversation,
    sendMessage,
    sendVoiceMessage,
    deleteConversation,
    clearError,
  } = useChatService();

  const {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    cancelRecording,
    clearAudioBlob,
  } = useAudioRecorder();

  const [inputMessage, setInputMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Start a quiz-review chat when arriving from the results screen.
  useEffect(() => {
    const prompt = location.state?.reviewPrompt;
    const pid = activeProfile?._id || activeProfile?.id;
    if (!prompt || !pid) return;

    const key = `quiz-review-sent:${location.state?.quizId || 'latest'}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    const reviewTopic = location.state?.topic || 'Quiz review';
    navigate('/chat', { replace: true, state: null });
    sendMessage(prompt, pid, { forceNew: true, topic: reviewTopic });
  }, [location.state, activeProfile, navigate, sendMessage]);

  // Load conversations on mount
  useEffect(() => {
    if (activeProfile?._id || activeProfile?.id) {
      const pid = activeProfile._id || activeProfile.id;
      fetchConversations(pid);
    }
  }, [activeProfile, fetchConversations]);

  // Handle Voice Recording Submission
  useEffect(() => {
    if (audioBlob && activeConversation) {
      sendVoiceMessage(audioBlob);
      clearAudioBlob();
    }
  }, [audioBlob, activeConversation, sendVoiceMessage, clearAudioBlob]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isSendingMessage) return;

    const text = inputMessage.trim();
    setInputMessage('');

    if (!activeConversation) {
      // Create session first then send
      const pid = activeProfile?._id || activeProfile?.id;
      const newSession = await createConversation(pid, text.slice(0, 30));
      if (newSession) {
        await sendMessage(text, newSession._id || newSession.id);
      }
    } else {
      await sendMessage(text);
    }
  };

  const handleStartNewChat = async () => {
    const pid = activeProfile?._id || activeProfile?.id;
    await createConversation(pid, 'New Chat');
  };

  const handlePromptChipClick = async (prompt) => {
    setInputMessage(prompt);
  };

  const handleSpeechSynthesis = (text, msgId) => {
    if ('speechSynthesis' in window) {
      if (playingAudioId === msgId) {
        window.speechSynthesis.cancel();
        setPlayingAudioId(null);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);

      setPlayingAudioId(msgId);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 md:hidden"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/25">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight bg-gradient-to-r from-violet-400 to-indigo-200 bg-clip-text text-transparent hidden sm:inline">
              DigiMasterJi
            </span>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link
            to="/quiz"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/30 hover:bg-violet-500/20 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quizzes</span>
          </Link>

          <Link
            to="/progress"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Progress</span>
          </Link>

          {/* Active Profile Info */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-sm font-bold text-violet-200">
              {activeProfile?.avatar || (activeProfile?.name ? activeProfile.name[0].toUpperCase() : 'S')}
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-semibold text-white leading-tight">{activeProfile?.name || 'Student'}</p>
              <p className="text-slate-400">Class {activeProfile?.grade || '6-10'}</p>
            </div>

            <Link
              to="/profiles"
              onClick={deactivateProfile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Switch Profile"
            >
              <Users className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar for Conversations History */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-0'
          } md:translate-x-0 md:w-72 bg-slate-900/60 border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col shrink-0 absolute md:relative h-full z-10`}
        >
          {/* New Chat Button */}
          <div className="p-4 border-b border-slate-800/80">
            <button
              onClick={handleStartNewChat}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-violet-600/25 flex items-center justify-center space-x-2 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>New AI Tutor Chat</span>
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recent Chats
            </div>

            {isLoadingConversations ? (
              <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                <span>Loading sessions...</span>
              </div>
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conv) => {
                const convId = conv._id || conv.id;
                const isActive = activeConversation && (activeConversation._id === convId || activeConversation.id === convId);
                return (
                  <div
                    key={convId}
                    onClick={() => selectConversation(conv)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <MessageSquare className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-violet-400" />
                      <span className="truncate">{conv.title || 'Untitled Session'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <span>No chats yet. Start a new lesson above!</span>
              </div>
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <section className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {/* Active Chat Header */}
          <div className="h-12 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-900/30 shrink-0">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-semibold text-slate-200">
                {activeConversation?.title || 'Interactive AI Science Tutor'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Ollama + ChromaDB Vernacular RAG
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages && messages.length > 0 ? (
              messages.map((msg, i) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg._id || msg.id || i}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                          : 'bg-slate-900 border border-slate-800 text-slate-200'
                      }`}
                    >
                      {!isUser && (
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-xs text-violet-400 font-semibold">
                          <div className="flex items-center space-x-1.5">
                            <GraduationCap className="w-4 h-4" />
                            <span>DigiMasterJi AI</span>
                          </div>
                          <button
                            onClick={() => handleSpeechSynthesis(msg.content, msg._id || i)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-violet-300 transition-colors"
                            title="Listen to response"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {/* RAG References */}
                      {msg.rag_references && msg.rag_references.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs text-slate-400">
                          <span className="font-semibold text-violet-400">Sources: </span>
                          {msg.rag_references.map((ref, idx) => (
                            <span key={idx} className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 mr-1 text-[11px]">
                              {typeof ref === 'string' ? ref : ref.source || 'NCERT Textbook'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              /* Welcome Screen with suggestions */
              <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto p-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-violet-500/25 mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Namaste {activeProfile?.name || 'Student'}! How can I help you learn today?
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mb-6">
                  Ask any question from Physics, Chemistry, Biology, or Math in your preferred language.
                </p>

                <div className="w-full space-y-2">
                  {SUGGESTIONS.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePromptChipClick(sug.substring(2))}
                      className="w-full text-left p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/40 text-xs sm:text-sm text-slate-300 hover:text-white transition-all duration-200"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-400 flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  <span>DigiMasterJi is thinking & fetching textbook context...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Bar */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/60 backdrop-blur-md">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center space-x-2">
              {/* Mic Voice Record Button */}
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-600/30 animate-pulse flex items-center space-x-2 shrink-0"
                  title="Stop recording"
                >
                  <Square className="w-5 h-5 fill-current" />
                  <span className="text-xs font-bold">{recordingTime}s</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-violet-400 rounded-xl border border-slate-700 transition-colors shrink-0"
                  title="Speak your question"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}

              {/* Text Input */}
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isRecording ? 'Listening to voice...' : 'Ask DigiMasterJi a science question...'}
                disabled={isRecording || isSendingMessage}
                className="flex-1 px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputMessage.trim() || isSendingMessage || isRecording}
                className="p-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-md shadow-violet-600/25 transition-all shrink-0"
              >
                {isSendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};
