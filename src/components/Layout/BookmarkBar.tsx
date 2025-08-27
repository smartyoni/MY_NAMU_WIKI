import React from 'react';
import './BookmarkBar.css';

const BookmarkBar: React.FC = () => {
  return (
    <div className="bookmark-bar">
      <a href="#" className="bookmark-link">Admin</a>
      <a href="#" className="bookmark-link">Settings</a>
      <a href="#" className="bookmark-link">Help</a>
    </div>
  );
};

export default BookmarkBar;
