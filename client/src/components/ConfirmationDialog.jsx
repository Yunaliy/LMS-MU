import React from 'react';
import './ConfirmationDialog.css';

const ConfirmationDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-dialog-overlay">
      <div className="confirmation-dialog">
        <div className="confirmation-dialog-content">
          <h3>{title}</h3>
          <p>{message}</p>
          <div className="confirmation-dialog-actions">
            <button 
              className="btn-secondary" 
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              className="btn-danger" 
              onClick={onConfirm}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog; 