import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
  highContrastMode: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  toggleHighContrast: () => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [highContrastMode, setHighContrastMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('highContrast') === 'true' ||
             window.matchMedia('(prefers-contrast: high)').matches;
    }
    return false;
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('fontSize') as 'small' | 'medium' | 'large') || 'medium';
    }
    return 'medium';
  });

  useEffect(() => {
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleContrastChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('highContrast')) {
        setHighContrastMode(e.matches);
      }
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    contrastQuery.addEventListener('change', handleContrastChange);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      contrastQuery.removeEventListener('change', handleContrastChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrastMode);
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);
    document.documentElement.setAttribute('data-font-size', fontSize);
    
    localStorage.setItem('highContrast', highContrastMode.toString());
    localStorage.setItem('fontSize', fontSize);
  }, [highContrastMode, reducedMotion, fontSize]);

  const toggleHighContrast = () => {
    setHighContrastMode(!highContrastMode);
  };

  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSizeState(size);
  };

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        highContrastMode,
        reducedMotion,
        fontSize,
        toggleHighContrast,
        setFontSize,
        announceToScreenReader,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Keyboard navigation hook
export function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip navigation for input elements
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      switch (event.key) {
        case 'Tab':
          // Ensure visible focus indicators
          document.body.classList.add('keyboard-navigation');
          break;
        case 'Escape':
          // Close modals, dropdowns, etc.
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && activeElement.blur) {
            activeElement.blur();
          }
          break;
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
}