import { useCallback } from 'react';
import { useCapacitor } from './useCapacitor';

export interface FileSystemAccess {
  saveFile: (fileName: string, data: string, directory?: 'Documents' | 'Data' | 'Cache') => Promise<string | null>;
  readFile: (fileName: string, directory?: 'Documents' | 'Data' | 'Cache') => Promise<string | null>;
  deleteFile: (fileName: string, directory?: 'Documents' | 'Data' | 'Cache') => Promise<boolean>;
  listFiles: (directory?: 'Documents' | 'Data' | 'Cache') => Promise<string[]>;
  downloadFile: (url: string, fileName: string) => Promise<string | null>;
  shareFile: (filePath: string, title?: string) => Promise<boolean>;
}

export const useFileSystem = (): FileSystemAccess => {
  const { isNative, platform } = useCapacitor();

  const saveFile = useCallback(async (fileName: string, data: string, directory: 'Documents' | 'Data' | 'Cache' = 'Documents') => {
    if (!isNative) {
      // Web fallback - download file
      try {
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return fileName;
      } catch (error) {
        console.error('Error downloading file on web:', error);
        return null;
      }
    }

    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      const directoryMap = {
        'Documents': Directory.Documents,
        'Data': Directory.Data,
        'Cache': Directory.Cache
      };

      await Filesystem.writeFile({
        path: fileName,
        data: data,
        directory: directoryMap[directory]
      });

      console.log('File saved successfully:', fileName);
      return fileName;
    } catch (error) {
      console.error('Error saving file:', error);
      return null;
    }
  }, [isNative]);

  const readFile = useCallback(async (fileName: string, directory: 'Documents' | 'Data' | 'Cache' = 'Documents') => {
    if (!isNative) {
      console.log('File reading not available on web platform');
      return null;
    }

    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      const directoryMap = {
        'Documents': Directory.Documents,
        'Data': Directory.Data,
        'Cache': Directory.Cache
      };

      const result = await Filesystem.readFile({
        path: fileName,
        directory: directoryMap[directory]
      });

      return result.data as string;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }, [isNative]);

  const deleteFile = useCallback(async (fileName: string, directory: 'Documents' | 'Data' | 'Cache' = 'Documents') => {
    if (!isNative) {
      console.log('File deletion not available on web platform');
      return false;
    }

    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      const directoryMap = {
        'Documents': Directory.Documents,
        'Data': Directory.Data,
        'Cache': Directory.Cache
      };

      await Filesystem.deleteFile({
        path: fileName,
        directory: directoryMap[directory]
      });

      console.log('File deleted successfully:', fileName);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }, [isNative]);

  const listFiles = useCallback(async (directory: 'Documents' | 'Data' | 'Cache' = 'Documents') => {
    if (!isNative) {
      console.log('File listing not available on web platform');
      return [];
    }

    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      const directoryMap = {
        'Documents': Directory.Documents,
        'Data': Directory.Data,
        'Cache': Directory.Cache
      };

      const result = await Filesystem.readdir({
        path: '',
        directory: directoryMap[directory]
      });

      return result.files.map(file => file.name);
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }, [isNative]);

  const downloadFile = useCallback(async (url: string, fileName: string) => {
    if (!isNative) {
      // Web fallback
      try {
        const response = await fetch(url);
        const data = await response.text();
        return await saveFile(fileName, data);
      } catch (error) {
        console.error('Error downloading file on web:', error);
        return null;
      }
    }

    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');

      const result = await Filesystem.downloadFile({
        url: url,
        path: fileName,
        directory: Directory.Documents
      });

      console.log('File downloaded successfully:', result.path);
      return result.path;
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  }, [isNative, saveFile]);

  const shareFile = useCallback(async (filePath: string, title?: string) => {
    if (!isNative) {
      console.log('File sharing not available on web platform');
      return false;
    }

    try {
      const { Share } = await import('@capacitor/share');
      
      await Share.share({
        title: title || 'Shared File',
        text: 'File shared from JROTC CCC',
        url: filePath,
      });

      return true;
    } catch (error) {
      console.error('Error sharing file:', error);
      return false;
    }
  }, [isNative]);

  return {
    saveFile,
    readFile,
    deleteFile,
    listFiles,
    downloadFile,
    shareFile
  };
};