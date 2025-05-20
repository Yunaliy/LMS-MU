import React, { useState } from 'react';
import {
  FaStar,
  FaRegStar,
  FaStarHalfAlt
} from 'react-icons/fa';
import './starRating.css';

const StarRating = ({
  rating,
  onRatingClick,
  size = 20,
  color = 'var(--primary-color)',
  interactive = false,
  average = false, // Indicates if displaying average rating (non-interactive with hover)
  onHover, // New prop for hover events
  onLeave // New prop for mouse leave events
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (starIndex) => {
    if (interactive && onRatingClick) {
      onRatingClick(starIndex + 1);
    }
  };

  const handleMouseMove = (starIndex) => {
    if (interactive) {
      setHoverRating(starIndex + 1);
      if(onHover) onHover(starIndex + 1); // Call onHover prop
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
      if(onLeave) onLeave(); // Call onLeave prop
    }
  };

  const displayRating = hoverRating || rating;

  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      const ratingValue = i + 1;
      let starIcon;

      if (displayRating >= ratingValue) {
        starIcon = <FaStar key={i} />;
      } else if (displayRating >= ratingValue - 0.5) {
        starIcon = <FaStarHalfAlt key={i} />;
      } else {
        starIcon = <FaRegStar key={i} />;
      }

      stars.push(
        <span
          key={i}
          onClick={() => handleClick(i)}
          onMouseMove={() => handleMouseMove(i)}
          onMouseLeave={handleMouseLeave}
          style={{
            cursor: interactive ? 'pointer' : 'default',
            color: color,
            fontSize: `${size}px`,
          }}
        >
          {starIcon}
        </span>
      );
    }
    return stars;
  };

  return <div className={`star-rating ${interactive ? 'interactive' : ''} ${average ? 'average' : ''}`}>{renderStars()}</div>;
};

export default StarRating; 