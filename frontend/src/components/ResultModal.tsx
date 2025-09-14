import React, { useEffect, useState, useCallback } from 'react';
import './ResultModal.css';

interface GuessResult {
  userGuess: number;
  actualRent: number;
  difference: number;
  percentageDiff: number;
  isCorrect: boolean;
}

interface ResultModalProps {
  result: GuessResult;
  onNext: () => void;
  isLastProperty: boolean;
}

const ResultModal: React.FC<ResultModalProps> = ({ result, onNext, isLastProperty }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showMainResult, setShowMainResult] = useState(false);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onNext();
    }
  }, [onNext]);

  useEffect(() => {
    // Two-step animation: first emoji+title, then everything else
    const timers = [
      setTimeout(() => setShowMainResult(true), 200),  // Show emoji and title
      setTimeout(() => setShowDetails(true), 400),     // Show comparison and details
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const getResultTitle = () => {
    if (result.isCorrect) return "PERFECT MATCH!";
    if (result.percentageDiff <= 10) return "EXCELLENT ANALYSIS!";
    if (result.percentageDiff <= 25) return "GOOD ESTIMATION!";
    if (result.percentageDiff <= 50) return "NEEDS IMPROVEMENT";
    return "ANALYSIS FAILED";
  };

  const getResultEmoji = () => {
    if (result.isCorrect) return "🎯";
    if (result.percentageDiff <= 10) return "🔥";
    if (result.percentageDiff <= 25) return "👍";
    if (result.percentageDiff <= 50) return "⚠️";
    return "❌";
  };

  const getAccuracyRating = () => {
    if (result.isCorrect) return "SSS";
    if (result.percentageDiff <= 5) return "S+";
    if (result.percentageDiff <= 10) return "S";
    if (result.percentageDiff <= 15) return "A+";
    if (result.percentageDiff <= 25) return "A";
    if (result.percentageDiff <= 35) return "B";
    if (result.percentageDiff <= 50) return "C";
    return "D";
  };

  return (
    <div className="result-modal-overlay">
      <div className="result-console">

        <div className="result-screen">
          <div className="screen-content">
            {/* Main Result Display */}
            <div className={`result-main ${showMainResult ? 'show' : ''}`}>
              <div className="result-emoji">{getResultEmoji()}</div>
              <h2 className="result-title">{getResultTitle()}</h2>
            </div>

            {/* Comparison Display and Detailed Stats - shown together in second stage */}
            {showDetails && (
              <>
                <div className="result-comparison show">
                  <div className="comparison-grid">
                    <div className="comparison-item your-guess">
                      <div className="item-label">YOUR ANALYSIS</div>
                      <div className="item-value">${result.userGuess.toLocaleString()}</div>
                    </div>

                    <div className="vs-divider">VS</div>

                    <div className="comparison-item actual-rent">
                      <div className="item-label">ACTUAL RENT</div>
                      <div className="item-value">${result.actualRent.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="result-details show">
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-label">DIFFERENCE</div>
                      <div className="stat-value difference">
                        ${result.difference.toLocaleString()}
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-label">ERROR RATE</div>
                      <div className="stat-value error-rate">
                        {result.percentageDiff}%
                      </div>
                    </div>

                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="result-controls">
          <div className="controls-info">
            <span className="control-hint">Press ENTER or SPACE to continue</span>
          </div>
          <button className="continue-btn" onClick={onNext}>
            {isLastProperty ? 'COMPLETE MISSION' : 'NEXT PROPERTY'} →
          </button>
        </div>

      </div>
    </div>
  );
};

export default ResultModal;
