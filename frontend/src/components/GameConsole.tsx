import axios from "axios";
import React, { useEffect, useState } from "react";
import { Listing, ListingsResponse } from "../types";
import StoryIntro from "./StoryIntro";
import GameWindow from "./GameWindow";
import ResultModal from "./ResultModal";
import Leaderboard from "./Leaderboard";
import "./GameConsole.css";

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
  ERROR
}

const GameConsole: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.STORY);
  const [listings, setListings] = useState<Listing[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
  const [score, setScore] = useState<number[]>([]);
  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0'
  );
  const skipToComplete = () => setGameState(GameState.COMPLETE);

  useEffect(() => {
    const loadListings = async () => {
      try {
        setGameState(GameState.LOADING);
        const apiUrl = process.env.REACT_APP_API_URL;
        const response = await axios.get<ListingsResponse>(
          `${apiUrl}/listings`
        );
        setListings(response.data.listings);
        setGameState(GameState.PLAYING);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load listings"
        );
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
    const actualRent = currentListing.fields["Rent Price"];
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

  const getOverallGrade = () => {
    const accuracy = getAverageAccuracy();
    if (accuracy >= 90) return "S";
    if (accuracy >= 80) return "A";
    if (accuracy >= 70) return "B";
    if (accuracy >= 60) return "C";
    if (accuracy >= 50) return "D";
    return "F";
  };

  // Render based on game state
  switch (gameState) {
    case GameState.STORY:
      return <>
        <StoryIntro onStoryComplete={handleStoryComplete} />
        {isLocal && (
          <button className="dev-skip-btn" onClick={skipToComplete}>Skip to Leaderboard</button>
        )}
      </>;

    case GameState.LOADING:
      return (
        <>
        <div className="game-console-loading">
          <div className="loading-console">
            <div className="loading-header">
              <div className="loading-title">RENT DETECTIVE CONSOLE</div>
              <div className="loading-status">INITIALIZING...</div>
            </div>
            <div className="loading-screen">
              <div className="loading-content">
                <div className="loading-spinner"></div>
                <div className="loading-text">
                  CONNECTING TO DATABASE...<br/>
                  LOADING PROPERTY DATA...<br/>
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
          <button className="dev-skip-btn" onClick={skipToComplete}>Skip to Leaderboard</button>
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
                <div className="error-message">
                  UNABLE TO CONNECT TO PROPERTY DATABASE
                </div>
                <div className="error-details">
                  {error}
                </div>
                <button className="retry-btn" onClick={resetGame}>
                  RETRY CONNECTION
                </button>
              </div>
            </div>
          </div>
        </div>
        {isLocal && (
          <button className="dev-skip-btn" onClick={skipToComplete}>Skip to Leaderboard</button>
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
            bedrooms={currentListing.fields["Bedroom Count"]}
            bathrooms={currentListing.fields["Bathroom Count"]}
            details={currentListing.fields.Details || ""}
            currentProperty={currentIndex + 1}
            totalProperties={listings.length}
            onGuessSubmit={handleGuessSubmit}
          />
        </div>
        {isLocal && (
          <button className="dev-skip-btn" onClick={skipToComplete}>Skip to Leaderboard</button>
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
            bedrooms={listings[currentIndex].fields["Bedroom Count"]}
            bathrooms={listings[currentIndex].fields["Bathroom Count"]}
            details={listings[currentIndex].fields.Details || ""}
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
          <button className="dev-skip-btn" onClick={skipToComplete}>Skip to Leaderboard</button>
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
                <div className="complete-icon">🎯</div>
                <h2>RENT DETECTIVE CERTIFICATION</h2>
                
                <div className="final-stats">
                  <div className="stat-row">
                    <span className="stat-label">PROPERTIES ANALYZED:</span>
                    <span className="stat-value">{listings.length}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">AVERAGE ACCURACY:</span>
                    <span className="stat-value">{getAverageAccuracy().toFixed(1)}%</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">FINAL GRADE:</span>
                    <span className={`stat-value grade-${getOverallGrade().toLowerCase()}`}>
                      {getOverallGrade()}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 20, marginBottom: 20 }}>
                  <Leaderboard />
                </div>

                <div className="completion-message">
                  {getAverageAccuracy() >= 80
                    ? "🔥 HOLY SHIT! My neural network training actually worked! You're crushing the NYC rental market like a boss. Those 60-hour coding sprints were worth it!"
                    : getAverageAccuracy() >= 60
                    ? "💪 Not bad! You're learning the market patterns. My AI is getting smarter. Soon we'll be outbidding every crypto bro in Brooklyn!"
                    : "😤 Ugh, you're still getting schooled by trust fund kids. Back to the training data - I need to feed you more listings!"
                  }
                </div>

                <div className="completion-actions">
                  <button className="restart-btn" onClick={resetGame}>
                    START NEW MISSION
                  </button>
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
