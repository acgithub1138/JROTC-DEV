import { useEffect, useState, useCallback } from 'react';
import { useCapacitor } from './useCapacitor';

interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

interface OfflineQueueItem {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export const useOfflineSync = () => {
  const { isNative } = useCapacitor();
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    connected: true,
    connectionType: 'unknown'
  });
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const setupNetworkListeners = useCallback(async () => {
    if (!isNative) {
      // Web fallback using navigator.onLine
      const updateOnlineStatus = () => {
        setNetworkStatus({
          connected: navigator.onLine,
          connectionType: navigator.onLine ? 'wifi' : 'none'
        });
      };

      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
      updateOnlineStatus();

      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    }

    try {
      const { Network } = await import('@capacitor/network');

      const status = await Network.getStatus();
      setNetworkStatus({
        connected: status.connected,
        connectionType: status.connectionType
      });

      // Listen for network status changes
      Network.addListener('networkStatusChange', (status) => {
        console.log('Network status changed:', status);
        setNetworkStatus({
          connected: status.connected,
          connectionType: status.connectionType
        });

        // Auto-sync when coming back online
        if (status.connected && offlineQueue.length > 0) {
          processOfflineQueue();
        }
      });

    } catch (error) {
      console.error('Error setting up network listeners:', error);
    }
  }, [isNative, offlineQueue.length]);

  const saveToOfflineQueue = useCallback(async (item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>) => {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      retryCount: 0
    };

    setOfflineQueue(prev => [...prev, queueItem]);

    // Save to device storage if on mobile
    if (isNative) {
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        
        const currentQueue = [...offlineQueue, queueItem];
        await Filesystem.writeFile({
          path: 'offline-queue.json',
          data: JSON.stringify(currentQueue),
          directory: Directory.Data
        });
      } catch (error) {
        console.error('Error saving to offline queue file:', error);
      }
    } else {
      // Web fallback using localStorage
      const currentQueue = [...offlineQueue, queueItem];
      localStorage.setItem('offline-queue', JSON.stringify(currentQueue));
    }

    return queueItem.id;
  }, [isNative, offlineQueue]);

  const loadOfflineQueue = useCallback(async () => {
    if (isNative) {
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        
        const result = await Filesystem.readFile({
          path: 'offline-queue.json',
          directory: Directory.Data
        });
        
        const queue = JSON.parse(result.data as string);
        setOfflineQueue(queue);
      } catch (error) {
        // File doesn't exist or other error
        console.log('No offline queue file found or error reading:', error);
      }
    } else {
      // Web fallback
      const stored = localStorage.getItem('offline-queue');
      if (stored) {
        try {
          const queue = JSON.parse(stored);
          setOfflineQueue(queue);
        } catch (error) {
          console.error('Error parsing offline queue from localStorage:', error);
        }
      }
    }
  }, [isNative]);

  const processOfflineQueue = useCallback(async () => {
    if (isSyncing || !networkStatus.connected || offlineQueue.length === 0) {
      return;
    }

    setIsSyncing(true);
    console.log('Processing offline queue:', offlineQueue.length, 'items');

    const processedItems: string[] = [];
    const failedItems: OfflineQueueItem[] = [];

    for (const item of offlineQueue) {
      try {
        // Implement your API call logic here
        console.log('Processing offline item:', item);
        
        // Example API call - replace with your actual implementation
        // const response = await fetch(item.url, {
        //   method: item.method,
        //   body: JSON.stringify(item.data),
        //   headers: { 'Content-Type': 'application/json' }
        // });
        
        // if (response.ok) {
          processedItems.push(item.id);
        // } else {
        //   throw new Error(`HTTP ${response.status}`);
        // }
        
      } catch (error) {
        console.error('Error processing offline item:', error);
        
        if (item.retryCount < 3) {
          failedItems.push({
            ...item,
            retryCount: item.retryCount + 1
          });
        }
      }
    }

    // Update queue - remove processed items, keep failed items for retry
    const newQueue = failedItems;
    setOfflineQueue(newQueue);

    // Update storage
    if (isNative) {
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        await Filesystem.writeFile({
          path: 'offline-queue.json',
          data: JSON.stringify(newQueue),
          directory: Directory.Data
        });
      } catch (error) {
        console.error('Error updating offline queue file:', error);
      }
    } else {
      localStorage.setItem('offline-queue', JSON.stringify(newQueue));
    }

    setIsSyncing(false);
    console.log(`Processed ${processedItems.length} items, ${failedItems.length} failed/retrying`);
  }, [isSyncing, networkStatus.connected, offlineQueue, isNative]);

  const clearOfflineQueue = useCallback(async () => {
    setOfflineQueue([]);
    
    if (isNative) {
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        await Filesystem.deleteFile({
          path: 'offline-queue.json',
          directory: Directory.Data
        });
      } catch (error) {
        console.log('Error deleting offline queue file:', error);
      }
    } else {
      localStorage.removeItem('offline-queue');
    }
  }, [isNative]);

  useEffect(() => {
    setupNetworkListeners();
    loadOfflineQueue();
  }, [setupNetworkListeners, loadOfflineQueue]);

  return {
    networkStatus,
    offlineQueue,
    isSyncing,
    saveToOfflineQueue,
    processOfflineQueue,
    clearOfflineQueue
  };
};
