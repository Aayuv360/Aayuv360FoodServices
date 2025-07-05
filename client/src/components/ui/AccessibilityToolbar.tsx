import { useState } from 'react';
import { Settings, Eye, Type, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAccessibility } from '@/hooks/use-accessibility';
import { cn } from '@/lib/utils';

export function AccessibilityToolbar() {
  const {
    highContrastMode,
    fontSize,
    toggleHighContrast,
    setFontSize,
    announceToScreenReader,
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    announceToScreenReader(`Font size changed to ${size}`);
  };

  const handleContrastToggle = () => {
    toggleHighContrast();
    announceToScreenReader(
      `High contrast mode ${!highContrastMode ? 'enabled' : 'disabled'}`
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              'bg-white shadow-lg border-2',
              'focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
              highContrastMode && 'border-black bg-white'
            )}
            aria-label="Open accessibility settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className={cn(
            'w-56 p-2',
            highContrastMode && 'border-2 border-black bg-white'
          )}
        >
          <DropdownMenuLabel className="text-sm font-semibold">
            Accessibility Settings
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* High Contrast Toggle */}
          <DropdownMenuItem
            onClick={handleContrastToggle}
            className={cn(
              'flex items-center gap-2 cursor-pointer',
              'focus:bg-orange-100 focus:outline-none',
              highContrastMode && 'border border-black'
            )}
          >
            <Eye className="h-4 w-4" />
            <span>High Contrast</span>
            <span className={cn(
              'ml-auto text-xs px-2 py-1 rounded',
              highContrastMode 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            )}>
              {highContrastMode ? 'ON' : 'OFF'}
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          {/* Font Size Options */}
          <DropdownMenuLabel className="text-xs text-gray-500">
            Font Size
          </DropdownMenuLabel>
          
          {(['small', 'medium', 'large'] as const).map((size) => (
            <DropdownMenuItem
              key={size}
              onClick={() => handleFontSizeChange(size)}
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                'focus:bg-orange-100 focus:outline-none',
                fontSize === size && 'bg-orange-50',
                highContrastMode && fontSize === size && 'border border-black'
              )}
            >
              <Type className="h-4 w-4" />
              <span className="capitalize">{size}</span>
              {fontSize === size && (
                <span className="ml-auto text-xs text-orange-600">✓</span>
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          
          {/* Screen Reader Test */}
          <DropdownMenuItem
            onClick={() => announceToScreenReader('Accessibility toolbar test announcement')}
            className={cn(
              'flex items-center gap-2 cursor-pointer',
              'focus:bg-orange-100 focus:outline-none',
              highContrastMode && 'border border-black'
            )}
          >
            <Volume2 className="h-4 w-4" />
            <span>Test Screen Reader</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Skip to main content link
export function SkipToMainContent() {
  return (
    <a
      href="#main-content"
      className="skip-to-main"
      onFocus={(e) => {
        // Ensure the link is visible when focused
        e.target.style.top = '6px';
      }}
      onBlur={(e) => {
        e.target.style.top = '-40px';
      }}
    >
      Skip to main content
    </a>
  );
}