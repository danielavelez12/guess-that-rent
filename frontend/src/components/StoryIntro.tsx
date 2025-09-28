import React, { useState, useEffect, useCallback } from 'react';
import './StoryIntro.css';
import useDeviceDetection from '../hooks/useDeviceDetection';

interface StoryIntroProps {
  onStoryComplete: () => void;
}

const StoryIntro: React.FC<StoryIntroProps> = ({ onStoryComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const { isMobile } = useDeviceDetection();

  const storyLines = [
    "It's 2050.",
    "",
    "AI real estate agents have taken over NYC.",
    "They're overcharging renters with ruthless algorithms.",
    "",
    "Families can't afford homes.",
    "The city is in crisis.",
    "",
    "Your mission: prove humans can price apartments better than AI.",
    "",
    "Can you beat Claude and OpenAI at their own game?"
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

    // If current line is blank, show it immediately without delay
    const currentLine = storyLines[currentLineIndex];
    const isBlankLine = currentLine === "";
    const delay = isBlankLine ? 0 : lineSpeed;

    const timer = setTimeout(showNextLine, delay);
    return () => clearTimeout(timer);
  }, [currentLineIndex, storyLines, lineSpeed]);

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
              <div className={`terminal-text ${isMobile ? 'mobile-segment' : ''}`}>
                {(() => {
                  if (isMobile) {
                    const end = Math.min(currentLineIndex, storyLines.length);
                    let start = 0;
                    for (let i = end - 1; i >= 0; i--) {
                      if (storyLines[i] === '') { start = i + 1; break; }
                    }
                    const lines = storyLines.slice(start, end);
                    return lines.map((line, index) => (
                      <div key={index} className="terminal-line">
                        {line}
                      </div>
                    ));
                  }
                  return displayedText.split('\n').map((line, index) => (
                  <div key={index} className="terminal-line">
                    {line}
                  </div>
                  ));
                })()}
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
      
      {/* Mobile floating control button */}
      <button 
        className={`mobile-control-button ${
          currentLineIndex >= storyLines.length ? '' : 'skip'
        }`}
        onClick={currentLineIndex >= storyLines.length ? onStoryComplete : skipStory}
        aria-label={currentLineIndex >= storyLines.length ? 'Start Mission' : 'Skip Story'}
      >
        {currentLineIndex >= storyLines.length ? '▶' : '⏭'}
      </button>
    </div>
  );
};

export default StoryIntro;
