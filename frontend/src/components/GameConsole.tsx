import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Listing, ListingsResponse, ScoreItem, ScoreTodayResponse } from '../types';
import StoryIntro from './StoryIntro';
import GameWindow from './GameWindow';
import ResultModal from './ResultModal';
import LeaderboardWithOverlay from './LeaderboardWithOverlay';
import './GameConsole.css';

interface GuessResult {
  userGuess: number;
  actualRent: number;
  difference: number;
  percentageDiff: number;
  isCorrect: boolean;
}

enum GameState {
  STORY,
  LOADING,
  PLAYING,
  RESULT,
  COMPLETE,
  ERROR,
}

const GameConsole: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.STORY);
  const [listings, setListings] = useState<Listing[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
  const [score, setScore] = useState<number[]>([]);
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
  const [submittedUsername, setSubmittedUsername] = useState<string | null>(null);
  const [leaderboardScores, setLeaderboardScores] = useState<ScoreItem[]>([]);
  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0');
  const skipToComplete = () => setGameState(GameState.COMPLETE);

  useEffect(() => {
    const loadListings = async () => {
      try {
        setGameState(GameState.LOADING);
        const apiUrl = process.env.REACT_APP_API_URL;
        const response = await axios.get<ListingsResponse>(`${apiUrl}/listings`);
        setListings(response.data.listings);
        setGameState(GameState.PLAYING);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listings');
        setGameState(GameState.ERROR);
      }
    };

    if (gameState === GameState.LOADING) {
      loadListings();
    }
  }, [gameState]);

  const handleStoryComplete = () => {
    setGameState(GameState.LOADING);
  };

  const handleGuessSubmit = (userGuess: number) => {
    const currentListing = listings[currentIndex];
    const actualRent = currentListing.fields['Rent Price'];
    const difference = Math.abs(userGuess - actualRent);
    const percentageDiff = Math.round((difference / actualRent) * 100);

    const result: GuessResult = {
      userGuess,
      actualRent,
      difference,
      percentageDiff,
      isCorrect: difference === 0,
    };

    setGuessResult(result);
    setScore([...score, percentageDiff]);
    setGameState(GameState.RESULT);
  };

  const handleNextListing = () => {
    setGuessResult(null);

    if (currentIndex < listings.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setGameState(GameState.PLAYING);
    } else {
      setGameState(GameState.COMPLETE);
    }
  };

  // Fetch leaderboard scores when game completes
  useEffect(() => {
    if (gameState === GameState.COMPLETE) {
      fetchLeaderboardScores();
    }
  }, [gameState]);

  const resetGame = () => {
    setCurrentIndex(0);
    setGameState(GameState.STORY);
    setGuessResult(null);
    setScore([]);
    setError(null);
  };

  const getAverageAccuracy = () => {
    if (score.length === 0) return 0;
    const avgError = score.reduce((sum, error) => sum + error, 0) / score.length;
    return Math.max(0, 100 - avgError);
  };


  const fetchLeaderboardScores = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const { data } = await axios.get<ScoreTodayResponse>(`${apiUrl}/scores/today`);
      setLeaderboardScores(data.scores);
    } catch (err) {
      console.error('Failed to fetch leaderboard scores:', err);
    }
  };

  const checkIfUserBeatAI = () => {
    const userAccuracy = getAverageAccuracy();
    const aiModels = ['Sonnet 4', 'Gemini 2.5 Flash', 'GPT 5'];

    const aiScores = leaderboardScores.filter(score =>
      aiModels.some(model => score.username.includes(model))
    );

    // If no AI models found, default to "YOU BEAT THE BOT"
    if (aiScores.length === 0) return true;

    // Check if user's accuracy is higher than all AI models
    return aiScores.every(aiScore => userAccuracy > aiScore.score_value);
  };

  // Render based on game state
  switch (gameState) {
    case GameState.STORY:
      return (
        <>
          <StoryIntro onStoryComplete={handleStoryComplete} />
          {isLocal && (
            <button className="dev-skip-btn" onClick={skipToComplete}>
              Skip to Leaderboard
            </button>
          )}
        </>
      );

    case GameState.LOADING:
      return (
        <>
          <div className="game-console-loading">
            <div className="loading-console">
              <div className="loading-header">
                <div className="loading-title">BEAT THE BOT</div>
                <div className="loading-status">INITIALIZING...</div>
              </div>
              <div className="loading-screen">
                <div className="loading-content">
                  <div className="loading-spinner"></div>
                  <div className="loading-text">
                    CONNECTING TO DATABASE...
                    <br />
                    LOADING PROPERTY DATA...
                    <br />
                    CALIBRATING SENSORS...
                  </div>
                  <div className="loading-progress">
                    <div className="progress-bar"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {isLocal && (
            <button className="dev-skip-btn" onClick={skipToComplete}>
              Skip to Leaderboard
            </button>
          )}
        </>
      );

    case GameState.ERROR:
      return (
        <>
          <div className="game-console-error">
            <div className="error-console">
              <div className="error-header">
                <div className="error-title">SYSTEM ERROR</div>
                <div className="error-code">ERROR CODE: 404</div>
              </div>
              <div className="error-screen">
                <div className="error-content">
                  <div className="error-icon">⚠️</div>
                  <div className="error-message">UNABLE TO CONNECT TO PROPERTY DATABASE</div>
                  <div className="error-details">{error}</div>
                  <button className="retry-btn" onClick={resetGame}>
                    RETRY CONNECTION
                  </button>
                </div>
              </div>
            </div>
          </div>
          {isLocal && (
            <button className="dev-skip-btn" onClick={skipToComplete}>
              Skip to Leaderboard
            </button>
          )}
        </>
      );

    case GameState.PLAYING:
      if (listings.length === 0) {
        return (
          <div className="game-console-error">
            <div className="error-console">
              <div className="error-content">
                <div className="error-message">NO PROPERTIES AVAILABLE</div>
                <button className="retry-btn" onClick={resetGame}>
                  RETURN TO MENU
                </button>
              </div>
            </div>
          </div>
        );
      }

      const currentListing = listings[currentIndex];
      const photos = currentListing.fields.Photos || [];

      return (
        <>
          <div className="game-console-background">
            <GameWindow
              photos={photos}
              propertyName={currentListing.fields.Name}
              address={currentListing.fields.Address}
              bedrooms={currentListing.fields['Bedroom Count']}
              bathrooms={currentListing.fields['Bathroom Count']}
              details={currentListing.fields.Details || ''}
              currentProperty={currentIndex + 1}
              totalProperties={listings.length}
              onGuessSubmit={handleGuessSubmit}
            />
          </div>
          {isLocal && (
            <button className="dev-skip-btn" onClick={skipToComplete}>
              Skip to Leaderboard
            </button>
          )}
        </>
      );

    case GameState.RESULT:
      return (
        <>
          <div className="game-console-background">
            <GameWindow
              photos={listings[currentIndex].fields.Photos || []}
              propertyName={listings[currentIndex].fields.Name}
              address={listings[currentIndex].fields.Address}
              bedrooms={listings[currentIndex].fields['Bedroom Count']}
              bathrooms={listings[currentIndex].fields['Bathroom Count']}
              details={listings[currentIndex].fields.Details || ''}
              currentProperty={currentIndex + 1}
              totalProperties={listings.length}
              onGuessSubmit={() => {}}
              disabled={true}
            />
            {guessResult && (
              <ResultModal
                result={guessResult}
                onNext={handleNextListing}
                isLastProperty={currentIndex >= listings.length - 1}
              />
            )}
          </div>
          {isLocal && (
            <button className="dev-skip-btn" onClick={skipToComplete}>
              Skip to Leaderboard
            </button>
          )}
        </>
      );

    case GameState.COMPLETE:
      return (
        <div className="game-console-complete">
          <div className="complete-console">
            <div className="complete-header">
              <div className="complete-title">MISSION COMPLETE</div>
              <div className="complete-status">ALL PROPERTIES ANALYZED</div>
            </div>
            <div className="complete-screen">
              <div className="complete-content">
                <div style={{ width: '100%', maxWidth: 500, margin: '20px auto' }}>
                  <LeaderboardWithOverlay
                    avgError={100 - getAverageAccuracy()}
                    userScore={getAverageAccuracy()}
                    beatAI={checkIfUserBeatAI()}
                    onSubmitted={(uname) => {
                      setSubmittedUsername(uname);
                      setLeaderboardRefresh((n) => n + 1);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default GameConsole;
