import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Download, Loader2 } from 'lucide-react';
import { ExportOptions } from '../hooks/useJobBoardExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  isExporting: boolean;
}

export const ExportModal = ({ isOpen, onClose, onExport, isExporting }: ExportModalProps) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'svg'>('png');
  const [quality, setQuality] = useState<1 | 2 | 3>(2);
  const [area, setArea] = useState<'full' | 'visible'>('full');
  const [includeBackground, setIncludeBackground] = useState(true);

  const handleExport = () => {
    onExport({
      format,
      quality,
      area,
      includeBackground,
    });
  };

  const getQualityLabel = (q: number) => {
    switch (q) {
      case 1: return 'Standard (1x)';
      case 2: return 'High (2x)';
      case 3: return 'Ultra (3x)';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Job Board Chart</DialogTitle>
          <DialogDescription>
            Choose your export options and download the organizational chart.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as typeof format)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="png" id="png" />
                <Label htmlFor="png" className="text-sm">PNG - Best for general use</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="jpeg" id="jpeg" />
                <Label htmlFor="jpeg" className="text-sm">JPEG - Smaller file size</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="svg" id="svg" />
                <Label htmlFor="svg" className="text-sm">SVG - Vector format</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Quality Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quality</Label>
            <RadioGroup value={quality.toString()} onValueChange={(value) => setQuality(parseInt(value) as typeof quality)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="quality-1" />
                <Label htmlFor="quality-1" className="text-sm">{getQualityLabel(1)}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="quality-2" />
                <Label htmlFor="quality-2" className="text-sm">{getQualityLabel(2)}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="quality-3" />
                <Label htmlFor="quality-3" className="text-sm">{getQualityLabel(3)}</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Area Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Area</Label>
            <RadioGroup value={area} onValueChange={(value) => setArea(value as typeof area)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="text-sm">Full Chart - Complete organizational chart</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="visible" id="visible" />
                <Label htmlFor="visible" className="text-sm">Visible Area - Current view only</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Background Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="background"
              checked={includeBackground}
              onCheckedChange={(checked) => setIncludeBackground(checked as boolean)}
            />
            <Label htmlFor="background" className="text-sm">Include background</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};