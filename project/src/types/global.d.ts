// Global type declarations for ZDrive
declare global {
  interface Window {
    arweaveWallet?: {
      connect: (permissions: string[]) => Promise<void>;
      disconnect: () => Promise<void>;
      getActiveAddress: () => Promise<string>;
      getActivePublicKey?: () => Promise<string>;
      sign: (transaction: any) => Promise<any>;
      dispatch: (transaction: any) => Promise<any>;
      createTransaction?: (data: any) => Promise<any>;
      getWalletNames?: () => Promise<string[]>;
      addEventListener?: (event: string, callback: () => void) => void;
      removeEventListener?: (event: string, callback: () => void) => void;
    };
    arweaveWalletLoaded?: boolean;
    aoProcessesVerified?: boolean;
  }
}

export {};