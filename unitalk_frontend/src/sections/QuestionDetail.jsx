import { useState, useRef, useEffect } from 'react';
import api from '../api/axios.js';
import ScoreBadge from '../components/ScoreBadge.jsx';
import '../styles/components.css';
import '../styles/dashboard.css';

export default function QuestionDetail({ question, onBack, questionId }) {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [recordError, setRecordError] = useState('');
  const [questionData, setQuestionData] = useState(question);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [hasVideoStream, setHasVideoStream] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // Fetch question if questionId is provided
  useEffect(() => {
    if (questionId && !question) {
      setLoadingQuestion(true);
      api.get(`/questions/${questionId}/`)
        .then(({ data }) => {
          setQuestionData(data);
          setLoadingQuestion(false);
        })
        .catch(() => {
          setRecordError('Failed to load question.');
          setLoadingQuestion(false);
        });
    }
  }, [questionId, question]);

  // Stop recording and release resources on unmount
  useEffect(() => {
    return () => stopRecording();
  }, []);

  const currentQuestion = questionData || question;

  if (loadingQuestion) {
    return <p className="empty-state">Loading question...</p>;
  }

  if (!currentQuestion) {
    return <p className="error-message">Question not found.</p>;
  }

  async function startRecording() {
    setRecordError('');
    finalTranscriptRef.current = '';
    setAnswer('');
    setInterimText('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecordError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Request camera for self-view (mic is handled by SpeechRecognition internally)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasVideoStream(true);
        // Ensure video plays
        videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
        });
      }
    } catch (err) {
      setRecordError('Camera access was denied. Please allow camera access to use recording.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setAnswer(finalTranscriptRef.current.trim());
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      // 'no-speech' is common and non-fatal; ignore it
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setRecordError(`Microphone error: ${event.error}`);
        stopRecording();
      }
    };

    // Chrome stops recognition after ~60s of silence; auto-restart to keep recording
    recognition.onend = () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* already stopped */ }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }

  function stopRecording() {
    if (recognitionRef.current) {
      // Null the ref first so onend's auto-restart check sees null
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      rec.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsRecording(false);
    setHasVideoStream(false);
    setInterimText('');
    setAnswer(finalTranscriptRef.current.trim());
  }

  async function handleSubmit() {
    setSubmitError('');
    setSubmitLoading(true);
    try {
      const { data } = await api.post(`/questions/${currentQuestion.id}/submit-answer/`, { answer });
      setResult(data);
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Failed to submit answer.');
    } finally {
      setSubmitLoading(false);
    }
  }

  function handleTryAgain() {
    setResult(null);
    setAnswer('');
    setSubmitError('');
    finalTranscriptRef.current = '';
  }

  function parseList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value
      .split('\n')
      .map((s) => s.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);
  }


  return (
    <div className="question-detail-page">
      <button className="back-link" onClick={() => { stopRecording(); onBack(); }}>
        ← Back to Questions
      </button>

      <div className="question-card-detail">
        <span className={`badge-difficulty badge-${currentQuestion.difficulty?.toLowerCase()}`}>
          {currentQuestion.difficulty}
        </span>
        <h2 className="question-title">{currentQuestion.question}</h2>
        <div className="question-tags">
          <span className="tag">{currentQuestion.category}</span>
          <span className="tag">{currentQuestion.subcategory}</span>
        </div>
        <p className="question-track">Behavioral · Consulting Track</p>
      </div>

      {!result ? (
        <div className="practice-layout">
          <div className="practice-right practice-right-centered">
            <div className="video-card">
              <div className="video-container">
                <video 
                  ref={videoRef} 
                  className={`recorder-video ${hasVideoStream ? 'visible' : 'hidden'}`} 
                  autoPlay 
                  muted 
                  playsInline 
                />
                {!hasVideoStream && (
                  <div className="video-placeholder">
                    <div className="play-icon">▶</div>
                  </div>
                )}
              </div>
              <p className="video-hint">Record your answer or upload a video</p>
              <div className="video-actions">
                {!isRecording ? (
                  <button className="btn-record-yellow" onClick={startRecording}>
                    ▶ Record
                  </button>
                ) : (
                  <button className="btn-stop-yellow" onClick={stopRecording}>
                    ⏹ Stop
                  </button>
                )}
              </div>
              <button
                className="btn-analyze"
                disabled={submitLoading || !answer.trim() || isRecording}
                onClick={handleSubmit}
              >
                📊 Analyze (Demo)
              </button>
            </div>
            {recordError && <p className="error-message">{recordError}</p>}
            {submitError && <p className="error-message">{submitError}</p>}
          </div>
        </div>
      ) : (
        <>
          <ScoreBadge score={result.score} />
          <div className="evaluation">
            <div className="eval-col strengths">
              <h4>✓ Strengths</h4>
              <ul>
                {parseList(result.strengths).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="eval-col weaknesses">
              <h4>✗ Weaknesses</h4>
              <ul>
                {parseList(result.weaknesses).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="eval-actions">
            <button className="btn-primary" onClick={handleTryAgain}>
              Try Again
            </button>
            <button className="btn-secondary" onClick={onBack}>
              Back to Questions
            </button>
          </div>
        </>
      )}
    </div>
  );
}
