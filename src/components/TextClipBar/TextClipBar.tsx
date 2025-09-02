import React, { useState, useEffect } from 'react';
import { useDocuments } from '../../context/DocumentContextFirebase';
import { TextClip } from '../../types';
import './TextClipBar.css';

interface TextClipBarProps {
  className?: string;
}

const TextClipBar: React.FC<TextClipBarProps> = ({ className = '' }) => {
  const { 
    textClips, 
    createTextClip, 
    updateTextClip, 
    deleteTextClip, 
    reorderTextClips
  } = useDocuments();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTextClip, setEditingTextClip] = useState<TextClip | null>(null);
  const [draggedTextClip, setDraggedTextClip] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // 액션 모달 상태
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedTextClip, setSelectedTextClip] = useState<TextClip | null>(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  // 색상표 표시 상태
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });
  
  // 텍스트 클립 내용 팝업 상태
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedContentClip, setSelectedContentClip] = useState<TextClip | null>(null);

  // 무지개 색상표 (북마크와 동일)
  const rainbowColors = [
    { color: '#FF4757', name: '빨강', category: '중요/긴급' },
    { color: '#FF6348', name: '주황', category: '알림/경고' },
    { color: '#FFC048', name: '노랑', category: '즐겨찾기' },
    { color: '#32CD32', name: '초록', category: '학습/성장' },
    { color: '#00D8FF', name: '하늘', category: '일상/라이프' },
    { color: '#4A90E2', name: '파랑', category: '업무/비즈니스' },
    { color: '#8E44AD', name: '보라', category: '취미/오락' },
    { color: '#F39C12', name: '골드', category: '쇼핑/구매' },
    { color: '#95A5A6', name: '회색', category: '참고/도구' },
    { color: '#2ECC71', name: '민트', category: '건강/운동' },
    { color: '#E91E63', name: '핑크', category: '소셜/커뮤니티' },
    { color: '#9B59B6', name: '자주', category: '개발/기술' }
  ];

  // 랜덤 색상 선택
  const getRandomColor = () => {
    return rainbowColors[Math.floor(Math.random() * rainbowColors.length)].color;
  };

  // 클립보드에 복사 및 시각적 피드백
  const handleTextClipClick = (textClip: TextClip) => {
    setSelectedContentClip(textClip);
    setShowContentModal(true);
  };

  const handleCopyFromModal = async (textClip: TextClip) => {
    try {
      await navigator.clipboard.writeText(textClip.content);
      console.log('텍스트 클립 복사 성공:', textClip.title);
      
      setShowContentModal(false);
      setSelectedContentClip(null);
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  const handleEditFromModal = () => {
    if (selectedContentClip) {
      setEditingTextClip(selectedContentClip);
      setShowAddModal(true);
      setShowContentModal(false);
    }
  };

  const handleDeleteFromModal = async () => {
    if (selectedContentClip) {
      const shouldDelete = window.confirm(`정말로 "${selectedContentClip.title}" 텍스트 클립을 삭제하시겠습니까?`);
      if (shouldDelete) {
        try {
          await deleteTextClip(selectedContentClip.id);
          setShowContentModal(false);
          setSelectedContentClip(null);
        } catch (error) {
          console.error('텍스트 클립 삭제 실패:', error);
        }
      }
    }
  };

  const handleCloseContentModal = () => {
    setShowContentModal(false);
    setSelectedContentClip(null);
  };

  const handleAddTextClip = async (title: string, content: string) => {
    try {
      const formattedTitle = title.slice(0, 10); // 10글자 제한
      const randomColor = getRandomColor();
      
      await createTextClip(formattedTitle, content, randomColor, 'text');
      setShowAddModal(false);
    } catch (error) {
      console.error('텍스트 클립 추가 실패:', error);
    }
  };

  const handleEditTextClip = (textClip: TextClip) => {
    setEditingTextClip(textClip);
    setShowAddModal(true);
  };

  const handleUpdateTextClip = async (title: string, content: string) => {
    if (!editingTextClip) return;

    try {
      const updates = {
        title: title.slice(0, 10),
        content
      };
      
      await updateTextClip(editingTextClip.id, updates);
      setShowAddModal(false);
      setEditingTextClip(null);
    } catch (error) {
      console.error('텍스트 클립 수정 실패:', error);
    }
  };

  const handleDeleteTextClip = async (textClipId: string) => {
    try {
      await deleteTextClip(textClipId);
    } catch (error) {
      console.error('텍스트 클립 삭제 실패:', error);
    }
  };

  const handleRightClick = (e: React.MouseEvent, textClip: TextClip) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 모달 위치 설정 (마우스 위치 기준)
    const x = Math.min(e.clientX, window.innerWidth - 180);
    const y = Math.min(e.clientY, window.innerHeight - 150);
    
    setModalPosition({ x, y });
    setSelectedTextClip(textClip);
    
    setTimeout(() => {
      setShowActionModal(true);
    }, 0);
  };

  const handleActionEdit = () => {
    if (selectedTextClip) {
      handleEditTextClip(selectedTextClip);
    }
    setShowActionModal(false);
    setSelectedTextClip(null);
  };

  const handleActionDelete = async () => {
    if (selectedTextClip) {
      const shouldDelete = window.confirm(`정말로 "${selectedTextClip.title}" 텍스트 클립을 삭제하시겠습니까?`);
      if (shouldDelete) {
        await handleDeleteTextClip(selectedTextClip.id);
      }
    }
    setShowActionModal(false);
    setSelectedTextClip(null);
  };

  const handleActionCancel = () => {
    setShowActionModal(false);
    setSelectedTextClip(null);
  };

  const handleActionColorChange = () => {
    // 색상표 위치 설정 (모달 옆에 표시)
    const x = Math.min(modalPosition.x + 200, window.innerWidth - 320);
    const y = Math.max(modalPosition.y - 50, 20);
    
    setColorPickerPosition({ x, y });
    setShowColorPicker(true);
    setShowActionModal(false);
  };

  const handleColorSelect = async (color: string) => {
    if (selectedTextClip) {
      console.log('텍스트 클립 색상 변경 시도:', selectedTextClip.id, color);
      try {
        await updateTextClip(selectedTextClip.id, { color });
        console.log('텍스트 클립 색상 변경 성공');
      } catch (error) {
        console.error('텍스트 클립 색상 변경 실패:', error);
      }
    }
    setShowColorPicker(false);
    setSelectedTextClip(null);
  };

  // 드래그 앤 드롭 핸들러들
  const handleDragStart = (e: React.DragEvent, textClipId: string) => {
    setDraggedTextClip(textClipId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTextClip(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedTextClip) return;
    
    const draggedIndex = textClips.findIndex(t => t.id === draggedTextClip);
    if (draggedIndex === -1 || draggedIndex === targetIndex) return;
    
    const newTextClips = [...textClips];
    const draggedItem = newTextClips[draggedIndex];
    
    // 배열에서 드래그된 아이템 제거
    newTextClips.splice(draggedIndex, 1);
    // 새 위치에 삽입
    newTextClips.splice(targetIndex, 0, draggedItem);
    
    // order 재정렬
    const reorderedTextClips = newTextClips.map((textClip, index) => ({
      ...textClip,
      order: index + 1
    }));
    
    try {
      // Firebase에 새로운 순서 업데이트
      await reorderTextClips(reorderedTextClips);
      console.log('텍스트 클립 순서 변경 성공');
    } catch (error) {
      console.error('텍스트 클립 순서 변경 실패:', error);
    }
    
    setDraggedTextClip(null);
    setDragOverIndex(null);
  };

  // DOM 방식 색상표
  useEffect(() => {
    if (showColorPicker && selectedTextClip) {
      // 오버레이 생성
      const overlay = document.createElement('div');
      overlay.id = 'textclip-color-picker-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.1);
        z-index: 99998;
      `;
      
      // 색상표 모달 생성
      const colorPicker = document.createElement('div');
      colorPicker.id = 'textclip-color-picker-modal';
      colorPicker.style.cssText = `
        position: fixed;
        left: ${colorPickerPosition.x}px;
        top: ${colorPickerPosition.y}px;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        z-index: 99999;
        padding: 16px;
        font-family: inherit;
        min-width: 300px;
      `;
      
      colorPicker.innerHTML = `
        <div style="
          padding-bottom: 12px;
          border-bottom: 1px solid #dee2e6;
          margin-bottom: 16px;
        ">
          <h4 style="
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #495057;
            text-align: center;
          ">색상 선택하기</h4>
          <p style="
            margin: 4px 0 0 0;
            font-size: 11px;
            color: #6c757d;
            text-align: center;
          ">"${selectedTextClip.title}" 텍스트 클립의 색상을 선택하세요</p>
        </div>
        <div style="
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        ">
          ${rainbowColors.map(colorInfo => `
            <button 
              class="textclip-color-option" 
              data-color="${colorInfo.color}"
              style="
                width: 60px;
                height: 60px;
                border: 2px solid #dee2e6;
                border-radius: 8px;
                background-color: ${colorInfo.color};
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
              "
              title="${colorInfo.name} - ${colorInfo.category}"
            >
              <span style="
                position: absolute;
                bottom: 2px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 9px;
                color: white;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                font-weight: 500;
              ">${colorInfo.name}</span>
            </button>
          `).join('')}
        </div>
        <button id="cancel-textclip-color-btn" style="
          width: 100%;
          padding: 8px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          color: #495057;
        ">취소</button>
      `;
      
      // 색상 선택 이벤트 리스너
      const colorButtons = colorPicker.querySelectorAll('.textclip-color-option');
      colorButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const color = (e.target as HTMLElement).getAttribute('data-color');
          if (color) {
            handleColorSelect(color);
          }
        });
        
        // 호버 효과
        btn.addEventListener('mouseenter', (e) => {
          (e.target as HTMLElement).style.transform = 'scale(1.1)';
          (e.target as HTMLElement).style.borderColor = '#007bff';
          (e.target as HTMLElement).style.zIndex = '1';
        });
        
        btn.addEventListener('mouseleave', (e) => {
          (e.target as HTMLElement).style.transform = 'scale(1)';
          (e.target as HTMLElement).style.borderColor = '#dee2e6';
          (e.target as HTMLElement).style.zIndex = '0';
        });
      });
      
      // 취소 버튼
      const cancelBtn = colorPicker.querySelector('#cancel-textclip-color-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          setShowColorPicker(false);
          setSelectedTextClip(null);
        });
      }
      
      // 오버레이 클릭으로 닫기
      overlay.addEventListener('click', () => {
        setShowColorPicker(false);
        setSelectedTextClip(null);
      });
      
      document.body.appendChild(overlay);
      document.body.appendChild(colorPicker);
      
      return () => {
        const existingOverlay = document.getElementById('textclip-color-picker-overlay');
        const existingModal = document.getElementById('textclip-color-picker-modal');
        if (existingOverlay) document.body.removeChild(existingOverlay);
        if (existingModal) document.body.removeChild(existingModal);
      };
    }
  }, [showColorPicker, selectedTextClip, colorPickerPosition]);

  // DOM 방식 액션 모달
  useEffect(() => {
    if (showActionModal && selectedTextClip) {
      // 오버레이 생성
      const overlay = document.createElement('div');
      overlay.id = 'textclip-modal-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.1);
        z-index: 98999;
      `;
      
      // 모달 생성
      const modal = document.createElement('div');
      modal.id = 'textclip-action-modal';
      modal.style.cssText = `
        position: fixed;
        left: ${modalPosition.x}px;
        top: ${modalPosition.y}px;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 99999;
        min-width: 160px;
        font-family: inherit;
      `;
      
      modal.innerHTML = `
        <div style="
          padding: 8px 12px;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          border-radius: 8px 8px 0 0;
        ">
          <span style="
            font-size: 12px;
            font-weight: 500;
            color: #495057;
            display: block;
            text-align: center;
          ">"${selectedTextClip.title}"</span>
        </div>
        <div style="padding: 4px 0;">
          <button id="edit-btn" style="
            background: none;
            border: none;
            padding: 8px 16px;
            text-align: left;
            font-size: 13px;
            color: #495057;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            transition: background-color 0.15s ease;
          ">✏️ 편집</button>
          <button id="textclip-color-btn" style="
            background: none;
            border: none;
            padding: 8px 16px;
            text-align: left;
            font-size: 13px;
            color: #495057;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            transition: background-color 0.15s ease;
          ">🎨 색상 변경</button>
          <button id="delete-btn" style="
            background: none;
            border: none;
            padding: 8px 16px;
            text-align: left;
            font-size: 13px;
            color: #495057;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            transition: background-color 0.15s ease;
          ">🗑️ 삭제</button>
          <button id="cancel-btn" style="
            background: none;
            border: none;
            padding: 8px 16px;
            text-align: left;
            font-size: 13px;
            color: #495057;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            transition: background-color 0.15s ease;
          ">❌ 취소</button>
        </div>
      `;
      
      // 이벤트 리스너 추가
      const editBtn = modal.querySelector('#edit-btn');
      const colorBtn = modal.querySelector('#textclip-color-btn');
      const deleteBtn = modal.querySelector('#delete-btn');
      const cancelBtn = modal.querySelector('#cancel-btn');
      
      if (editBtn) {
        editBtn.addEventListener('click', handleActionEdit);
        editBtn.addEventListener('mouseenter', (e) => {
          (e.target as HTMLElement).style.background = '#e3f2fd';
          (e.target as HTMLElement).style.color = '#1976d2';
        });
        editBtn.addEventListener('mouseleave', (e) => {
          (e.target as HTMLElement).style.background = 'none';
          (e.target as HTMLElement).style.color = '#495057';
        });
      }

      if (colorBtn) {
        colorBtn.addEventListener('click', handleActionColorChange);
        colorBtn.addEventListener('mouseenter', (e) => {
          (e.target as HTMLElement).style.background = '#f3e5f5';
          (e.target as HTMLElement).style.color = '#7b1fa2';
        });
        colorBtn.addEventListener('mouseleave', (e) => {
          (e.target as HTMLElement).style.background = 'none';
          (e.target as HTMLElement).style.color = '#495057';
        });
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', handleActionDelete);
        deleteBtn.addEventListener('mouseenter', (e) => {
          (e.target as HTMLElement).style.background = '#ffebee';
          (e.target as HTMLElement).style.color = '#d32f2f';
        });
        deleteBtn.addEventListener('mouseleave', (e) => {
          (e.target as HTMLElement).style.background = 'none';
          (e.target as HTMLElement).style.color = '#495057';
        });
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', handleActionCancel);
        cancelBtn.addEventListener('mouseenter', (e) => {
          (e.target as HTMLElement).style.background = '#f5f5f5';
          (e.target as HTMLElement).style.color = '#666';
        });
        cancelBtn.addEventListener('mouseleave', (e) => {
          (e.target as HTMLElement).style.background = 'none';
          (e.target as HTMLElement).style.color = '#495057';
        });
      }
      
      // 오버레이 클릭으로 닫기
      overlay.addEventListener('click', handleActionCancel);
      
      document.body.appendChild(overlay);
      document.body.appendChild(modal);
      
      return () => {
        const existingOverlay = document.getElementById('textclip-modal-overlay');
        const existingModal = document.getElementById('textclip-action-modal');
        if (existingOverlay) document.body.removeChild(existingOverlay);
        if (existingModal) document.body.removeChild(existingModal);
      };
    }
  }, [showActionModal, selectedTextClip, modalPosition]);

  // 텍스트 클립 내용 표시 모달
  useEffect(() => {
    if (showContentModal && selectedContentClip) {
      // 오버레이 생성
      const overlay = document.createElement('div');
      overlay.id = 'textclip-content-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 99998;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      // 모달 생성
      const modal = document.createElement('div');
      modal.id = 'textclip-content-modal';
      modal.style.cssText = `
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 99999;
        width: 500px;
        max-width: 90vw;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        font-family: inherit;
      `;
      
      const processedContent = selectedContentClip.content;
      
      modal.innerHTML = `
        <div style="
          padding: 20px;
          border-bottom: 1px solid #e9ecef;
          background: ${selectedContentClip.color || '#4A90E2'};
          border-radius: 12px 12px 0 0;
          color: white;
        ">
          <h3 style="
            margin: 0;
            font-size: 18px;
            font-weight: 600;
          ">${selectedContentClip.title}</h3>
          <p style="
            margin: 4px 0 0 0;
            font-size: 12px;
            opacity: 0.9;
          ">텍스트 클립</p>
        </div>
        <div style="
          padding: 20px;
          flex: 1;
          overflow-y: auto;
        ">
          <textarea readonly style="
            width: 100%;
            min-height: 675px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 12px;
            font-size: 14px;
            font-family: inherit;
            line-height: 1.5;
            resize: vertical;
            box-sizing: border-box;
            background: #f8f9fa;
          ">${processedContent}</textarea>
        </div>
        <div style="
          padding: 16px 20px;
          border-top: 1px solid #e9ecef;
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          border-radius: 0 0 12px 12px;
          background: #f8f9fa;
        ">
          <button id="copy-btn" style="
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          ">📋 복사</button>
          <button id="edit-btn" style="
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          ">✏️ 편집</button>
          <button id="delete-btn" style="
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          ">🗑️ 삭제</button>
          <button id="close-btn" style="
            background: #6c757d;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          ">취소</button>
        </div>
      `;
      
      // 이벤트 리스너 추가
      const copyBtn = modal.querySelector('#copy-btn');
      const editBtn = modal.querySelector('#edit-btn');
      const deleteBtn = modal.querySelector('#delete-btn');
      const closeBtn = modal.querySelector('#close-btn');
      
      if (copyBtn) {
        copyBtn.addEventListener('click', () => handleCopyFromModal(selectedContentClip));
        copyBtn.addEventListener('mouseenter', (e) => {
          (e.target as HTMLElement).style.background = '#218838';
        });
        copyBtn.addEventListener('mouseleave', (e) => {
          (e.target as HTMLElement).style.background = '#28a745';
        });
      }
      
      if (editBtn) {
        editBtn.addEventListener('click', handleEditFromModal);
        editBtn.addEventListener('mouseenter', (e) => {
          (e.target as HTMLElement).style.background = '#0056b3';
        });
        editBtn.addEventListener('mouseleave', (e) => {
          (e.target as HTMLElement).style.background = '#007bff';
        });
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteFromModal);
        deleteBtn.addEventListener('mouseenter', (e) => {
          (e.target as HTMLElement).style.background = '#c82333';
        });
        deleteBtn.addEventListener('mouseleave', (e) => {
          (e.target as HTMLElement).style.background = '#dc3545';
        });
      }
      
      if (closeBtn) {
        closeBtn.addEventListener('click', handleCloseContentModal);
        closeBtn.addEventListener('mouseenter', (e) => {
          (e.target as HTMLElement).style.background = '#5a6268';
        });
        closeBtn.addEventListener('mouseleave', (e) => {
          (e.target as HTMLElement).style.background = '#6c757d';
        });
      }
      
      // 오버레이 클릭 시 닫기
      overlay.addEventListener('click', handleCloseContentModal);
      modal.addEventListener('click', (e) => e.stopPropagation());
      
      // DOM에 추가
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      return () => {
        const existingOverlay = document.getElementById('textclip-content-overlay');
        if (existingOverlay) document.body.removeChild(existingOverlay);
      };
    }
  }, [showContentModal, selectedContentClip]);

  return (
    <div className={`text-clip-bar ${className}`}>
      <div className="text-clip-list">
        {textClips.map((textClip, index) => {
          return (
            <button
              key={textClip.id}
              data-clip-id={textClip.id}
              className={`text-clip-item ${textClip.type === 'template' ? 'template' : ''} ${draggedTextClip === textClip.id ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
              style={{ backgroundColor: textClip.color || '#4A90E2' }}
              draggable
              onDragStart={(e) => handleDragStart(e, textClip.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => handleTextClipClick(textClip)}
              onDoubleClick={() => handleEditTextClip(textClip)}
              onContextMenu={(e) => handleRightClick(e, textClip)}
              title={`${textClip.title}\n\n${textClip.content.length > 50 ? textClip.content.substring(0, 50) + '...' : textClip.content}`}
            >
              {textClip.title}
            </button>
          );
        })}
        
        <button
          className="text-clip-add"
          onClick={() => {
            setEditingTextClip(null);
            setShowAddModal(true);
          }}
          title="텍스트 클립 추가"
        >
          +
        </button>
      </div>

      {showAddModal && (
        <TextClipModal
          textClip={editingTextClip}
          onSave={editingTextClip ? handleUpdateTextClip : handleAddTextClip}
          onCancel={() => {
            setShowAddModal(false);
            setEditingTextClip(null);
          }}
        />
      )}
    </div>
  );
};

// 텍스트 클립 추가/편집 모달
interface TextClipModalProps {
  textClip?: TextClip | null;
  onSave: (title: string, content: string) => void;
  onCancel: () => void;
}

const TextClipModal: React.FC<TextClipModalProps> = ({ textClip, onSave, onCancel }) => {
  const [title, setTitle] = useState(textClip?.title || '');
  const [content, setContent] = useState(textClip?.content || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onSave(title.trim(), content.trim());
    }
  };

  return (
    <div className="bookmark-modal-overlay">
      <div className="bookmark-modal" style={{ width: '500px', maxWidth: '90vw' }}>
        <h3>{textClip ? '텍스트 클립 편집' : '텍스트 클립 추가'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>제목 (10글자 이내)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 10))}
              placeholder="회사서명"
              maxLength={10}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="안녕하세요.&#10;저는 홍길동입니다.&#10;&#10;감사합니다."
              rows={27}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onCancel}>취소</button>
            <button type="submit">저장</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TextClipBar;