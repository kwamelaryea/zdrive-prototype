import React from 'react';

interface LivepeerProviderProps {
  children: React.ReactNode;
}

// Simplified provider - Livepeer React SDK will be configured per component
export const LivepeerProvider: React.FC<LivepeerProviderProps> = ({ children }) => {
  return (
    <>{children}</>
  );
};

export default LivepeerProvider;