import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  isAddressModalOpen: boolean;
  setIsAddressModalOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const value: UIContextType = {
    isAddressModalOpen,
    setIsAddressModalOpen,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export const useUIContext = (): UIContextType => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
};