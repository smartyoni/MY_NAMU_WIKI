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
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    content: '',
    variables: [] as TemplateVariable[],
    color: '#4A90E2'
  });

  const createModalRef = useRef<HTMLDivElement>(null);
  const variableModalRef = useRef<HTMLDivElement>(null);

  // 모달 외부 클릭시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (createModalRef.current && !createModalRef.current.contains(event.target as Node)) {
        setIsCreateModalOpen(false);
      }
      if (variableModalRef.current && !variableModalRef.current.contains(event.target as Node)) {
        setIsVariableModalOpen(false);
        setSelectedTemplate(null);
        setVariableValues({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateTemplate = async () => {
    if (!newTemplate.title.trim() || !newTemplate.content.trim()) return;

    try {
      await createDocumentTemplate(
        newTemplate.title,
        newTemplate.content,
        newTemplate.variables,
        newTemplate.color
      );
      setNewTemplate({
        title: '',
        content: '',
        variables: [],
        color: '#4A90E2'
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('템플릿 생성 실패:', error);
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

    const event = new CustomEvent('insertTemplate', { detail: processedContent });
    window.dispatchEvent(event);

    setIsVariableModalOpen(false);
    setSelectedTemplate(null);
    setVariableValues({});
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
        {documentTemplates.map((template) => (
          <div key={template.id} className="template-item">
            <button
              className="template-use-btn"
              style={{ backgroundColor: template.color }}
              onClick={() => handleTemplateUse(template)}
              title={`${template.title} 사용`}
            >
              <div className="template-title">{template.title}</div>
              {template.variables.length > 0 && (
                <div className="template-vars">
                  {template.variables.map(v => `{{${v.name}}}`).join(', ')}
                </div>
              )}
            </button>
            <button
              className="template-delete-btn"
              onClick={() => handleDeleteTemplate(template.id)}
              title="템플릿 삭제"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 템플릿 생성 모달 */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="template-modal" ref={createModalRef}>
            <div className="modal-header">
              <h4>새 템플릿 생성</h4>
              <button 
                className="close-btn"
                onClick={() => setIsCreateModalOpen(false)}
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

              <div className="form-group">
                <label>색상</label>
                <input
                  type="color"
                  value={newTemplate.color}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>내용 <span className="hint">변수는 {{변수명}} 형태로 입력</span></label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="템플릿 내용을 입력하세요. 변수는 {{이름}}, {{날짜}} 형태로 입력할 수 있습니다."
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
                onClick={() => setIsCreateModalOpen(false)}
              >
                취소
              </button>
              <button 
                className="create-btn"
                onClick={handleCreateTemplate}
                disabled={!newTemplate.title.trim() || !newTemplate.content.trim()}
              >
                생성
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
    </div>
  );
};

export default RightSidebarTemplates;