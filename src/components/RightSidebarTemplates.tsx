import React, { useState, useRef, useEffect } from 'react';
import { DocumentTemplate, TemplateVariable } from '../types';
import { useDocuments } from '../context/DocumentContextFirebase';
import './RightSidebarTemplates.css';

const RightSidebarTemplates: React.FC = () => {
  const { documentTemplates, createDocumentTemplate, deleteDocumentTemplate, updateDocumentTemplate } = useDocuments();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [completedTemplate, setCompletedTemplate] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    template: DocumentTemplate;
  } | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    content: '',
    variables: [] as TemplateVariable[],
    color: '#4A90E2'
  });

  const createModalRef = useRef<HTMLDivElement>(null);
  const variableModalRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 모달 및 컨텍스트 메뉴 외부 클릭시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 생성 모달 외부 클릭시 닫기
      if (createModalRef.current && !createModalRef.current.contains(event.target as Node)) {
        setIsCreateModalOpen(false);
      }
      
      // 변수 입력 모달 외부 클릭시 닫기
      if (variableModalRef.current && !variableModalRef.current.contains(event.target as Node)) {
        setIsVariableModalOpen(false);
        setSelectedTemplate(null);
        setVariableValues({});
      }
      
      // 컨텍스트 메뉴 외부 클릭시 닫기
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 변수 삽입 함수들
  const insertVariable = (variableName: string) => {
    if (contentTextareaRef.current) {
      const textarea = contentTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = newTemplate.content.substring(0, start);
      const after = newTemplate.content.substring(end);
      const variableText = `{{${variableName}}}`;
      
      const newContent = before + variableText + after;
      setNewTemplate(prev => ({ ...prev, content: newContent }));
      handleContentChange(newContent);
      
      // 커서 위치를 변수 뒤로 이동
      setTimeout(() => {
        const newCursorPos = start + variableText.length;
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 10);
    }
  };

  const insertCustomVariable = () => {
    const customVariableName = prompt('변수명을 입력하세요:');
    if (customVariableName && customVariableName.trim()) {
      insertVariable(customVariableName.trim());
    }
  };

  const handleContextMenu = (event: React.MouseEvent, template: DocumentTemplate) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      template
    });
  };

  const handleEditTemplate = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      title: template.title,
      content: template.content,
      variables: [...template.variables],
      color: template.color || '#4A90E2'
    });
    setIsCreateModalOpen(true);
    setContextMenu(null);
  };

  const handleDuplicateTemplate = async (template: DocumentTemplate) => {
    try {
      await createDocumentTemplate(
        `${template.title} (복사본)`,
        template.content,
        template.variables,
        template.color
      );
      setContextMenu(null);
    } catch (error) {
      console.error('템플릿 복제 실패:', error);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.title.trim() || !newTemplate.content.trim()) return;

    try {
      if (editingTemplate) {
        // 편집 모드
        await updateDocumentTemplate(editingTemplate.id, {
          title: newTemplate.title,
          content: newTemplate.content,
          variables: newTemplate.variables,
          color: newTemplate.color
        });
        setEditingTemplate(null);
      } else {
        // 생성 모드
        await createDocumentTemplate(
          newTemplate.title,
          newTemplate.content,
          newTemplate.variables,
          newTemplate.color
        );
      }
      
      setNewTemplate({
        title: '',
        content: '',
        variables: [],
        color: '#4A90E2'
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('템플릿 생성/수정 실패:', error);
      alert('템플릿 생성 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('이 템플릿을 삭제하시겠습니까?')) {
      try {
        await deleteDocumentTemplate(templateId);
      } catch (error) {
        console.error('템플릿 삭제 실패:', error);
      }
    }
  };

  const extractVariablesFromContent = (content: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = [];
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      if (!matches.includes(match[1].trim())) {
        matches.push(match[1].trim());
      }
    }
    return matches;
  };

  const handleContentChange = (content: string) => {
    const extractedVars = extractVariablesFromContent(content);
    const updatedVariables = extractedVars.map(varName => {
      const existing = newTemplate.variables.find(v => v.name === varName);
      return existing || { name: varName, type: 'text' as const, placeholder: '' };
    });

    setNewTemplate(prev => ({
      ...prev,
      content,
      variables: updatedVariables
    }));
  };

  const handleTemplateUse = (template: DocumentTemplate) => {
    if (template.variables.length === 0) {
      // 변수가 없으면 바로 삽입
      const event = new CustomEvent('insertTemplate', { detail: template.content });
      window.dispatchEvent(event);
    } else {
      // 변수가 있으면 모달 열기
      setSelectedTemplate(template);
      const initialValues: Record<string, string> = {};
      template.variables.forEach(variable => {
        initialValues[variable.name] = '';
      });
      setVariableValues(initialValues);
      setIsVariableModalOpen(true);
    }
  };

  const handleVariableSubmit = () => {
    if (!selectedTemplate) return;

    let processedContent = selectedTemplate.content;
    Object.entries(variableValues).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      processedContent = processedContent.replace(regex, value);
    });

    // 완성된 템플릿을 결과 모달에 표시
    setCompletedTemplate(processedContent);
    setIsVariableModalOpen(false);
    setIsResultModalOpen(true);
    
    // 변수 값들은 유지해서 결과 모달에서 뒤로가기 가능하게 함
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(completedTemplate);
      alert('클립보드에 복사되었습니다!');
    } catch (err) {
      // 폴백: 텍스트 영역 생성해서 복사
      const textArea = document.createElement('textarea');
      textArea.value = completedTemplate;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('클립보드에 복사되었습니다!');
    }
  };

  const handleResultClose = () => {
    setIsResultModalOpen(false);
    setSelectedTemplate(null);
    setVariableValues({});
    setCompletedTemplate('');
  };

  const handleBackToVariables = () => {
    setIsResultModalOpen(false);
    setIsVariableModalOpen(true);
  };

  const addVariable = () => {
    setNewTemplate(prev => ({
      ...prev,
      variables: [...prev.variables, { name: '', type: 'text', placeholder: '' }]
    }));
  };

  const updateVariable = (index: number, field: keyof TemplateVariable, value: string) => {
    setNewTemplate(prev => ({
      ...prev,
      variables: prev.variables.map((variable, i) => 
        i === index ? { ...variable, [field]: value } : variable
      )
    }));
  };

  const removeVariable = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="right-sidebar-templates">
      <div className="templates-header">
        <h3>📋 템플릿 모음</h3>
        <button 
          className="add-template-btn"
          onClick={() => setIsCreateModalOpen(true)}
          title="새 템플릿 추가"
        >
          +
        </button>
      </div>

      <div className="templates-list">
        {documentTemplates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-message">아직 생성된 템플릿이 없습니다</div>
            <div className="empty-state-subtitle">+ 버튼을 눌러 첫 템플릿을 만들어보세요!</div>
          </div>
        ) : (
          documentTemplates.map((template) => (
          <div key={template.id} className="template-item">
            <button
              className="template-use-btn"
              style={{ backgroundColor: template.color }}
              onClick={() => handleTemplateUse(template)}
              onContextMenu={(e) => handleContextMenu(e, template)}
              title={`${template.title} 사용`}
            >
              <div className="template-title">{template.title}</div>
              {template.variables.length > 0 && (
                <div className="template-vars">
                  {template.variables.map(v => `{{${v.name}}}`).join(', ')}
                </div>
              )}
            </button>
          </div>
          ))
        )}
      </div>

      {/* 템플릿 생성 모달 */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="template-modal" ref={createModalRef}>
            <div className="modal-header">
              <h4>{editingTemplate ? '템플릿 편집' : '새 템플릿 생성'}</h4>
              <button 
                className="close-btn"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingTemplate(null);
                  setNewTemplate({
                    title: '',
                    content: '',
                    variables: [],
                    color: '#4A90E2'
                  });
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>제목</label>
                <input
                  type="text"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="템플릿 제목을 입력하세요"
                />
              </div>

              <div className="form-group color-and-variables">
                <div className="color-input-group">
                  <label>색상</label>
                  <input
                    type="color"
                    value={newTemplate.color}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
                <div className="variable-buttons-group">
                  <label>변수 삽입</label>
                  <div className="variable-buttons">
                    <button
                      type="button"
                      className="variable-insert-btn"
                      onClick={() => insertVariable('이름')}
                      title="{{이름}} 변수 삽입"
                    >
                      {`{{이름}}`}
                    </button>
                    <button
                      type="button"
                      className="variable-insert-btn"
                      onClick={() => insertVariable('날짜')}
                      title="{{날짜}} 변수 삽입"
                    >
                      {`{{날짜}}`}
                    </button>
                    <button
                      type="button"
                      className="variable-insert-btn"
                      onClick={() => insertVariable('장소')}
                      title="{{장소}} 변수 삽입"
                    >
                      {`{{장소}}`}
                    </button>
                    <button
                      type="button"
                      className="variable-insert-btn custom"
                      onClick={insertCustomVariable}
                      title="사용자 정의 변수 삽입"
                    >
{`{{...}}`}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>내용 <span className="hint">변수는 {`{{변수명}}`} 형태로 입력</span></label>
                <textarea
                  ref={contentTextareaRef}
                  value={newTemplate.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder={`템플릿 내용을 입력하세요. 변수는 {{이름}}, {{날짜}} 형태로 입력할 수 있습니다.`}
                  rows={8}
                />
              </div>

              {newTemplate.variables.length > 0 && (
                <div className="form-group">
                  <label>변수 설정</label>
                  {newTemplate.variables.map((variable, index) => (
                    <div key={index} className="variable-config">
                      <input
                        type="text"
                        value={variable.name}
                        onChange={(e) => updateVariable(index, 'name', e.target.value)}
                        placeholder="변수명"
                        readOnly
                      />
                      <select
                        value={variable.type}
                        onChange={(e) => updateVariable(index, 'type', e.target.value as 'text' | 'date' | 'number')}
                      >
                        <option value="text">텍스트</option>
                        <option value="date">날짜</option>
                        <option value="number">숫자</option>
                      </select>
                      <input
                        type="text"
                        value={variable.placeholder || ''}
                        onChange={(e) => updateVariable(index, 'placeholder', e.target.value)}
                        placeholder="안내 텍스트"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingTemplate(null);
                  setNewTemplate({
                    title: '',
                    content: '',
                    variables: [],
                    color: '#4A90E2'
                  });
                }}
              >
                취소
              </button>
              <button 
                className="create-btn"
                onClick={handleCreateTemplate}
                disabled={!newTemplate.title.trim() || !newTemplate.content.trim()}
              >
                {editingTemplate ? '수정' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 변수 입력 모달 */}
      {isVariableModalOpen && selectedTemplate && (
        <div className="modal-overlay">
          <div className="variable-modal" ref={variableModalRef}>
            <div className="modal-header">
              <h4>{selectedTemplate.title} - 변수 입력</h4>
              <button 
                className="close-btn"
                onClick={() => {
                  setIsVariableModalOpen(false);
                  setSelectedTemplate(null);
                  setVariableValues({});
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              {selectedTemplate.variables.map((variable) => (
                <div key={variable.name} className="form-group">
                  <label>{variable.name}</label>
                  <input
                    type={variable.type === 'date' ? 'date' : variable.type === 'number' ? 'number' : 'text'}
                    value={variableValues[variable.name] || ''}
                    onChange={(e) => setVariableValues(prev => ({
                      ...prev,
                      [variable.name]: e.target.value
                    }))}
                    placeholder={variable.placeholder || `${variable.name}을 입력하세요`}
                  />
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setIsVariableModalOpen(false);
                  setSelectedTemplate(null);
                  setVariableValues({});
                }}
              >
                취소
              </button>
              <button 
                className="apply-btn"
                onClick={handleVariableSubmit}
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 템플릿 결과 모달 */}
      {isResultModalOpen && (
        <div className="modal-overlay">
          <div className="template-modal result-modal">
            <div className="modal-header">
              <h4>완성된 템플릿</h4>
              <button
                className="close-btn"
                onClick={handleResultClose}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>완성된 내용</label>
                <textarea
                  value={completedTemplate}
                  onChange={(e) => setCompletedTemplate(e.target.value)}
                  placeholder="완성된 템플릿 내용"
                  rows={8}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={handleBackToVariables}
              >
                ← 변수 입력으로 돌아가기
              </button>
              <button
                className="create-btn"
                onClick={handleCopyToClipboard}
              >
                📋 복사하기
              </button>
              <button
                className="apply-btn"
                onClick={handleResultClose}
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div 
          ref={contextMenuRef}
          className="template-context-menu"
          style={{ 
            position: 'fixed', 
            left: contextMenu.x, 
            top: contextMenu.y,
            zIndex: 1001
          }}
        >
          <button
            className="context-menu-item"
            onClick={() => handleTemplateUse(contextMenu.template)}
          >
            📄 사용하기
          </button>
          <button
            className="context-menu-item"
            onClick={() => handleEditTemplate(contextMenu.template)}
          >
            ✏️ 편집하기
          </button>
          <button
            className="context-menu-item"
            onClick={() => handleDuplicateTemplate(contextMenu.template)}
          >
            📋 복제하기
          </button>
          <hr className="context-menu-divider" />
          <button
            className="context-menu-item danger"
            onClick={() => {
              handleDeleteTemplate(contextMenu.template.id);
              setContextMenu(null);
            }}
          >
            🗑️ 삭제하기
          </button>
        </div>
      )}
    </div>
  );
};

export default RightSidebarTemplates;