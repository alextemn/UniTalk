import AddQuestion from '../../sections/AddQuestion.jsx';
import '../../styles/components.css';

export default function AddQuestionPage() {
  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.25rem' }}>
          Add a Question
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#64748B' }}>
          Contribute a question to the practice bank for all students
        </p>
      </div>
      <AddQuestion />
    </div>
  );
}
