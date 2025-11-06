import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { useThemes, Theme } from '@/hooks/useThemes';
import { toast } from 'sonner';

const JROTC_PROGRAMS = [
  { value: 'army', label: 'Army JROTC' },
  { value: 'navy', label: 'Navy JROTC' },
  { value: 'air_force', label: 'Air Force JROTC' },
  { value: 'marine_corps', label: 'Marine Corps JROTC' },
  { value: 'coast_guard', label: 'Coast Guard JROTC' },
  { value: 'space_force', label: 'Space Force JROTC' }
];

interface ThemeFormData {
  jrotc_program: 'army' | 'navy' | 'air_force' | 'marine_corps' | 'coast_guard' | 'space_force';
  primary_color: string;
  secondary_color: string;
  link_text: string;
  link_selected_text: string;
  link_hover: string;
  theme_image_url?: string;
}

const ThemeForm: React.FC<{
  theme?: Theme;
  onSubmit: (data: ThemeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}> = ({ theme, onSubmit, onCancel, isLoading }) => {
  const { uploadThemeImage } = useThemes();
  const [formData, setFormData] = useState<ThemeFormData>({
    jrotc_program: theme?.jrotc_program || 'army',
    primary_color: theme?.primary_color || '#111827',
    secondary_color: theme?.secondary_color || '#2563eb',
    link_text: (theme as any)?.link_text || '#d1d5db',
    link_selected_text: (theme as any)?.link_selected_text || '#ffffff',
    link_hover: (theme as any)?.link_hover || '#1f2937',
    theme_image_url: theme?.theme_image_url || ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setUploading(true);

    try {
      const imageUrl = await uploadThemeImage(file);
      if (imageUrl) {
        setFormData(prev => ({ ...prev, theme_image_url: imageUrl }));
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jrotc_program) {
      toast.error('Please select a JROTC program');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="jrotc_program">JROTC Program</Label>
        <Select
          value={formData.jrotc_program}
          onValueChange={(value) => setFormData(prev => ({ ...prev, jrotc_program: value as ThemeFormData['jrotc_program'] }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select JROTC Program" />
          </SelectTrigger>
          <SelectContent>
            {JROTC_PROGRAMS.map((program) => (
              <SelectItem key={program.value} value={program.value}>
                {program.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primary_color">Primary Color (Sidebar Background)</Label>
          <div className="flex items-center space-x-2">
            <Input
              type="color"
              id="primary_color"
              value={formData.primary_color}
              onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
              className="w-16 h-10 p-1 rounded"
            />
            <Input
              type="text"
              value={formData.primary_color}
              onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
              placeholder="#111827"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondary_color">Secondary Color (Selected Link)</Label>
          <div className="flex items-center space-x-2">
            <Input
              type="color"
              id="secondary_color"
              value={formData.secondary_color}
              onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
              className="w-16 h-10 p-1 rounded"
            />
            <Input
              type="text"
              value={formData.secondary_color}
              onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
              placeholder="#2563eb"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="link_text">Link Text Color</Label>
          <div className="flex items-center space-x-2">
            <Input
              type="color"
              id="link_text"
              value={formData.link_text}
              onChange={(e) => setFormData(prev => ({ ...prev, link_text: e.target.value }))}
              className="w-16 h-10 p-1 rounded"
            />
            <Input
              type="text"
              value={formData.link_text}
              onChange={(e) => setFormData(prev => ({ ...prev, link_text: e.target.value }))}
              placeholder="#d1d5db"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="link_selected_text">Selected Link Text</Label>
          <div className="flex items-center space-x-2">
            <Input
              type="color"
              id="link_selected_text"
              value={formData.link_selected_text}
              onChange={(e) => setFormData(prev => ({ ...prev, link_selected_text: e.target.value }))}
              className="w-16 h-10 p-1 rounded"
            />
            <Input
              type="text"
              value={formData.link_selected_text}
              onChange={(e) => setFormData(prev => ({ ...prev, link_selected_text: e.target.value }))}
              placeholder="#ffffff"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="link_hover">Link Hover Color</Label>
          <div className="flex items-center space-x-2">
            <Input
              type="color"
              id="link_hover"
              value={formData.link_hover}
              onChange={(e) => setFormData(prev => ({ ...prev, link_hover: e.target.value }))}
              className="w-16 h-10 p-1 rounded"
            />
            <Input
              type="text"
              value={formData.link_hover}
              onChange={(e) => setFormData(prev => ({ ...prev, link_hover: e.target.value }))}
              placeholder="#1f2937"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme_image">Theme Image</Label>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              type="file"
              id="theme_image"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </div>
          {formData.theme_image_url && (
            <div className="flex items-center space-x-2">
              <img
                src={formData.theme_image_url}
                alt="Theme preview"
                className="w-12 h-12 object-cover rounded"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, theme_image_url: '' }))}
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || uploading}>
          {uploading ? 'Uploading...' : isLoading ? 'Saving...' : theme ? 'Update Theme' : 'Create Theme'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const ThemeCard: React.FC<{
  theme: Theme;
  onEdit: (theme: Theme) => void;
  onDelete: (id: string) => void;
}> = ({ theme, onEdit, onDelete }) => {
  const programLabel = JROTC_PROGRAMS.find(p => p.value === theme.jrotc_program)?.label || theme.jrotc_program;

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{programLabel}</CardTitle>
            <CardDescription>
              Created {new Date(theme.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon" className="h-6 w-6"
              onClick={() => onEdit(theme)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300"
              onClick={() => onDelete(theme.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: theme.primary_color }}
            />
            <span className="text-sm text-muted-foreground">Primary: {theme.primary_color}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: theme.secondary_color }}
            />
            <span className="text-sm text-muted-foreground">Secondary: {theme.secondary_color}</span>
          </div>
        </div>
        {theme.theme_image_url && (
          <div className="flex items-center space-x-2">
            <img
              src={theme.theme_image_url}
              alt="Theme image"
              className="w-16 h-16 object-cover rounded"
            />
            <span className="text-sm text-muted-foreground">Theme Image</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import { usePermissionContext } from '@/contexts/PermissionContext';

interface ThemeManagementProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}

const ThemeManagement: React.FC<ThemeManagementProps> = ({ isDialogOpen, setIsDialogOpen }) => {
  const { userProfile } = useAuth();
  const { themes, loading, createTheme, updateTheme, deleteTheme } = useThemes();
  const { hasPermission } = usePermissionContext();
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show for admin users
  if (userProfile?.role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Theme Management</CardTitle>
          <CardDescription>Access restricted to administrators only</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Theme management is restricted to administrators. 
            Contact your administrator if you need changes to the themes.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (data: ThemeFormData) => {
    setIsSubmitting(true);
    try {
      if (editingTheme) {
        await updateTheme(editingTheme.id, data);
      } else {
        await createTheme({ ...data, school_id: userProfile!.school_id, is_active: true });
      }
      setIsDialogOpen(false);
      setEditingTheme(null);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (theme: Theme) => {
    setEditingTheme(theme);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this theme?')) {
      await deleteTheme(id);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingTheme(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Theme Management</CardTitle>
          <CardDescription>Loading themes...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Theme Management</CardTitle>
            <CardDescription>
              Manage visual themes for different JROTC programs
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTheme(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Theme
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTheme ? 'Edit Theme' : 'Add New Theme'}
                </DialogTitle>
                <DialogDescription>
                  {editingTheme 
                    ? 'Update the theme settings for this JROTC program.'
                    : 'Create a new theme for a JROTC program.'
                  }
                </DialogDescription>
              </DialogHeader>
              <ThemeForm
                theme={editingTheme || undefined}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {themes.length === 0 ? (
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No themes yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first theme to customize the appearance for different JROTC programs.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ThemeManagement;