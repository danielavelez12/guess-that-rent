import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ScoreItem, ScoreTodayResponse } from '../types';
import './Leaderboard.css';

interface LeaderboardProps {
  highlightUsername?: string;
  refreshSignal?: number;
}

interface EnhancedScoreItem extends ScoreItem {
  displayRank: number;
  isAI: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ highlightUsername, refreshSignal }) => {
  const [scores, setScores] = useState<EnhancedScoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
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
    fetchScores();
  }, [refreshSignal]);

  if (loading) {
    return (
      <div className="leaderboard">
        <div className="leaderboard-header">THIS WEEK'S LEADERBOARD</div>
        <div className="leaderboard-body">
          <div className="leaderboard-loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard">
        <div className="leaderboard-header">THIS WEEK'S LEADERBOARD</div>
        <div className="leaderboard-body">
          <div className="leaderboard-error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">TODAY'S LEADERBOARD</div>
      <div className="leaderboard-body">
        {scores.length === 0 ? (
          <div className="leaderboard-empty">No scores yet today</div>
        ) : (
          <ol className="leaderboard-list">
            {scores.map((s, idx) => (
              <li
                key={s.id}
                className={`leaderboard-item ${highlightUsername && s.username === highlightUsername ? 'highlight' : ''} ${s.isAI ? 'ai-player' : 'human-player'}`}
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
    </div>
  );
};

export default Leaderboard;
