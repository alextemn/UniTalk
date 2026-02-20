import { useState } from 'react';
import QuestionDetail from '../../sections/QuestionDetail.jsx';
import Questions from '../../sections/Questions.jsx';
import '../../styles/dashboard.css';
import '../../styles/components.css';

export default function PracticeInterviewPage() {
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  if (selectedQuestion) {
    return (
      <QuestionDetail 
        question={selectedQuestion} 
        onBack={() => setSelectedQuestion(null)} 
      />
    );
  }

  return (
    <div className="practice-interview-page">
      <Questions onSelectQuestion={setSelectedQuestion} />
    </div>
  );
}
