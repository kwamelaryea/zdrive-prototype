/**
 * Console Error Filters - Suppress repetitive wallet provider errors
 * These errors are harmless but clutter the console
 */

const SUPPRESSED_ERRORS = [
  'Cannot redefine property: ethereum',
  'Cannot redefine property: isZerion', 
  'Failed to set window.ethereum',
  'Backpack couldn\'t override',
  'MetaMask encountered an error setting the global Ethereum provider',
  'Could not establish connection. Receiving end does not exist',
  'mainnet mode requires providing a signer to connect()',
  'Failed to fetch',
  'Blockchain request timeout',
  'Blockchain accessibility check timeout',
  'Blockchain video loading timeout'
];

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

export function initializeConsoleFilters() {
  // Only suppress in development to avoid hiding real issues in production
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Check if this is a suppressed error
    const shouldSuppress = SUPPRESSED_ERRORS.some(suppressedError => 
      message.includes(suppressedError)
    );
    
    if (!shouldSuppress) {
      originalConsoleError.apply(console, args);
    }
  };

  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    // Check if this is a suppressed warning
    const shouldSuppress = SUPPRESSED_ERRORS.some(suppressedError => 
      message.includes(suppressedError)
    );
    
    if (!shouldSuppress) {
      originalConsoleWarn.apply(console, args);
    }
  };

  console.log('🔇 Console filters initialized - wallet provider errors suppressed');
}

export function restoreConsole() {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log('🔊 Console filters removed');
} 