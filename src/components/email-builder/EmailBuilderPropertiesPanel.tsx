import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useEmailBuilderStore } from './EmailBuilderContext';

export const EmailBuilderPropertiesPanel: React.FC = () => {
  const { document, selectedBlockId, updateBlock, setDocument } = useEmailBuilderStore();

  const selectedBlock = selectedBlockId ? document[selectedBlockId] : null;
  const rootBlock = document.root;

  const handleRootUpdate = (key: string, value: any) => {
    setDocument({
      ...document,
      root: {
        ...document.root,
        data: { ...document.root.data, [key]: value },
      },
    });
  };

  const handleBlockPropsUpdate = (key: string, value: any) => {
    if (!selectedBlockId || !selectedBlock) return;
    updateBlock(selectedBlockId, {
      props: { ...selectedBlock.data?.props, [key]: value },
    });
  };

  const handlePaddingUpdate = (side: string, value: number) => {
    if (!selectedBlockId || !selectedBlock) return;
    const currentPadding = selectedBlock.data?.style?.padding || {};
    updateBlock(selectedBlockId, {
      style: {
        ...selectedBlock.data?.style,
        padding: { ...currentPadding, [side]: value },
      },
    });
  };

  const renderGlobalSettings = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Background Color</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="color"
            value={rootBlock?.data?.backdropColor || '#f5f5f5'}
            onChange={(e) => handleRootUpdate('backdropColor', e.target.value)}
            className="w-10 h-8 p-1 cursor-pointer"
          />
          <Input
            type="text"
            value={rootBlock?.data?.backdropColor || '#f5f5f5'}
            onChange={(e) => handleRootUpdate('backdropColor', e.target.value)}
            className="flex-1 h-8 text-xs"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Canvas Color</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="color"
            value={rootBlock?.data?.canvasColor || '#ffffff'}
            onChange={(e) => handleRootUpdate('canvasColor', e.target.value)}
            className="w-10 h-8 p-1 cursor-pointer"
          />
          <Input
            type="text"
            value={rootBlock?.data?.canvasColor || '#ffffff'}
            onChange={(e) => handleRootUpdate('canvasColor', e.target.value)}
            className="flex-1 h-8 text-xs"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Text Color</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="color"
            value={rootBlock?.data?.textColor || '#333333'}
            onChange={(e) => handleRootUpdate('textColor', e.target.value)}
            className="w-10 h-8 p-1 cursor-pointer"
          />
          <Input
            type="text"
            value={rootBlock?.data?.textColor || '#333333'}
            onChange={(e) => handleRootUpdate('textColor', e.target.value)}
            className="flex-1 h-8 text-xs"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Font Family</Label>
        <Select
          value={rootBlock?.data?.fontFamily || 'MODERN_SANS'}
          onValueChange={(value) => handleRootUpdate('fontFamily', value)}
        >
          <SelectTrigger className="h-8 text-xs mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MODERN_SANS">Modern Sans</SelectItem>
            <SelectItem value="BOOK_SANS">Book Sans</SelectItem>
            <SelectItem value="ORGANIC_SANS">Organic Sans</SelectItem>
            <SelectItem value="GEOMETRIC_SANS">Geometric Sans</SelectItem>
            <SelectItem value="HEAVY_SANS">Heavy Sans</SelectItem>
            <SelectItem value="ROUNDED_SANS">Rounded Sans</SelectItem>
            <SelectItem value="MODERN_SERIF">Modern Serif</SelectItem>
            <SelectItem value="BOOK_SERIF">Book Serif</SelectItem>
            <SelectItem value="MONOSPACE">Monospace</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderBlockSettings = () => {
    if (!selectedBlock) return null;
    
    const { type, data } = selectedBlock;
    const props = data?.props || {};
    const padding = data?.style?.padding || {};

    return (
      <div className="space-y-4">
        <div className="text-xs font-medium text-muted-foreground uppercase">
          {type} Block
        </div>

        {/* Content settings based on type */}
        {type === 'Text' && (
          <div>
            <Label className="text-xs">Text Content</Label>
            <Textarea
              value={props.text || ''}
              onChange={(e) => handleBlockPropsUpdate('text', e.target.value)}
              className="mt-1 text-xs min-h-[100px]"
              placeholder="Enter your text..."
            />
          </div>
        )}

        {type === 'Heading' && (
          <>
            <div>
              <Label className="text-xs">Heading Text</Label>
              <Input
                value={props.text || ''}
                onChange={(e) => handleBlockPropsUpdate('text', e.target.value)}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Level</Label>
              <Select
                value={props.level || 'h2'}
                onValueChange={(value) => handleBlockPropsUpdate('level', value)}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">H1</SelectItem>
                  <SelectItem value="h2">H2</SelectItem>
                  <SelectItem value="h3">H3</SelectItem>
                  <SelectItem value="h4">H4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {type === 'Button' && (
          <>
            <div>
              <Label className="text-xs">Button Text</Label>
              <Input
                value={props.text || ''}
                onChange={(e) => handleBlockPropsUpdate('text', e.target.value)}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">URL</Label>
              <Input
                value={props.url || ''}
                onChange={(e) => handleBlockPropsUpdate('url', e.target.value)}
                className="mt-1 h-8 text-xs"
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="text-xs">Background Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={props.buttonBackgroundColor || '#3b82f6'}
                  onChange={(e) => handleBlockPropsUpdate('buttonBackgroundColor', e.target.value)}
                  className="w-10 h-8 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={props.buttonBackgroundColor || '#3b82f6'}
                  onChange={(e) => handleBlockPropsUpdate('buttonBackgroundColor', e.target.value)}
                  className="flex-1 h-8 text-xs"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Text Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={props.buttonTextColor || '#ffffff'}
                  onChange={(e) => handleBlockPropsUpdate('buttonTextColor', e.target.value)}
                  className="w-10 h-8 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={props.buttonTextColor || '#ffffff'}
                  onChange={(e) => handleBlockPropsUpdate('buttonTextColor', e.target.value)}
                  className="flex-1 h-8 text-xs"
                />
              </div>
            </div>
          </>
        )}

        {type === 'Image' && (
          <>
            <div>
              <Label className="text-xs">Image URL</Label>
              <Input
                value={props.url || ''}
                onChange={(e) => handleBlockPropsUpdate('url', e.target.value)}
                className="mt-1 h-8 text-xs"
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="text-xs">Alt Text</Label>
              <Input
                value={props.alt || ''}
                onChange={(e) => handleBlockPropsUpdate('alt', e.target.value)}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </>
        )}

        {type === 'Divider' && (
          <div>
            <Label className="text-xs">Line Color</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={props.lineColor || '#e0e0e0'}
                onChange={(e) => handleBlockPropsUpdate('lineColor', e.target.value)}
                className="w-10 h-8 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={props.lineColor || '#e0e0e0'}
                onChange={(e) => handleBlockPropsUpdate('lineColor', e.target.value)}
                className="flex-1 h-8 text-xs"
              />
            </div>
          </div>
        )}

        {type === 'Spacer' && (
          <div>
            <Label className="text-xs">Height ({props.height || 32}px)</Label>
            <Slider
              value={[props.height || 32]}
              onValueChange={([value]) => handleBlockPropsUpdate('height', value)}
              min={8}
              max={128}
              step={8}
              className="mt-2"
            />
          </div>
        )}

        {type === 'Html' && (
          <div>
            <Label className="text-xs">HTML Content</Label>
            <Textarea
              value={props.contents || ''}
              onChange={(e) => handleBlockPropsUpdate('contents', e.target.value)}
              className="mt-1 text-xs min-h-[150px] font-mono"
              placeholder="<p>Your HTML here</p>"
            />
          </div>
        )}

        {/* Padding settings for most block types */}
        {['Text', 'Heading', 'Button', 'Image', 'Divider', 'Html'].includes(type) && (
          <div className="pt-4 border-t">
            <Label className="text-xs font-medium">Padding</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Top</Label>
                <Input
                  type="number"
                  value={padding.top || 16}
                  onChange={(e) => handlePaddingUpdate('top', parseInt(e.target.value) || 0)}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Bottom</Label>
                <Input
                  type="number"
                  value={padding.bottom || 16}
                  onChange={(e) => handlePaddingUpdate('bottom', parseInt(e.target.value) || 0)}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Left</Label>
                <Input
                  type="number"
                  value={padding.left || 24}
                  onChange={(e) => handlePaddingUpdate('left', parseInt(e.target.value) || 0)}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Right</Label>
                <Input
                  type="number"
                  value={padding.right || 24}
                  onChange={(e) => handlePaddingUpdate('right', parseInt(e.target.value) || 0)}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full border-l rounded-none">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium">
          {selectedBlockId ? 'Block Properties' : 'Email Settings'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="p-4">
            {selectedBlockId ? renderBlockSettings() : renderGlobalSettings()}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
