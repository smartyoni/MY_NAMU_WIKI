import React, { useState, useEffect } from 'react';
import { googleCalendarService, CalendarEvent } from '../../services/googleCalendarService';
import './TodayScheduleModal.css';

interface TodayScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TodayScheduleModal: React.FC<TodayScheduleModalProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkAuthStatus();
    }
  }, [isOpen]);

  const checkAuthStatus = async () => {
    try {
      const initialized = await googleCalendarService.initializeGAPI();
      if (initialized) {
        const signedIn = googleCalendarService.isUserSignedIn();
        setIsSignedIn(signedIn);
        
        if (signedIn) {
          console.log('🔄 기존 로그인 세션 복원됨');
          setUserInfo(googleCalendarService.getUserInfo());
          await loadWeeklyEvents();
        } else {
          console.log('🚪 저장된 로그인 세션 없음');
        }
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
      setError('Google 서비스 연결에 실패했습니다.');
    }
  };

  const handleSignIn = async () => {
    console.log('🔘 handleSignIn 함수 호출됨');
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 googleCalendarService.signIn() 호출 시작');
      const success = await googleCalendarService.signIn();
      console.log('✅ googleCalendarService.signIn() 결과:', success);
      
      if (success) {
        setIsSignedIn(true);
        const userInfo = googleCalendarService.getUserInfo();
        console.log('👤 사용자 정보:', userInfo);
        setUserInfo(userInfo);
        await loadWeeklyEvents();
      } else {
        console.error('❌ 로그인 실패');
        setError('Google 계정 로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 로그인 오류:', error);
      setError('Google 계정 로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      console.log('🏁 handleSignIn 완료');
    }
  };

  const handleSignOut = async () => {
    try {
      await googleCalendarService.signOut();
      setIsSignedIn(false);
      setUserInfo(null);
      setEvents([]);
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const loadWeeklyEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const weeklyEvents = await googleCalendarService.getWeeklyEvents();
      setEvents(weeklyEvents);
    } catch (error) {
      console.error('일주일 일정 로드 실패:', error);
      setError('일주일 일정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const refreshEvents = async () => {
    if (isSignedIn) {
      await loadWeeklyEvents();
    }
  };

  const toggleEventDetails = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  const openEventInGoogle = (htmlLink: string) => {
    window.open(htmlLink, '_blank', 'noopener,noreferrer');
  };

  const formatDateRange = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 5);
    
    const startStr = yesterday.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
    const endStr = endDate.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
    
    return `${startStr} ~ ${endStr}`;
  };

  const formatEventDate = (event: CalendarEvent) => {
    const startDate = event.start.dateTime || event.start.date;
    if (!startDate) return '';
    
    const date = new Date(startDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const eventDateStr = date.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    const tomorrowStr = tomorrow.toDateString();
    
    if (eventDateStr === todayStr) {
      return '오늘';
    } else if (eventDateStr === yesterdayStr) {
      return '어제';
    } else if (eventDateStr === tomorrowStr) {
      return '내일';
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="today-schedule-overlay">
      <div className="today-schedule-modal">
        <div className="modal-header">
          <div className="header-left">
            <h2>📅 일주일 일정</h2>
            <p className="date-info">{formatDateRange()}</p>
          </div>
          <div className="header-right-actions">
            {isSignedIn && (
              <>
                <button 
                  className="refresh-btn"
                  onClick={refreshEvents}
                  disabled={loading}
                  title="일정 새로고침"
                >
                  🔄
                </button>
                <button 
                  className="signout-btn"
                  onClick={handleSignOut}
                  title="로그아웃"
                >
                  ↪️
                </button>
              </>
            )}
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="modal-content">
          {!isSignedIn ? (
            <div className="auth-section">
              <div className="auth-message">
                <h3>구글 계정 연결이 필요합니다</h3>
                <p>Google 캘린더의 일주일 일정을 확인하려면<br />구글 계정으로 로그인해주세요.</p>
                <div className="auth-features">
                  <p>✅ 캘린더 읽기 전용 권한</p>
                  <p>✅ 일주일 일정 조회</p>
                  <p>✅ 개인정보 안전 보장</p>
                </div>
              </div>
              <button 
                className="google-signin-btn"
                onClick={handleSignIn}
                disabled={loading}
              >
                {loading ? '연결 중...' : '🔑 Google 계정으로 로그인'}
              </button>
            </div>
          ) : (
            <div className="schedule-section">
              {loading ? (
                <div className="loading-section">
                  <div className="loading-spinner">⏳</div>
                  <p>일정을 불러오는 중...</p>
                </div>
              ) : error ? (
                <div className="error-section">
                  <p className="error-message">❌ {error}</p>
                  <button className="retry-btn" onClick={refreshEvents}>
                    다시 시도
                  </button>
                </div>
              ) : events.length === 0 ? (
                <div className="no-events-section">
                  <div className="no-events-icon">📅</div>
                  <h3>이번 주는 일정이 없습니다</h3>
                  <p>편안한 한 주 보내세요! 🌟</p>
                </div>
              ) : (
                <div className="events-list">
                  <div className="events-header">
                    <h3>이번 주 일정 ({events.length}개)</h3>
                  </div>
                  {events.map((event) => {
                    const isToday = formatEventDate(event) === '오늘';
                    return (
                      <div key={event.id} className={`event-item ${isToday ? 'today-event' : ''}`}>
                        <div 
                          className="event-summary"
                          onClick={() => toggleEventDetails(event.id)}
                        >
                        <div className="event-date">
                          {formatEventDate(event)}
                        </div>
                        <div className="event-time">
                          {googleCalendarService.formatEventTime(event)}
                        </div>
                        <div className="event-title">
                          {event.summary}
                        </div>
                        <div className="expand-icon">
                          {expandedEvent === event.id ? '▼' : '▶'}
                        </div>
                      </div>
                      
                      {expandedEvent === event.id && (
                        <div className="event-details">
                          {event.description && (
                            <div className="event-description">
                              <strong>설명:</strong>
                              <p>{event.description}</p>
                            </div>
                          )}
                          
                          {event.location && (
                            <div className="event-location">
                              <strong>장소:</strong>
                              <p>📍 {event.location}</p>
                            </div>
                          )}
                          
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="event-attendees">
                              <strong>참석자:</strong>
                              <div className="attendees-list">
                                {event.attendees.map((attendee, index) => (
                                  <span key={index} className="attendee">
                                    {attendee.displayName || attendee.email}
                                    {attendee.responseStatus === 'accepted' && ' ✅'}
                                    {attendee.responseStatus === 'declined' && ' ❌'}
                                    {attendee.responseStatus === 'tentative' && ' ❓'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="event-actions">
                            <button 
                              className="open-google-btn"
                              onClick={() => openEventInGoogle(event.htmlLink)}
                            >
                              Google 캘린더에서 열기
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodayScheduleModal;