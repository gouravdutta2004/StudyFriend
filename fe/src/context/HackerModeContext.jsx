import React, { createContext, useContext, useState, useEffect } from 'react';

const HackerModeContext = createContext();

export const useHackerMode = () => {
  return useContext(HackerModeContext);
};

export const HackerModeProvider = ({ children }) => {
  const [isHackerMode, setIsHackerMode] = useState(() => {
    return localStorage.getItem('hackerMode') === 'true';
  });

  const toggleHackerMode = () => {
    setIsHackerMode((prev) => {
      const nextMode = !prev;
      localStorage.setItem('hackerMode', String(nextMode));
      return nextMode;
    });
  };

  useEffect(() => {
    if (isHackerMode) {
      document.body.classList.add('hacker-mode');
    } else {
      document.body.classList.remove('hacker-mode');
    }
  }, [isHackerMode]);

  return (
    <HackerModeContext.Provider value={{ isHackerMode, toggleHackerMode }}>
      {children}
    </HackerModeContext.Provider>
  );
};
