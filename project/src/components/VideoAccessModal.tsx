import React, { useState, useEffect } from 'react';
import { useVideoAccess } from '../hooks/useVideoAccess';
import { useWallet } from '../contexts/WalletContext';

interface VideoAccessModalProps {
  videoId: string;
  videoTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onAccessGranted: () => void;
}

interface AccessOption {
  type: 'basic' | 'premium';
  duration?: number;
  price: number;
  description: string;
}

const VideoAccessModal: React.FC<VideoAccessModalProps> = ({
  videoId,
  videoTitle,
  isOpen,
  onClose,
  onAccessGranted
}) => {
  const { isConnected } = useWallet();
  const { getAccessOptions, purchaseAccess, isPurchasing, error, clearError } = useVideoAccess();
  const [accessOptions, setAccessOptions] = useState<AccessOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<AccessOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAccessOptions();
    }
  }, [isOpen]);

  const loadAccessOptions = async () => {
    try {
      setIsLoading(true);
      const options = await getAccessOptions();
      setAccessOptions(options);
      if (options.length > 0) {
        setSelectedOption(options[0]);
      }
    } catch (error) {
      console.error('Failed to load access options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedOption || !isConnected) {
      return;
    }

    try {
      const success = await purchaseAccess(
        videoId,
        selectedOption.type,
        selectedOption.duration
      );

      if (success) {
        onAccessGranted();
        onClose();
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(4)} AR`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Purchase Access</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-2">{videoTitle}</h3>
          <p className="text-white/60 text-sm">
            Choose an access option to watch this video
          </p>
        </div>

        {!isConnected && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">
              Please connect your wallet to purchase access
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300 text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {accessOptions.map((option, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedOption === option
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                }`}
                onClick={() => setSelectedOption(option)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white capitalize">
                      {option.type} Access
                    </h4>
                    <p className="text-white/60 text-sm">
                      {option.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {formatPrice(option.price)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-white/60 hover:text-white transition-colors"
            disabled={isPurchasing}
          >
            Cancel
          </button>
          <button
            onClick={handlePurchase}
            disabled={!isConnected || !selectedOption || isPurchasing}
            className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPurchasing ? 'Processing...' : `Purchase for ${selectedOption ? formatPrice(selectedOption.price) : ''}`}
          </button>
        </div>

        <div className="mt-4 text-xs text-white/40">
          <p>• Basic access provides time-limited viewing</p>
          <p>• Premium access provides permanent viewing rights</p>
          <p>• All purchases are final and non-refundable</p>
        </div>
      </div>
    </div>
  );
};

export default VideoAccessModal; 