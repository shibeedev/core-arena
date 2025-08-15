// $lib/wallet.js
import { writable, derived } from 'svelte/store';
import { ethers } from 'ethers';
import config from './config.js';

// Store for wallet connection state
export const walletState = writable({
    isConnected: false,
    address: '',
    provider: null,
    signer: null,
    error: null
});

// Function to check if MetaMask exists
export function isMetaMaskInstalled() {
    return typeof window !== 'undefined' && window.ethereum !== undefined;
}

// Function to connect to wallet and always request permission
export async function connectWallet() {
    try {
        walletState.update(state => ({ ...state, error: null }));
        
        // Check if MetaMask is installed
        if (!isMetaMaskInstalled()) {
            window.open("https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn", "_blank");
            throw new Error('MetaMask is not installed');
        }
        
        // Always request accounts explicitly to force the permission dialog
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found');
        }
        
        // Switch to the correct network
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: config.chainId }],
            });
        } catch (error) {
            if (error.code === 4902) {
                // Network not added, add it
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: config.chainId,
                        rpcUrls: [config.ethRpcUrl],
                        chainName: config.chainName,
                        nativeCurrency: {
                            name: config.nativeCurrency.name,
                            symbol: config.nativeCurrency.symbol,
                            decimals: 18
                        },
                        blockExplorerUrls: [config.blockExplorerUrls]
                    }]
                });
            } else {
                throw error;
            }
        }
        
        // Initialize provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        
        // Update the store
        walletState.update(state => ({
            ...state,
            isConnected: true,
            address,
            provider,
            signer
        }));
        
        return { success: true, address, provider, signer };
    } catch (error) {
        console.error('Wallet connection error:', error);
        walletState.update(state => ({
            ...state,
            isConnected: false,
            error: error.message
        }));
        return { success: false, error: error.message };
    }
}

// Function to disconnect
export function disconnectWallet() {
    walletState.set({
        isConnected: false,
        address: '',
        provider: null,
        signer: null,
        error: null
    });
}

// Set up event listeners if we're in a browser environment
if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            // User disconnected their wallet
            disconnectWallet();
        } else {
            // Account changed, update state
            connectWallet();
            window.location.reload();
        }
    });
    
    window.ethereum.on('chainChanged', () => {
        // Chain changed, refresh the page as recommended by MetaMask
        window.location.reload();
    });
    
    window.ethereum.on('disconnect', () => {
        disconnectWallet();
    });
}

// Add this new function to wallet.js
export async function checkExistingConnection() {
    try {
        if (!isMetaMaskInstalled()) {
            return { success: false };
        }
        
        // Check if already connected WITHOUT prompting
        const accounts = await window.ethereum.request({ 
            method: 'eth_accounts'  // This doesn't trigger the MetaMask popup
        });
        
        if (accounts && accounts.length > 0) {
            // User is already connected, set up the wallet state
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            
            // Update the store
            walletState.update(state => ({
                ...state,
                isConnected: true,
                address,
                provider,
                signer
            }));
            
            return { success: true, address, provider, signer };
        }
        
        return { success: false };
    } catch (error) {
        console.error('Error checking existing connection:', error);
        return { success: false, error: error.message };
    }
}