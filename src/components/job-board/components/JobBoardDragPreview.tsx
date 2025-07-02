import React from 'react';

interface JobBoardDragPreviewProps {
  isVisible: boolean;
  mousePosition?: { x: number; y: number };
}

export const JobBoardDragPreview = ({ isVisible, mousePosition }: JobBoardDragPreviewProps) => {
  if (!isVisible || !mousePosition) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none z-20">
      <line
        x1={mousePosition.x}
        y1={mousePosition.y}
        x2={mousePosition.x + 50}
        y2={mousePosition.y}
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeDasharray="5,5"
      />
    </svg>
  );
};