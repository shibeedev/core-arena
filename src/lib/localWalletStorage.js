

/**
 * Utility functions for managing wallet-specific localStorage
 */

/**
 * Gets the wallet-specific name for localStorage
 * @param {string} address - Wallet address
 * @param {string} name - Base local name
 * @returns {string} Wallet-specific local name
 */
    export function getWalletLocalStoreName(address, name) {
        if (!address) throw new Error('Wallet address is required');
        return `wallet_${address.toLowerCase()}_${name}`;
    }
  
  /**
   * Gets NFT list for a specific wallet
   * @param {string} address - Wallet address
   * @returns {Array} Array of NFTs for the wallet
   */
  export function getNFTListForWallet(address) {
    if (!address) return [];
    const name = getWalletLocalStoreName(address, 'nftList');
    return JSON.parse(localStorage.getItem(name) || '[]');
  }
  
  /**
   * Saves NFT list for a specific wallet
   * @param {string} address - Wallet address
   * @param {Array} nftList - Array of NFTs to save
   */
  export function saveNFTListForWallet(address, nftList) {
    if (!address) return;
    const name = getWalletLocalStoreName(address, 'nftList');
    localStorage.setItem(name, JSON.stringify(nftList));
  }
  
  /**
   * Adds an NFT to a wallet's NFT list
   * @param {string} address - Wallet address
   * @param {Object} nft - NFT to add
   * @returns {boolean} True if NFT was added, false if it already existed
   */
  export function addNFTToWallet(address, nft) {
    if (!address || !nft) return false;
    
    const nftList = getNFTListForWallet(address);
    
    // Check if NFT already exists in the list
    const exists = nftList.some(
      existingNFT => 
        existingNFT.collectionAddress === nft.collectionAddress && 
        existingNFT.id === nft.id
    );
    
    if (exists) return false;
    
    // Add NFT to the beginning of the list
    nftList.unshift(nft);
    saveNFTListForWallet(address, nftList);
    return true;
  }
  
  // Migration function to move from old format to new wallet-specific format
  export function migrateNFTStorage() {
    try {
      const oldNFTList = JSON.parse(localStorage.getItem('nftList') || '[]');
      
      if (oldNFTList.length > 0) {
        console.log('Migrating old NFT storage to wallet-specific storage');
        
        // Current connected wallet address
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        signer.getAddress().then(address => {
          // Move all NFTs to the current wallet
          saveNFTListForWallet(address, oldNFTList);
          
          // Clear old storage
          localStorage.removeItem('nftList');
          console.log('Migration complete');
        }).catch(e => {
          console.error('Failed to get wallet address for migration:', e);
        });
      }
    } catch (e) {
      console.error('Failed to migrate NFT storage:', e);
    }
  }

  /* Example localaStorageFormat
  localStorage: {
  "wallet_0x1234abc..._nftList": [
    {"collectionAddress": "0xabc123...", "id": "42"},
    {"collectionAddress": "0xdef456...", "id": "7"}
  ],
  "wallet_0x5678def..._nftList": [
    {"collectionAddress": "0x789ghi...", "id": "15"}
  ],
  // Other wallet-specific data can follow the same pattern
  "wallet_0x1234abc..._otherData": "...",
  
  // Any global data (not wallet-specific) can still use regular keys
  "globalSetting": "value"
}
*/