import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
interface CadetSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}
export const CadetSearchBar = ({
  searchTerm,
  onSearchChange
}: CadetSearchBarProps) => {
  return <div className="flex items-center justify-center space-x-2 mb-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input placeholder="Search cadets..." value={searchTerm} onChange={e => onSearchChange(e.target.value)} className="pl-10 py-0 px-0 mx-[10px] my-[15px]" />
      </div>
    </div>;
};