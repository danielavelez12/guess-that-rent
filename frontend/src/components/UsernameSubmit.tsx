import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface UsernameSubmitProps {
  avgError: number;
  onSubmitted: (username: string) => void;
}

const UsernameSubmit: React.FC<UsernameSubmitProps> = ({ avgError, onSubmitted }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    if (!vv) return;
    const handleResize = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      if (inputRef.current && document.activeElement === inputRef.current) {
        inputRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    };
    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);
    handleResize();
    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
    };
  }, []);

  const handleSubmit = async () => {
    if (!usernameInput.trim()) return;
    try {
      setError(null);
      setSubmitting(true);
      const apiUrl = process.env.REACT_APP_API_URL;
      const created = await axios.post(`${apiUrl}/users`, { username: usernameInput.trim() });
      const userId: string = created.data.id;
      await axios.post(`${apiUrl}/scores`, { user_id: userId, score_value: Math.max(0, 100 - Math.round(avgError)) });
      onSubmitted(usernameInput.trim());
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          (err instanceof Error ? err.message : 'Failed to submit score'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="username-cta" style={{ paddingBottom: 16 }}>
      <div className="username-title">Enter your username to view the leaderboard.</div>
      <div className="username-form">
        <input
          type="text"
          className="username-input"
          placeholder="Enter username"
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          disabled={submitting}
          onFocus={() => {
            setTimeout(() => {
              if (inputRef.current) inputRef.current.scrollIntoView({ block: 'center' });
            }, 50);
          }}
          maxLength={24}
          ref={inputRef}
        />
        <button
          className="username-submit"
          disabled={submitting || !usernameInput.trim()}
          onClick={handleSubmit}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
      {error && <div className="username-error">{error}</div>}
    </div>
  );
};

export default UsernameSubmit;
