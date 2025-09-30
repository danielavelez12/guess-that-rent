import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ScoreItem, ScoreTodayResponse } from '../types';
import './LeaderboardWithOverlay.css';

interface LeaderboardWithOverlayProps {
  avgError: number;
  onSubmitted: (username: string) => void;
  userScore: number; // The user's accuracy score
  beatAI: boolean; // Whether the user beat the AI
}

interface EnhancedScoreItem extends ScoreItem {
  displayRank: number;
  isAI: boolean;
}

const LeaderboardWithOverlay: React.FC<LeaderboardWithOverlayProps> = ({
  avgError,
  onSubmitted,
  userScore,
  beatAI
}) => {
  const [scores, setScores] = useState<EnhancedScoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [submittedUsername, setSubmittedUsername] = useState<string | null>(null);

  // Username submission state
  const [usernameInput, setUsernameInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL;
      const { data } = await axios.get<ScoreTodayResponse>(`${apiUrl}/scores/week`);

      // Sort scores by score_value descending
      const sorted = [...data.scores].sort((a, b) => b.score_value - a.score_value);

      // Add rank information and type indicator
      const rankedScores = sorted.map((score, index) => {
        const aiModels = ['Sonnet 4', 'Gemini 2.5 Flash', 'GPT 5'];
        const isAI = aiModels.some(model => score.username.includes(model));

        return {
          ...score,
          displayRank: index + 1,
          isAI
        };
      });

      setScores(rankedScores);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  // Mobile viewport handling for input focus
  useEffect(() => {
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    if (!vv) return;
    const handleResize = () => {
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

  const handleUsernameSubmit = async () => {
    if (!usernameInput.trim()) return;
    try {
      setUsernameError(null);
      setSubmitting(true);
      const apiUrl = process.env.REACT_APP_API_URL;
      const created = await axios.post(`${apiUrl}/users`, { username: usernameInput.trim() });
      const userId: string = created.data.id;
      await axios.post(`${apiUrl}/scores`, {
        user_id: userId,
        score_value: Math.max(0, 100 - Math.round(avgError))
      });

      setSubmittedUsername(usernameInput.trim());
      setShowOverlay(false);

      // Refresh the leaderboard to show the new score
      await fetchScores();

      onSubmitted(usernameInput.trim());
    } catch (err: any) {
      setUsernameError(
        err?.response?.data?.detail ||
          (err instanceof Error ? err.message : 'Failed to submit score'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderLeaderboard = () => {
    if (loading) {
      return (
        <div className="leaderboard-body">
          <div className="leaderboard-loading">Loading...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="leaderboard-body">
          <div className="leaderboard-error">{error}</div>
        </div>
      );
    }

    return (
      <div className="leaderboard-body">
        {scores.length === 0 ? (
          <div className="leaderboard-empty">No scores yet this week</div>
        ) : (
          <ol className="leaderboard-list">
            {scores.map((s) => (
              <li
                key={s.id}
                className={`leaderboard-item ${submittedUsername && s.username === submittedUsername ? 'highlight' : ''} ${s.isAI ? 'ai-player' : 'human-player'}`}
              >
                <span className="rank">#{s.displayRank}</span>
                <span className="name">
                  {s.isAI ? '🤖 ' : ''}{s.username}
                </span>
                <span className="value">{s.score_value}% accuracy</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    );
  };

  return (
    <div className="leaderboard-container">
      {/* Main leaderboard (blurred when overlay is shown) */}
      <div className={`leaderboard ${showOverlay ? 'blurred' : ''}`}>
        <div className="leaderboard-header">THIS WEEK'S LEADERBOARD</div>
        {renderLeaderboard()}
      </div>

      {/* Username submission overlay */}
      {showOverlay && (
        <div className="leaderboard-overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <div className="complete-icon">{beatAI ? "🔥" : "😢"}</div>
              <h2 className="result-title">
                {beatAI ? "YOU BEAT THE BOT" : "YOU DID NOT BEAT THE BOT"}
              </h2>
            </div>

            <div className="final-stats">
              <div className="stat-row">
                <span className="stat-label">YOUR ACCURACY:</span>
                <span className="stat-value">{userScore.toFixed(1)}%</span>
              </div>
            </div>

            <div className="username-submission">
              <div className="username-title">Enter your username to view the leaderboard</div>
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
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUsernameSubmit();
                    }
                  }}
                />
                <button
                  className="username-submit"
                  disabled={submitting || !usernameInput.trim()}
                  onClick={handleUsernameSubmit}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
              {usernameError && <div className="username-error">{usernameError}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default LeaderboardWithOverlay;