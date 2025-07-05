import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string;
  isLoading?: boolean;
  loadingText?: string;
  highContrast?: boolean;
  children: React.ReactNode;
}

export function AccessibleButton({
  ariaLabel,
  isLoading = false,
  loadingText = 'Loading...',
  highContrast = false,
  className,
  children,
  disabled,
  ...props
}: AccessibleButtonProps) {
  return (
    <Button
      {...props}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      className={cn(
        // Base accessibility styles
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500',
        'transition-all duration-200',
        // High contrast mode
        highContrast && [
          'border-2 border-black text-black bg-white',
          'hover:bg-black hover:text-white',
          'disabled:bg-gray-300 disabled:text-gray-700 disabled:border-gray-400'
        ],
        className
      )}
      onKeyDown={(e) => {
        // Enhanced keyboard navigation
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!disabled && !isLoading) {
            props.onClick?.(e as any);
          }
        }
      }}
    >
      <span className={cn(
        'flex items-center justify-center gap-2',
        isLoading && 'opacity-70'
      )}>
        {isLoading ? (
          <>
            <div 
              className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"
              aria-hidden="true"
            />
            <span className="sr-only">{loadingText}</span>
            {loadingText}
          </>
        ) : (
          children
        )}
      </span>
    </Button>
  );
}

// Screen reader announcements hook
export function useScreenReaderAnnouncement() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return { announce };
}