import React, { useState } from 'react';
import axios from 'axios';

interface UsernameSubmitProps {
  avgError: number;
  onSubmitted: (username: string) => void;
}

const UsernameSubmit: React.FC<UsernameSubmitProps> = ({ avgError, onSubmitted }) => {
  const [usernameInput, setUsernameInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!usernameInput.trim()) return;
    try {
      setError(null);
      setSubmitting(true);
      const apiUrl = process.env.REACT_APP_API_URL;
      const created = await axios.post(`${apiUrl}/users`, { username: usernameInput.trim() });
      const userId: string = created.data.id;
      await axios.post(`${apiUrl}/scores`, { user_id: userId, score_value: Math.round(avgError) });
      onSubmitted(usernameInput.trim());
    } catch (err: any) {
      setError(err?.response?.data?.detail || (err instanceof Error ? err.message : 'Failed to submit score'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="username-cta">
      <div className="username-title">Enter your username to view the leaderboard.</div>
      <div className="username-form">
        <input
          type="text"
          className="username-input"
          placeholder="Enter username"
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          disabled={submitting}
          maxLength={24}
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


