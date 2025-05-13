// --- Full Code for: Frontend/src/Components/GoToTopButton.js ---

import React, { useState, useEffect } from 'react';

function GoToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  // This function checks if the page has been scrolled down enough
  // to show the button. We'll say 300 pixels down.
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // This function makes the page scroll smoothly to the very top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth', // This makes the scroll smooth
    });
  };

  // This part sets things up:
  // It tells the browser to run 'toggleVisibility' whenever the user scrolls.
  // It also cleans up when this button is no longer needed.
  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []); // The empty array means this setup runs once when the button is first created.

  // This is what the button actually looks like and does.
  // It only shows up if 'isVisible' is true.
  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop} // When clicked, it calls 'scrollToTop'
          className="go-to-top-button" // This class name is for styling
          aria-label="Go to top" // For accessibility
        >
          ↑ {/* This is an upward arrow symbol: ↑ */}
        </button>
      )}
    </>
  );
}

export default GoToTopButton;