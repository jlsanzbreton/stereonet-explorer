import React, { useEffect } from 'react';

interface ViewportProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Viewport ensures the application occupies the full safe viewport height
 * across browsers (including Safari's dynamic toolbar behaviour).
 */
const Viewport: React.FC<ViewportProps> = ({ children, className }) => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const updateViewportHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty('--app-100dvh', `${height}px`);
    };

    updateViewportHeight();

    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', updateViewportHeight);
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      viewport?.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return (
    <div
      className={className}
      style={{ minHeight: 'var(--app-100dvh, 100vh)' }}
    >
      {children}
    </div>
  );
};

export default Viewport;
