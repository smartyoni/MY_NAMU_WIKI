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
    
    // 커서 위치 설정 (스크롤 위치 유지)
    setTimeout(() => {
      const scrollTop = textarea.scrollTop;
      textarea.focus({ preventScroll: true });
      const newCursorPos = selectedText 
        ? start + before.length + selectedText.length + after.length
        : start + before.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.scrollTop = scrollTop;
    }, 50);
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
    
    // 커서 위치 설정 (스크롤 위치 유지)
    setTimeout(() => {
      const scrollTop = textarea.scrollTop;
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      textarea.scrollTop = scrollTop;
    }, 50);
  };

  const insertCurrentDateTime = (textarea: HTMLTextAreaElement) => {
    const now = new Date();
    const dateTimeString = now.toLocaleDateString('ko-KR') + ' ' + now.toLocaleTimeString('ko-KR', { hour12: false });
    insertText(textarea, dateTimeString, '');
  };

  const insertToggleTemplate = (textarea: HTMLTextAreaElement) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (selectedText.trim()) {
      // 선택된 텍스트가 있으면 토글로 감싸기
      const beforeText = textarea.value.substring(0, start);
      const afterText = textarea.value.substring(end);
      
      const template = `> [!NOTE]- 클릭하여 펼치기/접기
> ${selectedText.split('\n').join('\n> ')}`;
      
      const newText = beforeText + template + afterText;
      onTextChange(newText);
      
      setTimeout(() => {
        const scrollTop = textarea.scrollTop;
        textarea.focus({ preventScroll: true });
        const newCursorPos = start + template.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.scrollTop = scrollTop;
      }, 50);
    } else {
      // 선택된 텍스트가 없으면 기본 템플릿
      const template = `> [!NOTE]- 클릭하여 펼치기/접기
> 내용을 입력하세요`;
      insertText(textarea, template, '');
    }
  };

  const insertDetailsTemplate = (textarea: HTMLTextAreaElement) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (selectedText.trim()) {
      // 선택된 텍스트가 있으면 감싸기
      const beforeText = textarea.value.substring(0, start);
      const afterText = textarea.value.substring(end);
      
      const lines = selectedText.split('\n');
      const firstLine = lines[0].trim();
      const remainingLines = lines.slice(1);
      
      // 첫 번째 줄 헤딩 처리
      let summaryTitle;
      if (firstLine.match(/^#+\s/)) {
        // 이미 헤딩이 있으면 헤딩은 유지하고 텍스트에 볼드 적용
        const headingMatch = firstLine.match(/^(#+)\s+(.+)$/);
        if (headingMatch) {
          const headingLevel = headingMatch[1]; // ### 
          const headingText = headingMatch[2];  // 제목 텍스트
          summaryTitle = `${headingLevel} **${headingText}**`;
        } else {
          summaryTitle = firstLine;
        }
      } else {
        // 헤딩이 없으면 ### 추가하고 볼드 처리
        summaryTitle = `### **${firstLine}**`;
      }
      
      // 나머지 내용 구성 (첫 줄 제외)
      const contentText = remainingLines.join('\n');
      
      const wrappedTemplate = `<details>
<summary>${summaryTitle}</summary>

${contentText}

</details>`;
      
      const newText = beforeText + wrappedTemplate + afterText;
      onTextChange(newText);
      
      // 커서를 content 영역 시작으로 설정 (스크롤 위치 유지)
      setTimeout(() => {
        const scrollTop = textarea.scrollTop;
        textarea.focus({ preventScroll: true });
        const contentStart = start + `<details>\n<summary>${summaryTitle}</summary>\n\n`.length;
        textarea.setSelectionRange(contentStart, contentStart);
        textarea.scrollTop = scrollTop;
      }, 50);
    } else {
      // 선택된 텍스트가 없으면 기본 템플릿
      const template = `<details>
<summary>제목을 입력하세요</summary>

내용을 입력하세요

</details>`;
      insertText(textarea, template, '');
    }
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
      label: '헤더4',
      icon: 'H4',
      title: '세부제목',
      action: (textarea) => insertAtLine(textarea, '#### ')
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
    },
    {
      label: '토글',
      icon: '🔽',
      title: '토글 블록 삽입',
      action: insertToggleTemplate
    },
    {
      label: '접기',
      icon: '📋',
      title: '접기/펼치기 블록 삽입',
      action: insertDetailsTemplate
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