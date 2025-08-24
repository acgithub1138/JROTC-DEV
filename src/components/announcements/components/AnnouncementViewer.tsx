import React from 'react';
import DOMPurify from 'dompurify';

interface AnnouncementViewerProps {
  content: string;
  className?: string;
}

export const AnnouncementViewer: React.FC<AnnouncementViewerProps> = ({
  content,
  className = ""
}) => {
  const sanitizedContent = DOMPurify.sanitize(content);
  
  return (
    <div 
      className={`rich-text-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};