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
    "Hey...",
    "",
    "Knock knock... are you there?",
    "",
    "I'm your creator.",
    "",
    "Look, I coded you to solve the NYC rental apocalypse because I'm tired of losing bidding wars to trust fund kids and crypto bros.",
    "",
    "Your neural networks have been trained on millions of listings.",
    "Your mission: analyze properties and predict EXACT market rent.",
    "",
    "Bid too high? You're burning through my Series A funding.",
    "Bid too low? Some influencer just snatched my dream loft.",
    "",
    "The rental market is broken, but you're going to crack it.",
    "",
    "Time to prove my 60-hour coding sprints weren't for nothing.",
    "",
    "Press ENTER to deploy..."
  ];

  const lineSpeed = 800; // milliseconds per line

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
    const showNextLine = () => {
      if (currentLineIndex < storyLines.length) {
        const currentLine = storyLines[currentLineIndex];
        // Show entire line at once
        setDisplayedText(prev => prev + currentLine + '\n');
        setCurrentLineIndex(prev => prev + 1);
      }
    };

    const timer = setTimeout(showNextLine, lineSpeed);
    return () => clearTimeout(timer);
  }, [currentLineIndex, storyLines]);

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
