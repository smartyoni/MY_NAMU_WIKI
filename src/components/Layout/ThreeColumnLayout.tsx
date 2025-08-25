import React from 'react';
import './ThreeColumnLayout.css';

interface ThreeColumnLayoutProps {
  categoryPanel: React.ReactNode;
  folderPanel: React.ReactNode;
  documentPanel: React.ReactNode;
  isMobile?: boolean;
}

const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  categoryPanel,
  folderPanel,
  documentPanel,
  isMobile = false
}) => {
  if (isMobile) {
    return (
      <div className="three-column-layout mobile">
        <div className="mobile-panels">
          {categoryPanel}
          {folderPanel}
        </div>
        <div className="document-panel-mobile">
          {documentPanel}
        </div>
      </div>
    );
  }

  return (
    <div className="three-column-layout desktop">
      <div className="category-panel">
        {categoryPanel}
      </div>
      <div className="folder-panel">
        {folderPanel}
      </div>
      <div className="document-panel">
        {documentPanel}
      </div>
    </div>
  );
};

export default ThreeColumnLayout;