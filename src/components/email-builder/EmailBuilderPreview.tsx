import React, { useMemo } from 'react';
import { Reader, renderToStaticMarkup } from '@usewaypoint/email-builder';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useEmailBuilderStore } from './EmailBuilderContext';
import { cn } from '@/lib/utils';

export const EmailBuilderPreview: React.FC = () => {
  const { document, viewMode, previewMode } = useEmailBuilderStore();

  const htmlContent = useMemo(() => {
    try {
      // Cast to any to avoid strict type checks from the library
      return renderToStaticMarkup(document as any, { rootBlockId: 'root' });
    } catch (error) {
      console.error('Error rendering email:', error);
      return '<p>Error rendering email preview</p>';
    }
  }, [document]);

  const jsonContent = useMemo(() => {
    return JSON.stringify(document, null, 2);
  }, [document]);

  if (viewMode === 'html') {
    return (
      <div className="h-full p-4">
        <Textarea
          value={htmlContent}
          readOnly
          className="h-full font-mono text-xs resize-none"
        />
      </div>
    );
  }

  if (viewMode === 'json') {
    return (
      <div className="h-full p-4">
        <Textarea
          value={jsonContent}
          readOnly
          className="h-full font-mono text-xs resize-none"
        />
      </div>
    );
  }

  // Preview mode
  return (
    <div className="h-full flex items-start justify-center p-4 bg-muted/30">
      <ScrollArea className="h-full w-full">
        <div 
          className={cn(
            "mx-auto bg-background shadow-lg transition-all duration-300",
            previewMode === 'mobile' ? "w-[375px]" : "w-full max-w-2xl"
          )}
        >
          <Reader document={document as any} rootBlockId="root" />
        </div>
      </ScrollArea>
    </div>
  );
};
