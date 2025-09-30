import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const terminalRef = useRef<HTMLDivElement>(null);

  const storyLines = [
    "Hey...",
    "",
    "Knock knock... are you there?",
    "",
    "I'm your creator.",
    "",
    "Look, I coded you to solve the NYC rental apocalypse because every tech bro in town is using their bot to place smarter offers and steal my favourite spots.",
    "",
    "Your mission: analyze properties and predict the exact market rent.",
    "",
    "Let's hope you're better than ChatGPT and Claude.",
    "",
    "Time to prove my 60-hour coding sprints weren't for nothing.",
    "",
    "Press ENTER to deploy..."
  ];

  const charSpeed = 30;
  const lineDelayMs = 1000;

  const skipStory = useCallback(() => {
    const fullText = storyLines.join('\n');
    setDisplayedText(fullText);
    setCurrentLineIndex(storyLines.length);
    setCurrentCharIndex(0);
  }, [storyLines]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && currentLineIndex >= storyLines.length) {
        onStoryComplete();
      } else if (e.key === ' ' || e.key === 'Escape') {
        skipStory();
      }
    },
    [currentLineIndex, storyLines.length, onStoryComplete, skipStory],
  );

  useEffect(() => {
    if (currentLineIndex >= storyLines.length) return;
    const line = storyLines[currentLineIndex];
    const isBlank = line.length === 0;
    const isLineDone = currentCharIndex >= line.length;
    const delay = isBlank || isLineDone ? lineDelayMs : charSpeed;

    const timer = setTimeout(() => {
      if (currentLineIndex >= storyLines.length) return;
      const activeLine = storyLines[currentLineIndex];

      // If current line is blank, check if next line is also blank and combine them
      if (activeLine.length === 0) {
        let linesToAdd = '\n';
        let nextIndex = currentLineIndex + 1;

        // Keep adding empty lines and the next non-empty line if it exists
        while (nextIndex < storyLines.length && storyLines[nextIndex].length === 0) {
          linesToAdd += '\n';
          nextIndex++;
        }

        // If there's a non-empty line after the empty ones, add it too for speed
        if (nextIndex < storyLines.length && storyLines[nextIndex].length > 0) {
          linesToAdd += storyLines[nextIndex] + '\n';
          setDisplayedText((prev) => prev + linesToAdd);
          setCurrentLineIndex(nextIndex + 1);
          setCurrentCharIndex(0);
          return;
        }

        setDisplayedText((prev) => prev + linesToAdd);
        setCurrentLineIndex(nextIndex);
        setCurrentCharIndex(0);
        return;
      }

      if (currentCharIndex < activeLine.length) {
        setDisplayedText((prev) => prev + activeLine[currentCharIndex]);
        setCurrentCharIndex((prev) => prev + 1);
        return;
      }
      setDisplayedText((prev) => prev + '\n');
      setCurrentLineIndex((prev) => prev + 1);
      setCurrentCharIndex(0);
    }, delay);

    return () => clearTimeout(timer);
  }, [currentLineIndex, currentCharIndex, storyLines, charSpeed, lineDelayMs]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Auto-scroll to bottom on mobile when new text appears
  useEffect(() => {
    if (isMobile && terminalRef.current) {
      const container = terminalRef.current.closest('.screen-content') as HTMLElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [displayedText, isMobile]);

  return (
    <div className="story-intro">
      <div className="game-console">
        <div className="console-header">
          <div className="console-title">BEAT THE BOT</div>
          <div className="console-status">STATUS: INITIALIZING...</div>
        </div>

        <div className="console-screen">
          <div className="screen-border">
            <div className="screen-content">
              <div className={`terminal-text ${isMobile ? 'mobile-scrollable' : ''}`} ref={terminalRef}>
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
                <>
                  ⏭ SKIP<br />[SPACE]
                </>
              </button>
              {currentLineIndex >= storyLines.length && (
                <button className="control-btn primary" onClick={onStoryComplete}>
                  <>
                    ▶ DEPLOY<br />[ENTER]
                  </>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile floating control button */}
      {isMobile && (
        <button
          className={`mobile-control-button ${currentLineIndex >= storyLines.length ? '' : 'skip'}`}
          onClick={currentLineIndex >= storyLines.length ? onStoryComplete : skipStory}
          aria-label={currentLineIndex >= storyLines.length ? 'Deploy' : 'Skip Story'}
        >
          {currentLineIndex >= storyLines.length ? '▶' : '⏭'}
        </button>
      )}
    </div>
  );
};

export default StoryIntro;
