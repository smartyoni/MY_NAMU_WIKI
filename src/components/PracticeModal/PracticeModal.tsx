import React, { useState, useEffect, useRef } from 'react';
import './PracticeModal.css';

interface PracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PracticeModal: React.FC<PracticeModalProps> = ({ isOpen, onClose }) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 컴포넌트 마운트 시 localStorage에서 내용 불러오기
  useEffect(() => {
    const savedContent = localStorage.getItem('practiceContent');
    if (savedContent) {
      setContent(savedContent);
    }
  }, []);

  // 모달이 열릴 때마다 textarea에 포커스
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 내용 변경 시 실시간으로 localStorage에 저장
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    localStorage.setItem('practiceContent', newContent);
  };

  // 초기화 버튼 클릭
  const handleReset = () => {
    if (window.confirm('연습장 내용을 모두 삭제하시겠습니까?')) {
      setContent('');
      localStorage.removeItem('practiceContent');
      textareaRef.current?.focus();
    }
  };

  // 복사 버튼 클릭
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      alert('내용이 복사되었습니다!');
    } catch (error) {
      console.error('복사 실패:', error);
      alert('복사에 실패했습니다.');
    }
  };

  // 맨 아래로 이동
  const handleGoToBottom = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      textarea.scrollTop = textarea.scrollHeight;
    }
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="practice-modal-overlay" onClick={handleOverlayClick}>
      <div className="practice-modal">
        <div className="practice-modal-header">
          <div className="practice-modal-title">
            <h2>📝 연습장</h2>
            <span className="practice-modal-subtitle">임시 메모 공간</span>
          </div>
          <div className="practice-modal-actions">
            <button 
              className="practice-action-button copy-button"
              onClick={handleCopy}
              title="내용 복사"
            >
              📋 복사
            </button>
            <button 
              className="practice-action-button reset-button"
              onClick={handleReset}
              title="내용 초기화"
            >
              🗑️ 초기화
            </button>
            <button 
              className="practice-action-button bottom-button"
              onClick={handleGoToBottom}
              title="맨 아래로 이동"
            >
              ⬇️ 맨 아래로
            </button>
            <button 
              className="practice-action-button close-button"
              onClick={onClose}
              title="연습장 닫기 (ESC)"
            >
              ❌ 닫기
            </button>
          </div>
        </div>
        
        <div className="practice-modal-content">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="practice-editor"
            placeholder="자유롭게 메모하세요... 내용은 자동으로 저장됩니다."
          />
        </div>

        <div className="practice-modal-footer">
          <small className="practice-info">
            💡 연습장 내용은 브라우저에 자동 저장되며, 초기화 버튼으로만 삭제할 수 있습니다.
          </small>
        </div>
      </div>
    </div>
  );
};

export default PracticeModal;