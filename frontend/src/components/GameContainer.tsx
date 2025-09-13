import React, { useState, useEffect } from 'react';
import { ListingsResponse, Listing } from '../types';
import ImageCarousel from './ImageCarousel';
import './GameContainer.css';

interface GuessResult {
  userGuess: number;
  actualRent: number;
  difference: number;
  percentageDiff: number;
  isCorrect: boolean;
}

const GameContainer: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guess, setGuess] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
  const [gameComplete, setGameComplete] = useState(false);

  useEffect(() => {
    const loadListings = async () => {
      try {
        const response = await fetch('/output.json');
        if (!response.ok) {
          throw new Error('Failed to load listings');
        }
        const data: ListingsResponse = await response.json();
        setListings(data.listings);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listings');
        setLoading(false);
      }
    };

    loadListings();
  }, []);

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userGuess = parseInt(guess);
    if (isNaN(userGuess) || userGuess <= 0) {
      alert('Please enter a valid positive number');
      return;
    }

    const currentListing = listings[currentIndex];
    const actualRent = currentListing.fields['Rent Price'];
    const difference = Math.abs(userGuess - actualRent);
    const percentageDiff = Math.round((difference / actualRent) * 100);
    
    const result: GuessResult = {
      userGuess,
      actualRent,
      difference,
      percentageDiff,
      isCorrect: difference === 0
    };

    setGuessResult(result);
    setShowResult(true);
    setGuess('');
  };

  const handleNextListing = () => {
    setShowResult(false);
    setGuessResult(null);
    
    if (currentIndex < listings.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setGameComplete(true);
    }
  };

  const resetGame = () => {
    setCurrentIndex(0);
    setGameComplete(false);
    setShowResult(false);
    setGuessResult(null);
    setGuess('');
  };

  if (loading) {
    return (
      <div className="game-container">
        <div className="loading">Loading listings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (gameComplete) {
    return (
      <div className="game-container">
        <div className="game-complete">
          <h2>🎉 Game Complete!</h2>
          <p>You've guessed the rent for all {listings.length} listings!</p>
          <button onClick={resetGame} className="play-again-btn">
            Play Again
          </button>
        </div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="game-container">
        <div className="no-listings">No listings available</div>
      </div>
    );
  }

  const currentListing = listings[currentIndex];
  const photos = currentListing.fields.Photos || [];

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>Guess That Rent</h1>
        <div className="progress">
          Listing {currentIndex + 1} of {listings.length}
        </div>
      </div>

      <div className="listing-card">
        <ImageCarousel photos={photos} className="listing-carousel" />
        
        <div className="listing-details">
          <h2>{currentListing.fields.Name}</h2>
          <p className="address">{currentListing.fields.Address}</p>
          
          <div className="property-info">
            <span className="info-item">
              {currentListing.fields['Bedroom Count']} Bedrooms
            </span>
            <span className="info-item">
              {currentListing.fields['Bathroom Count']} Bathrooms
            </span>
          </div>
          
          {currentListing.fields.Details && (
            <p className="details">{currentListing.fields.Details}</p>
          )}
        </div>
      </div>

      <div className="guess-section">
        <form onSubmit={handleGuessSubmit} className="guess-form">
          <div className="input-group">
            <label htmlFor="guess">What do you think the monthly rent is?</label>
            <div className="input-wrapper">
              <span className="dollar-sign">$</span>
              <input
                type="number"
                id="guess"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Enter your guess"
                min="1"
                required
                disabled={showResult}
              />
            </div>
          </div>
          <button type="submit" disabled={showResult} className="submit-btn">
            Submit Guess
          </button>
        </form>
      </div>

      {showResult && guessResult && (
        <div className="result-modal">
          <div className="result-content">
            <h3>
              {guessResult.isCorrect ? '🎯 Perfect!' : 
               guessResult.difference < guessResult.actualRent * 0.1 ? '🔥 Close!' :
               'Not quite!'}
            </h3>
            
            <div className="result-details">
              <p>Your guess: <strong>${guessResult.userGuess.toLocaleString()}</strong></p>
              <p>Actual rent: <strong>${guessResult.actualRent.toLocaleString()}</strong></p>
              
              {!guessResult.isCorrect && (
                <p className="difference">
                  You were <strong>{guessResult.userGuess > guessResult.actualRent ? 'too high' : 'too low'}</strong> by{' '}
                  <strong>${guessResult.difference.toLocaleString()}</strong> ({guessResult.percentageDiff}% off)
                </p>
              )}
            </div>

            <button onClick={handleNextListing} className="next-btn">
              {currentIndex < listings.length - 1 ? 'Next Listing' : 'Finish Game'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameContainer;