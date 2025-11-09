import React, { useEffect } from 'react';
import './Modal.css';
// You don't need to import the image directly in JS if it's in the public folder.
// Just reference its public path.

const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <img src="/icons/close.png" alt="Close" className="close-icon" />
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;