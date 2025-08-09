import React from 'react';

interface CadetSelectorProps {
  selectedCadetIds: string[];
  judgeNumber: string;
  isCadetsOpen: boolean;
  onSelectedCadetsChange: (cadetIds: string[]) => void;
  onToggleOpen: (open: boolean) => void;
}

export const CadetSelector: React.FC<CadetSelectorProps> = (props) => {
  return <div>Cadet Selector - Implementation needed</div>;
};