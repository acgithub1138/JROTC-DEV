import { create } from 'zustand';

export type ViewMode = 'editor' | 'preview' | 'html' | 'json';
export type PreviewMode = 'desktop' | 'mobile';

// Use a flexible type for our document structure
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EmailBuilderDocument = Record<string, any>;

interface EmailBuilderState {
  document: EmailBuilderDocument;
  selectedBlockId: string | null;
  viewMode: ViewMode;
  previewMode: PreviewMode;
  history: EmailBuilderDocument[];
  historyIndex: number;
  
  // Actions
  setDocument: (doc: EmailBuilderDocument) => void;
  setSelectedBlockId: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  updateBlock: (blockId: string, updates: Record<string, any>) => void;
  deleteBlock: (blockId: string) => void;
  addBlock: (blockType: string, afterBlockId?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  reset: () => void;
}

const DEFAULT_DOCUMENT: EmailBuilderDocument = {
  root: {
    type: 'EmailLayout',
    data: {
      backdropColor: '#f5f5f5',
      canvasColor: '#ffffff',
      textColor: '#333333',
      fontFamily: 'MODERN_SANS',
      childrenIds: [],
    },
  },
};

export const useEmailBuilderStore = create<EmailBuilderState>((set, get) => ({
  document: DEFAULT_DOCUMENT,
  selectedBlockId: null,
  viewMode: 'editor',
  previewMode: 'desktop',
  history: [DEFAULT_DOCUMENT],
  historyIndex: 0,

  setDocument: (doc) => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(doc);
    set({ 
      document: doc, 
      history: newHistory, 
      historyIndex: newHistory.length - 1 
    });
  },

  setSelectedBlockId: (id) => set({ selectedBlockId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setPreviewMode: (mode) => set({ previewMode: mode }),

  updateBlock: (blockId, updates) => {
    const state = get();
    const doc = { ...state.document };
    if (doc[blockId]) {
      doc[blockId] = {
        ...doc[blockId],
        data: { ...doc[blockId].data, ...updates },
      };
      state.setDocument(doc);
    }
  },

  deleteBlock: (blockId) => {
    const state = get();
    const doc = { ...state.document };
    
    // Remove from parent's childrenIds
    Object.keys(doc).forEach(key => {
      const block = doc[key];
      if (block.data?.childrenIds?.includes(blockId)) {
        doc[key] = {
          ...block,
          data: {
            ...block.data,
            childrenIds: block.data.childrenIds.filter((id: string) => id !== blockId),
          },
        };
      }
    });
    
    // Delete the block itself
    delete doc[blockId];
    state.setDocument(doc);
    set({ selectedBlockId: null });
  },

  addBlock: (blockType, afterBlockId) => {
    const state = get();
    const doc = { ...state.document };
    const blockId = `block-${Date.now()}`;
    
    // Create new block based on type
    let newBlock: any = { type: blockType, data: {} };
    
    switch (blockType) {
      case 'Text':
        newBlock.data = { 
          style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
          props: { text: 'Enter your text here...' }
        };
        break;
      case 'Heading':
        newBlock.data = { 
          style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
          props: { text: 'Heading', level: 'h2' }
        };
        break;
      case 'Button':
        newBlock.data = { 
          style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
          props: { 
            text: 'Click me', 
            url: '#',
            buttonBackgroundColor: '#3b82f6',
            buttonTextColor: '#ffffff'
          }
        };
        break;
      case 'Image':
        newBlock.data = { 
          style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
          props: { 
            url: 'https://placehold.co/600x200',
            alt: 'Image',
            contentAlignment: 'middle'
          }
        };
        break;
      case 'Divider':
        newBlock.data = { 
          style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
          props: { lineColor: '#e0e0e0' }
        };
        break;
      case 'Spacer':
        newBlock.data = { 
          props: { height: 32 }
        };
        break;
      case 'Html':
        newBlock.data = { 
          style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
          props: { contents: '<p>Custom HTML here</p>' }
        };
        break;
      default:
        newBlock.data = { props: {} };
    }
    
    doc[blockId] = newBlock;
    
    // Add to root's children
    const rootChildrenIds = [...(doc.root.data.childrenIds || [])];
    if (afterBlockId) {
      const afterIndex = rootChildrenIds.indexOf(afterBlockId);
      if (afterIndex !== -1) {
        rootChildrenIds.splice(afterIndex + 1, 0, blockId);
      } else {
        rootChildrenIds.push(blockId);
      }
    } else {
      rootChildrenIds.push(blockId);
    }
    
    doc.root = {
      ...doc.root,
      data: { ...doc.root.data, childrenIds: rootChildrenIds },
    };
    
    state.setDocument(doc);
    set({ selectedBlockId: blockId });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      set({ 
        document: state.history[newIndex], 
        historyIndex: newIndex,
        selectedBlockId: null 
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      set({ 
        document: state.history[newIndex], 
        historyIndex: newIndex,
        selectedBlockId: null 
      });
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  reset: () => set({
    document: DEFAULT_DOCUMENT,
    selectedBlockId: null,
    viewMode: 'editor',
    previewMode: 'desktop',
    history: [DEFAULT_DOCUMENT],
    historyIndex: 0,
  }),
}));

export { DEFAULT_DOCUMENT };
