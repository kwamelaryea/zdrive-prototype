import { useState, useCallback } from 'react';
import { useAO } from './useAO';
import toast from 'react-hot-toast';

interface AccessOption {
  type: 'basic' | 'premium';
  duration?: number;
  price: number;
  description: string;
}

interface UseVideoAccessReturn {
  // Access options
  getAccessOptions: () => Promise<AccessOption[]>;
  
  // Purchase functionality
  purchaseAccess: (videoId: string, accessType: 'basic' | 'premium', duration?: number) => Promise<boolean>;
  isPurchasing: boolean;
  
  // Verification
  verifyAccess: (videoId: string) => Promise<boolean>;
  checkAccessStatus: (videoId: string) => Promise<{
    hasAccess: boolean;
    accessType?: 'basic' | 'premium';
    expiresAt?: number;
    isExpired?: boolean;
  }>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useVideoAccess = (): UseVideoAccessReturn => {
  const { purchaseAccess: aoPurchaseAccess, verifyAccess: aoVerifyAccess, isPurchasing, error } = useAO();
  const [localError, setLocalError] = useState<string | null>(null);

  const getAccessOptions = useCallback(async (): Promise<AccessOption[]> => {
    try {
      // This would typically fetch from the AO process
      // For now, return default options
      return [
        {
          type: 'basic',
          duration: 7,
          price: 0.0005,
          description: '7-day access'
        },
        {
          type: 'basic',
          duration: 30,
          price: 0.001,
          description: '30-day access'
        },
        {
          type: 'basic',
          duration: 90,
          price: 0.002,
          description: '90-day access'
        },
        {
          type: 'premium',
          price: 0.005,
          description: 'Permanent access'
        }
      ];
    } catch (error) {
      console.error('Failed to get access options:', error);
      return [];
    }
  }, []);

  const purchaseAccess = useCallback(async (
    videoId: string, 
    accessType: 'basic' | 'premium', 
    duration?: number
  ): Promise<boolean> => {
    try {
      setLocalError(null);
      
      // Get access options to determine price
      const options = await getAccessOptions();
      const selectedOption = options.find(option => 
        option.type === accessType && 
        (accessType === 'premium' || option.duration === duration)
      );
      
      if (!selectedOption) {
        throw new Error('Invalid access option selected');
      }

      const result = await aoPurchaseAccess({
        videoId,
        accessType,
        duration,
        price: selectedOption.price
      });

      if (result) {
        toast.success(`Access purchased successfully! ${selectedOption.description}`);
        return true;
      }
      
      return false;
    } catch (error) {
      const errorMessage = (error as Error).message;
      setLocalError(errorMessage);
      toast.error('Purchase failed: ' + errorMessage);
      return false;
    }
  }, [aoPurchaseAccess, getAccessOptions]);

  const verifyAccess = useCallback(async (videoId: string): Promise<boolean> => {
    try {
      return await aoVerifyAccess(videoId);
    } catch (error) {
      console.error('Access verification failed:', error);
      return false;
    }
  }, [aoVerifyAccess]);

  const checkAccessStatus = useCallback(async (videoId: string) => {
    try {
      const hasAccess = await verifyAccess(videoId);
      
      // This would typically fetch detailed access info from AO process
      // For now, return basic info
      if (hasAccess) {
        return {
          hasAccess: true,
          accessType: 'basic' as const,
          expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
          isExpired: false
        };
      } else {
        return {
          hasAccess: false,
          isExpired: false
        };
      }
    } catch (error) {
      console.error('Failed to check access status:', error);
      return {
        hasAccess: false,
        isExpired: false
      };
    }
  }, [verifyAccess]);

  const clearLocalError = useCallback(() => {
    setLocalError(null);
  }, []);

  return {
    getAccessOptions,
    purchaseAccess,
    isPurchasing,
    verifyAccess,
    checkAccessStatus,
    error: localError || error,
    clearError: clearLocalError
  };
}; 