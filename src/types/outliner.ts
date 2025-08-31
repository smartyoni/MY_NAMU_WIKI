export interface OutlinerNode {
  id: string;
  content: string; // 마크다운 텍스트 내용
  children: OutlinerNode[];
  isCollapsed: boolean;
  level: number;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutlinerDocument {
  id: string;
  title: string;
  nodes: OutlinerNode[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface OutlinerState {
  focusedNodeId?: string;
  selectedNodeIds: string[];
  zoomedNodeId?: string; // 줌 인된 노드 ID
}

export interface NodePosition {
  nodeId: string;
  parentId?: string;
  index: number;
}