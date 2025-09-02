import React from 'react';
import MobileTabLayout from './MobileTabLayout';
import MobileSlideView from '../MobileSlideView/MobileSlideView';
import SidebarBookmarks from '../SidebarBookmarks';
import RightSidebarBookmarks from '../RightSidebarBookmarks';
import './FiveColumnLayout.css';

interface FiveColumnLayoutProps {
  categoryPanel: React.ReactNode;
  folderPanel: React.ReactNode;
  documentPanel: React.ReactNode;
  isMobile?: boolean;
}

const FiveColumnLayout: React.FC<FiveColumnLayoutProps> = ({
  categoryPanel,
  folderPanel,
  documentPanel,
  isMobile = false
}) => {
  if (isMobile) {
    return <MobileSlideView />;
  }

  return (
    <div className="five-column-layout desktop">
      <SidebarBookmarks />
      <div className="category-panel">
        {categoryPanel}
      </div>
      <div className="folder-panel">
        {folderPanel}
      </div>
      <div className="document-panel">
        {documentPanel}
      </div>
      <RightSidebarBookmarks />
    </div>
  );
};

export default FiveColumnLayout;