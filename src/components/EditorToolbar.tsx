import React, { useState } from 'react';
import './EditorToolbar.css';

interface EditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onTextChange: (text: string) => void;
  fontSize: string;
  fontFamily: string;
  onFontSizeChange: (size: string) => void;
  onFontFamilyChange: (family: string) => void;
}

interface FormatAction {
  label: string;
  icon: string;
  action: (textarea: HTMLTextAreaElement) => void;
  title: string;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
  textareaRef, 
  onTextChange,
  fontSize,
  fontFamily,
  onFontSizeChange,
  onFontFamilyChange
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

  const formatActions: FormatAction[] = [
    {
      label: '볼드',
      icon: '𝐁',
      title: '볼드 텍스트',
      action: (textarea) => insertText(textarea, '**', '**')
    },
    {
      label: '이탤릭',
      icon: '𝐼',
      title: '이탤릭 텍스트',
      action: (textarea) => insertText(textarea, '*', '*')
    },
    {
      label: '취소선',
      icon: 'S̶',
      title: '취소선 텍스트',
      action: (textarea) => insertText(textarea, '~~', '~~')
    },
    {
      label: '체크박스',
      icon: '☐',
      title: '체크리스트 항목',
      action: (textarea) => insertAtLine(textarea, '- [ ] ')
    },
    {
      label: '체크완료',
      icon: '☑',
      title: '완료된 체크리스트 항목',
      action: (textarea) => insertAtLine(textarea, '- [x] ')
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
      label: '인용',
      icon: '"',
      title: '인용문',
      action: (textarea) => insertAtLine(textarea, '> ')
    },
    {
      label: '코드',
      icon: '</>',
      title: '인라인 코드',
      action: (textarea) => insertText(textarea, '`', '`')
    },
    {
      label: '코드블록',
      icon: '{}',
      title: '코드 블록',
      action: (textarea) => insertText(textarea, '```\n', '\n```')
    },
    {
      label: '링크',
      icon: '🔗',
      title: '링크',
      action: (textarea) => insertText(textarea, '[', '](url)')
    },
    {
      label: '구분선',
      icon: '─',
      title: '수평선',
      action: (textarea) => insertAtLine(textarea, '---\n')
    },
    {
      label: '목록',
      icon: '•',
      title: '불릿 목록',
      action: (textarea) => insertAtLine(textarea, '- ')
    },
    {
      label: '번호목록',
      icon: '1.',
      title: '번호 목록',
      action: (textarea) => insertAtLine(textarea, '1. ')
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
        <span className="toolbar-label">텍스트:</span>
        {formatActions.slice(0, 3).map((action) => (
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
      
      <div className="toolbar-section">
        <span className="toolbar-label">체크:</span>
        {formatActions.slice(3, 5).map((action) => (
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

      <div className="toolbar-section">
        <span className="toolbar-label">제목:</span>
        {formatActions.slice(5, 8).map((action) => (
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

      <div className="toolbar-section">
        <span className="toolbar-label">기타:</span>
        {formatActions.slice(8).map((action) => (
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

      <div className="toolbar-section">
        <span className="toolbar-label">스타일:</span>
        
        {/* 폰트 크기 선택 */}
        <select
          className="toolbar-select font-size-select"
          value={fontSize}
          onChange={(e) => onFontSizeChange(e.target.value)}
          title="폰트 크기"
        >
          <option value="10">10px</option>
          <option value="12">12px</option>
          <option value="14">14px</option>
          <option value="16">16px</option>
          <option value="18">18px</option>
          <option value="20">20px</option>
          <option value="22">22px</option>
          <option value="24">24px</option>
          <option value="28">28px</option>
          <option value="32">32px</option>
        </select>

        {/* 폰트 패밀리 선택 */}
        <select
          className="toolbar-select font-family-select"
          value={fontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          title="폰트 종류"
        >
          <option value="inherit">기본</option>
          <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">시스템</option>
          <option value="'Times New Roman', serif">Times</option>
          <option value="'Arial', sans-serif">Arial</option>
          <option value="'Courier New', monospace">Courier</option>
          <option value="'Georgia', serif">Georgia</option>
          <option value="'Verdana', sans-serif">Verdana</option>
          <option value="'Malgun Gothic', '맑은 고딕', sans-serif">맑은고딕</option>
          <option value="'Noto Sans KR', sans-serif">노토산스</option>
          <option value="'D2Coding', 'Fira Code', 'Consolas', monospace">코딩폰트</option>
        </select>
      </div>
    </div>
  );
};

export default EditorToolbar;