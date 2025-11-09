import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import './dropdown.css';

const Dropdown = ({ children, buttonContent, alignRight = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({});
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    
    if (!isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - rect.bottom;
        
        // If less than 200px below, open upwards
        const openUpwards = spaceBelow < 200; 

        const newPosition = {
            position: 'fixed',
            left: alignRight ? 'auto' : `${rect.left}px`,
            right: alignRight ? `${window.innerWidth - rect.right}px` : 'auto',
            zIndex: 9999,
        };

        if (openUpwards) {
            // Position from the bottom of the screen to the top of the button
            newPosition.bottom = `${windowHeight - rect.top + 4}px`;
            newPosition.top = 'auto';
            newPosition.transformOrigin = 'bottom right'; // For animation
        } else {
            // Standard positioning from the bottom of the button downwards
            newPosition.top = `${rect.bottom + 4}px`;
            newPosition.bottom = 'auto';
            newPosition.transformOrigin = 'top right'; // For animation
        }

        setMenuPosition(newPosition);
    }
    setIsOpen(prev => !prev);
  };

  const handleClickOutside = useCallback((event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target)
    ) {
      setIsOpen(false);
    }
  }, []);

  // Close on scroll to prevent detached floating menu
  useEffect(() => {
      const handleScroll = () => { if(isOpen) setIsOpen(false); };
      // Use capture phase to detect scrolling of any parent element
      window.addEventListener('scroll', handleScroll, true); 
      return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const dropdownMenu = (
      <div 
        className="dropdown-menu-portal" 
        style={menuPosition} 
        ref={dropdownRef}
        onClick={(e) => e.stopPropagation()}
       >
          {children}
      </div>
  );

  return (
    <>
      <button
        type="button"
        className={`dropdown-toggle-button ${isOpen ? 'active' : ''}`}
        onClick={toggleDropdown}
        ref={buttonRef}
      >
        {buttonContent || (
          <img src="/icons/dots.png" alt="More" className="dots-icon" />
        )}
      </button>

      {isOpen && ReactDOM.createPortal(dropdownMenu, document.body)}
    </>
  );
};

export default Dropdown;