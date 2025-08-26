import React, { useState } from 'react';
import './EditorToolbar.css';

interface EditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onTextChange: (text: string) => void;
}

interface FormatAction {
  label: string;
  icon: string;
  action: (textarea: HTMLTextAreaElement) => void;
  title: string;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
  textareaRef, 
  onTextChange
}) => {

  const insertText = (textarea: HTMLTextAreaElement, before: string, after: string = '') => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    
    const newText = beforeText + before + selectedText + after + afterText;
    onTextChange(newText);
    
    // 커서 위치 설정
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText 
        ? start + before.length + selectedText.length + after.length
        : start + before.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const insertAtLine = (textarea: HTMLTextAreaElement, prefix: string) => {
    const start = textarea.selectionStart;
    const text = textarea.value;
    
    // 현재 라인의 시작 찾기
    let lineStart = start;
    while (lineStart > 0 && text[lineStart - 1] !== '\n') {
      lineStart--;
    }
    
    const beforeText = text.substring(0, lineStart);
    const afterText = text.substring(lineStart);
    
    const newText = beforeText + prefix + afterText;
    onTextChange(newText);
    
    // 커서 위치 설정
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 10);
  };

  const insertCurrentDateTime = (textarea: HTMLTextAreaElement) => {
    const now = new Date();
    const dateTimeString = now.toLocaleDateString('ko-KR') + ' ' + now.toLocaleTimeString('ko-KR', { hour12: false });
    insertText(textarea, dateTimeString, '');
  };

  const formatActions: FormatAction[] = [
    {
      label: '볼드',
      icon: '𝐁',
      title: '볼드 텍스트',
      action: (textarea) => insertText(textarea, '**', '**')
    },
    {
      label: '취소선',
      icon: 'S̶',
      title: '취소선 텍스트',
      action: (textarea) => insertText(textarea, '~~', '~~')
    },
    {
      label: '헤더1',
      icon: 'H1',
      title: '대제목',
      action: (textarea) => insertAtLine(textarea, '# ')
    },
    {
      label: '헤더2',
      icon: 'H2',
      title: '중제목',
      action: (textarea) => insertAtLine(textarea, '## ')
    },
    {
      label: '헤더3',
      icon: 'H3',
      title: '소제목',
      action: (textarea) => insertAtLine(textarea, '### ')
    },
    {
      label: '구분선',
      icon: '─',
      title: '수평선',
      action: (textarea) => insertAtLine(textarea, '---\n')
    },
    {
      label: '날짜시간',
      icon: '📅',
      title: '현재 날짜와 시간 삽입',
      action: insertCurrentDateTime
    }
  ];

  const handleAction = (action: FormatAction) => {
    if (textareaRef.current) {
      action.action(textareaRef.current);
    }
  };

  return (
    <div className="editor-toolbar">
      <div className="toolbar-section">
        <span className="toolbar-label">도구:</span>
        {formatActions.map((action) => (
          <button
            key={action.label}
            className="toolbar-button"
            onClick={() => handleAction(action)}
            title={action.title}
          >
            {action.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EditorToolbar;