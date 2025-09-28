import React, { useEffect, useState } from 'react';
import './BottomSheet.css';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  /** Optional: px or vh (default: 50vh) */
  height?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  height = '50vh',
}) => {
  const [mounted, setMounted] = useState(false);
  const [animateOpen, setAnimateOpen] = useState(false);

  // Mount/unmount for smooth animation
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const id = requestAnimationFrame(() => setAnimateOpen(true));
      return () => cancelAnimationFrame(id);
    } else {
      setAnimateOpen(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return (
    <div
      className="bs-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className={`bs-panel ${animateOpen ? 'bs-up' : 'bs-down'}`}
        style={{ height }}
        role="dialog"
        aria-modal="true"
      >
        <div className="bs-handle" />
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
