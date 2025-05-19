import React, { useState, useEffect } from 'react';
import StarRating from '../StarRating/StarRating';
import './ratingDialog.css';
import {
  FaTimes,
  FaTrash
} from 'react-icons/fa';

const ratingFeedback = {
  1: "Awful, not what I expected at all",
  2: "Poor, pretty disappointed",
  2.5: "Poor / Average",
  3: "Average, could be better",
  3.5: "Average / Good",
  4: "Good, what I expected",
  4.5: "Good / Amazing",
  5: "Amazing, above expectations!",
};

const RatingDialog = ({
  isOpen,
  onClose,
  currentRating,
  onSave,
  onDelete,
  courseTitle
}) => {
  const [selectedRating, setSelectedRating] = useState(currentRating);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    setSelectedRating(currentRating);
  }, [currentRating]);

  const handleStarClick = (rating) => {
    setSelectedRating(rating);
    setHoverRating(0); // Reset hover state on click
  };

  const handleSave = () => {
    if (selectedRating !== null && selectedRating !== undefined) {
      onSave(selectedRating);
    }
  };

  const handleDelete = () => {
    onDelete();
  };

  const handleStarHover = (rating) => {
      setHoverRating(rating);
  }

  const handleStarLeave = () => {
      setHoverRating(0);
  }

  if (!isOpen) return null;

  // Determine the rating to display feedback for (hover or selected)
  const feedbackRating = hoverRating || selectedRating;

  // Find the closest feedback text
  const feedbackText = ratingFeedback[feedbackRating] || 
                       ratingFeedback[Math.floor(feedbackRating)] || 
                       "Select a rating";

  return (
    <div className="rating-dialog-overlay">
      <div className="rating-dialog-content">
        <div className="rating-dialog-header">
          <h3>Rate Your Experience: {courseTitle}</h3>
          <button className="close-button" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="rating-dialog-body">
          <div className="rating-feedback">{feedbackText}</div>
          <StarRating
            rating={selectedRating}
            onRatingClick={handleStarClick}
            onHover={handleStarHover}
            onLeave={handleStarLeave}
            size={30}
            interactive={true}
          />
        </div>
        <div className="rating-dialog-footer">
           {currentRating !== null && currentRating !== undefined && (
            <button className="delete-button" onClick={handleDelete}>
              <FaTrash /> Delete Rating
            </button>
          )}
          <button className="save-button" onClick={handleSave} disabled={selectedRating === null || selectedRating === undefined}>
            Save Rating
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingDialog; 