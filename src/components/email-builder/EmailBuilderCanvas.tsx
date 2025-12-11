import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useEmailBuilderStore } from './EmailBuilderContext';
import { cn } from '@/lib/utils';

export const EmailBuilderCanvas: React.FC = () => {
  const { document, selectedBlockId, setSelectedBlockId, deleteBlock, setDocument } = useEmailBuilderStore();

  const rootBlock = document.root;
  const childrenIds: string[] = rootBlock?.data?.childrenIds || [];

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    const currentIndex = childrenIds.indexOf(blockId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= childrenIds.length) return;

    const newChildrenIds = [...childrenIds];
    [newChildrenIds[currentIndex], newChildrenIds[newIndex]] = [newChildrenIds[newIndex], newChildrenIds[currentIndex]];

    setDocument({
      ...document,
      root: {
        ...document.root,
        data: { ...document.root.data, childrenIds: newChildrenIds },
      },
    });
  };

  const renderBlockContent = (blockId: string) => {
    const block = document[blockId];
    if (!block) return null;

    const { type, data } = block;
    const props = data?.props || {};

    switch (type) {
      case 'Text':
        return (
          <p className="text-sm" style={{ margin: 0 }}>
            {props.text || 'Enter your text here...'}
          </p>
        );
      case 'Heading':
        const HeadingTag = (props.level || 'h2') as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag className="font-bold" style={{ margin: 0 }}>
            {props.text || 'Heading'}
          </HeadingTag>
        );
      case 'Button':
        return (
          <div className="text-center">
            <span 
              className="inline-block px-4 py-2 rounded text-sm font-medium"
              style={{ 
                backgroundColor: props.buttonBackgroundColor || '#3b82f6',
                color: props.buttonTextColor || '#ffffff'
              }}
            >
              {props.text || 'Click me'}
            </span>
          </div>
        );
      case 'Image':
        return (
          <div className="text-center">
            <img 
              src={props.url || 'https://placehold.co/600x200'} 
              alt={props.alt || 'Image'} 
              className="max-w-full h-auto"
              style={{ maxHeight: '200px' }}
            />
          </div>
        );
      case 'Divider':
        return (
          <hr style={{ borderColor: props.lineColor || '#e0e0e0', margin: '8px 0' }} />
        );
      case 'Spacer':
        return (
          <div 
            className="bg-muted/30 border border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground"
            style={{ height: props.height || 32 }}
          >
            Spacer ({props.height || 32}px)
          </div>
        );
      case 'Html':
        return (
          <div 
            className="text-sm bg-muted/20 p-2 rounded border border-dashed"
            dangerouslySetInnerHTML={{ __html: props.contents || '<p>Custom HTML here</p>' }}
          />
        );
      default:
        return <div className="text-sm text-muted-foreground">Unknown block type: {type}</div>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4" style={{ backgroundColor: rootBlock?.data?.backdropColor || '#f5f5f5' }}>
        <ScrollArea className="h-full">
          <div 
            className="max-w-2xl mx-auto shadow-lg min-h-[400px]"
            style={{ backgroundColor: rootBlock?.data?.canvasColor || '#ffffff' }}
          >
            {childrenIds.length === 0 ? (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm">No blocks added yet</p>
                  <p className="text-xs mt-1">Click a block in the sidebar to add it</p>
                </div>
              </div>
            ) : (
              <div className="py-4">
                {childrenIds.map((blockId: string, index: number) => {
                  const block = document[blockId];
                  if (!block) return null;
                  
                  const isSelected = selectedBlockId === blockId;
                  const padding = block.data?.style?.padding || {};
                  
                  return (
                    <div
                      key={blockId}
                      className={cn(
                        "relative group cursor-pointer transition-all",
                        isSelected && "ring-2 ring-primary ring-offset-2"
                      )}
                      style={{
                        paddingTop: padding.top || 0,
                        paddingBottom: padding.bottom || 0,
                        paddingLeft: padding.left || 0,
                        paddingRight: padding.right || 0,
                      }}
                      onClick={() => setSelectedBlockId(blockId)}
                    >
                      {/* Block toolbar */}
                      <div className={cn(
                        "absolute -top-3 right-2 flex items-center gap-1 bg-background border rounded shadow-sm z-10",
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveBlock(blockId, 'up');
                          }}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveBlock(blockId, 'down');
                          }}
                          disabled={index === childrenIds.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBlock(blockId);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Block content */}
                      {renderBlockContent(blockId)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
