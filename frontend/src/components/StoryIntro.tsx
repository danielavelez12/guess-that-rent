import React, { useState, useEffect, useCallback } from 'react';
import './StoryIntro.css';

interface StoryIntroProps {
  onStoryComplete: () => void;
}

const StoryIntro: React.FC<StoryIntroProps> = ({ onStoryComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  const storyLines = [
    "Welcome, Agent...",
    "",
    "The year is 2024. The housing market has gone completely insane.",
    "",
    "Rents are through the roof, and nobody knows what anything costs anymore.",
    "",
    "Your mission: Use your skills to guess the rental prices",
    "of mysterious properties across the city.",
    "",
    "Can you crack the code of today's rental market?",
    "",
    "Press ENTER to begin your mission..."
  ];

  const typingSpeed = 50; // milliseconds per character

  const skipStory = useCallback(() => {
    const fullText = storyLines.join('\n');
    setDisplayedText(fullText);
    setCurrentLineIndex(storyLines.length);
  }, [storyLines]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && currentLineIndex >= storyLines.length) {
      onStoryComplete();
    } else if (e.key === ' ' || e.key === 'Escape') {
      skipStory();
    }
  }, [currentLineIndex, storyLines.length, onStoryComplete, skipStory]);

  useEffect(() => {
    const typeText = () => {
      if (currentLineIndex < storyLines.length) {
        const currentLine = storyLines[currentLineIndex];
        
        if (currentCharIndex < currentLine.length) {
          // Type next character
          setDisplayedText(prev => prev + currentLine[currentCharIndex]);
          setCurrentCharIndex(prev => prev + 1);
        } else {
          // Line complete, move to next line
          setDisplayedText(prev => prev + '\n');
          setCurrentLineIndex(prev => prev + 1);
          setCurrentCharIndex(0);
        }
      }
    };

    const timer = setTimeout(typeText, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentCharIndex, currentLineIndex, storyLines]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className="story-intro">
      <div className="game-console">
        <div className="console-header">
          <div className="console-title">RENT DETECTIVE CONSOLE</div>
          <div className="console-status">STATUS: INITIALIZING...</div>
        </div>
        
        <div className="console-screen">
          <div className="screen-border">
            <div className="screen-content">
              <div className="terminal-text">
                {displayedText.split('\n').map((line, index) => (
                  <div key={index} className="terminal-line">
                    {line}
                    {index === displayedText.split('\n').length - 1 && 
                     currentLineIndex < storyLines.length && (
                      <span className="cursor">█</span>
                    )}
                  </div>
                ))}
              </div>
              
              {currentLineIndex >= storyLines.length && (
                <div className="continue-prompt">
                  <span className="blink">▶ PRESS ENTER TO CONTINUE ◀</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="console-controls">
          <div className="control-section">
            <div className="control-label">CONTROLS</div>
            <div className="control-buttons">
              <button className="control-btn" onClick={skipStory}>
                SKIP [SPACE]
              </button>
              {currentLineIndex >= storyLines.length && (
                <button className="control-btn primary" onClick={onStoryComplete}>
                  START MISSION [ENTER]
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryIntro;
