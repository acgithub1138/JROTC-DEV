import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Key, Loader2 } from 'lucide-react';
import { fixMissingPasswords } from '../utils/passwordFixer';

export const PasswordFixerButton: React.FC = () => {
  const [isFixing, setIsFixing] = useState(false);

  const handleFixPasswords = async () => {
    setIsFixing(true);
    try {
      await fixMissingPasswords();
    } catch (error) {
      console.error('Failed to fix passwords:', error);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Button
      onClick={handleFixPasswords}
      disabled={isFixing}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isFixing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Key className="h-4 w-4" />
      )}
      {isFixing ? 'Generating Passwords...' : 'Fix Missing Passwords'}
    </Button>
  );
};