import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Type, 
  Heading1, 
  MousePointer2, 
  Image, 
  Minus, 
  Space, 
  Code,
  LayoutGrid
} from 'lucide-react';
import { useEmailBuilderStore } from './EmailBuilderContext';

interface BlockType {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const BLOCK_TYPES: BlockType[] = [
  { type: 'Text', label: 'Text', icon: <Type className="h-4 w-4" />, description: 'Add paragraph text' },
  { type: 'Heading', label: 'Heading', icon: <Heading1 className="h-4 w-4" />, description: 'Add a heading' },
  { type: 'Button', label: 'Button', icon: <MousePointer2 className="h-4 w-4" />, description: 'Add a clickable button' },
  { type: 'Image', label: 'Image', icon: <Image className="h-4 w-4" />, description: 'Add an image' },
  { type: 'Divider', label: 'Divider', icon: <Minus className="h-4 w-4" />, description: 'Add a horizontal line' },
  { type: 'Spacer', label: 'Spacer', icon: <Space className="h-4 w-4" />, description: 'Add vertical space' },
  { type: 'Html', label: 'HTML', icon: <Code className="h-4 w-4" />, description: 'Add custom HTML' },
];

export const EmailBuilderSidebar: React.FC = () => {
  const { addBlock, selectedBlockId } = useEmailBuilderStore();

  const handleAddBlock = (blockType: string) => {
    addBlock(blockType, selectedBlockId || undefined);
  };

  return (
    <Card className="h-full border-r rounded-none">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium">Blocks</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="p-2 space-y-1">
            {BLOCK_TYPES.map((block) => (
              <Button
                key={block.type}
                variant="ghost"
                className="w-full justify-start h-auto py-2 px-3 hover:bg-muted"
                onClick={() => handleAddBlock(block.type)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-shrink-0 w-8 h-8 rounded bg-muted flex items-center justify-center">
                    {block.icon}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">{block.label}</div>
                    <div className="text-xs text-muted-foreground">{block.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
