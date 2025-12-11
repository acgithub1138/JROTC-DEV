import React, { useEffect, useState } from 'react';
import { EmailBuilderToolbar } from './EmailBuilderToolbar';
import { EmailBuilderSidebar } from './EmailBuilderSidebar';
import { EmailBuilderCanvas } from './EmailBuilderCanvas';
import { EmailBuilderPropertiesPanel } from './EmailBuilderPropertiesPanel';
import { EmailBuilderPreview } from './EmailBuilderPreview';
import { useEmailBuilderStore, DEFAULT_DOCUMENT, type EmailBuilderDocument } from './EmailBuilderContext';
import { VariablesPanel } from '@/components/email-management/dialogs/components/VariablesPanel';
import { cn } from '@/lib/utils';

interface EmailBuilderProps {
  initialDocument?: EmailBuilderDocument | null;
  onChange?: (document: EmailBuilderDocument) => void;
  columns?: Array<{ name: string; label: string }>;
  enhancedVariables?: Array<{ name: string; label: string; description?: string }>;
  groupedReferenceFields?: Array<{
    group: string;
    groupLabel: string;
    fields: Array<{ name: string; label: string }>;
  }>;
}

export const EmailBuilder: React.FC<EmailBuilderProps> = ({
  initialDocument,
  onChange,
  columns = [],
  enhancedVariables = [],
  groupedReferenceFields = [],
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { 
    document, 
    setDocument, 
    viewMode, 
    selectedBlockId,
    updateBlock,
    addBlock,
    reset 
  } = useEmailBuilderStore();

  // Initialize with provided document or reset to default
  useEffect(() => {
    if (initialDocument && Object.keys(initialDocument).length > 0) {
      // Set document without adding to history (initial load)
      useEmailBuilderStore.setState({ 
        document: initialDocument,
        history: [initialDocument],
        historyIndex: 0 
      });
    } else {
      reset();
    }
  }, []);

  // Notify parent of changes
  useEffect(() => {
    onChange?.(document);
  }, [document, onChange]);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  const handleVariableInsert = (variableName: string) => {
    const variableText = `{{${variableName}}}`;
    
    if (selectedBlockId) {
      const block = document[selectedBlockId];
      if (block && (block.type === 'Text' || block.type === 'Heading')) {
        const currentText = block.data?.props?.text || '';
        updateBlock(selectedBlockId, {
          props: { ...block.data?.props, text: currentText + variableText },
        });
        return;
      }
    }
    
    // If no text block is selected, create a new text block with the variable
    addBlock('Text');
    // The new block will be selected automatically, update it in the next tick
    setTimeout(() => {
      const state = useEmailBuilderStore.getState();
      if (state.selectedBlockId) {
        state.updateBlock(state.selectedBlockId, {
          props: { text: variableText },
        });
      }
    }, 0);
  };

  return (
    <div className={cn(
      "border rounded-lg overflow-hidden bg-background",
      isFullscreen && "fixed inset-0 z-50 rounded-none border-0"
    )}>
      <EmailBuilderToolbar 
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />
      
      <div className={cn(
        "flex",
        isFullscreen ? "h-[calc(100vh-49px)]" : "h-[500px]"
      )}>
        {viewMode === 'editor' && (
          <>
            {/* Sidebar */}
            <div className="w-56 flex-shrink-0">
              <EmailBuilderSidebar />
            </div>
            
            {/* Canvas */}
            <div className="flex-1 border-x">
              <EmailBuilderCanvas />
            </div>
            
            {/* Properties Panel */}
            <div className="w-64 flex-shrink-0">
              <EmailBuilderPropertiesPanel />
            </div>
            
            {/* Variables Panel */}
            <div className="w-56 flex-shrink-0 border-l">
              <VariablesPanel
                columns={columns}
                enhancedVariables={enhancedVariables}
                groupedReferenceFields={groupedReferenceFields}
                onVariableInsert={handleVariableInsert}
              />
            </div>
          </>
        )}
        
        {(viewMode === 'preview' || viewMode === 'html' || viewMode === 'json') && (
          <div className="flex-1">
            <EmailBuilderPreview />
          </div>
        )}
      </div>
    </div>
  );
};

export { useEmailBuilderStore, DEFAULT_DOCUMENT } from './EmailBuilderContext';
export type { EmailBuilderDocument } from './EmailBuilderContext';
