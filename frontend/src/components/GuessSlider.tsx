import React, { useState, useEffect } from 'react';
import './GuessSlider.css';

interface GuessSliderProps {
  isOpen: boolean;
  onClose: () => void;
  onGuessSubmit: (guess: number) => void;
  disabled?: boolean;
}

const GuessSlider: React.FC<GuessSliderProps> = ({
  isOpen,
  onClose,
  onGuessSubmit,
  disabled = false
}) => {
  const [guess, setGuess] = useState('');
  const [mounted, setMounted] = useState(false);
  const [animateOpen, setAnimateOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setGuess('');
      const id = requestAnimationFrame(() => setAnimateOpen(true));
      return () => cancelAnimationFrame(id);
    } else {
      setAnimateOpen(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numGuess = parseInt(guess);
    if (isNaN(numGuess) || numGuess <= 0) {
      return;
    }
    onGuessSubmit(numGuess);
    setGuess('');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setGuess(value);
  };

  if (!mounted) return null;

  return (
    <div 
      className="guess-slider-backdrop"
      onClick={handleBackdropClick}
    >
      {isOpen && (
      <div className={`guess-slider ${animateOpen ? 'slide-up' : 'slide-down'}`}>
        <div className="slider-handle" />
        
        <div className="slider-header">
          <h3 className="slider-title">MONTHLY RENT ESTIMATE</h3>
          <button className="slider-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="slider-content">
          <form onSubmit={handleSubmit} className="guess-form">
            <div className="guess-input-container">
              <div className="currency-wrapper">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatCurrency(guess)}
                  onChange={handleInputChange}
                  placeholder="Enter monthly rent..."
                  disabled={disabled}
                  className="guess-input"
                  autoFocus
                />
              </div>
              
              <div className="guess-actions">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="cancel-btn"
                >
                  CANCEL
                </button>
                <button 
                  type="submit" 
                  disabled={disabled || !guess}
                  className="submit-guess-btn"
                >
                  SUBMIT GUESS
                </button>
              </div>
            </div>
          </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuessSlider;