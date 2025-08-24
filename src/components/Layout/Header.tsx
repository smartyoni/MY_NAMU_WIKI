import React, { useState, useEffect } from 'react';
import './Header.css';

const Header: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dayOfWeek = days[date.getDay()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}.${month}.${day}(${dayOfWeek}) ${hours}:${minutes}:${seconds}`;
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="logo">Personal Wiki</h1>
        <span className="datetime">{formatDateTime(currentTime)}</span>
      </div>
      <div className="header-center">
        <input 
          type="text" 
          className="search-input" 
          placeholder="문서 검색..."
        />
      </div>
      <div className="header-right">
        <span className="production-mode">완성 버전</span>
      </div>
    </header>
  );
};

export default Header;