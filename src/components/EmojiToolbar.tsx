import React from 'react';
import './EmojiToolbar.css';

interface EmojiToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onTextChange: (text: string) => void;
}

const EmojiToolbar: React.FC<EmojiToolbarProps> = ({ textareaRef, onTextChange }) => {
  const emojis = [
    '✅', '✔️', '⭐', '✨', '📌', '📝', '☑️', '✔️', 
    '➡️', '☎️', '📱', '※', '★', '◆', '▶', '【', '】', '㎡', '→'
  ];

  const insertEmoji = (emoji: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    
    const newText = beforeText + emoji + afterText;
    onTextChange(newText);
    
    // 커서 위치를 이모티콘 뒤로 설정
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + emoji.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  return (
    <div className="emoji-toolbar">
      <div className="emoji-buttons">
        {emojis.map((emoji, index) => (
          <button
            key={index}
            className="emoji-button"
            onClick={() => insertEmoji(emoji)}
            title={`${emoji} 삽입`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiToolbar;