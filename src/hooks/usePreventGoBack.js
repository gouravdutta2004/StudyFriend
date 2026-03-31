import { useEffect, useState } from 'react';

export const usePreventGoBack = (onBackAttempt) => {
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      if (onBackAttempt) {
        onBackAttempt();
      }
      setShowExitModal(true);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onBackAttempt]);

  return { showExitModal, setShowExitModal };
};
