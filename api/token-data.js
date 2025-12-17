/* =============================================================================
   TOKEN DATA API - Vercel Serverless Function
   Version: 2.0 - Fixed Helius RPC Integration
   Securely fetches Solana token data using Helius API
   ============================================================================= */

/**
 * Serverless function handler for token data requests
 * Endpoints:
 *   - /api/token-data?type=tokenomics - Fetches supply data
 *   - /api/token-data?type=balance&publicKey={wallet} - Fetches wallet balance
 * 
 * @param {Object} request - Vercel request object
 * @param {Object} response - Vercel response object
 */
export default async function handler(request, response) {
    // Security: Only allow GET requests
    if (request.method !== 'GET') {
        return response.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only GET requests are supported'
        });
    }

    // Retrieve API key from environment variable (never expose this!)
    const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
    
    if (!HELIUS_API_KEY) {
        console.error('HELIUS_API_KEY environment variable is not set');
        return response.status(500).json({ 
            error: 'Server configuration error',
            message: 'API key not configured'
        });
    }

    // Configuration: Token addresses
    const TOKEN_CONFIG = {
        mintAddress: '9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump'
    };

    // Parse query parameters
    const { type, publicKey } = request.query;

    // Set CORS headers (adjust origin as needed for production)
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET');
    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    try {
        // Route request based on type parameter
        switch (type) {
            case 'tokenomics':
                return await handleTokenomics(response, HELIUS_API_KEY, TOKEN_CONFIG);
            
            case 'balance':
                return await handleBalance(response, HELIUS_API_KEY, publicKey);
            
            default:
                return response.status(400).json({ 
                    error: 'Invalid request type',
                    message: 'Valid types are: "tokenomics" or "balance"',
                    examples: [
                        '/api/token-data?type=tokenomics',
                        '/api/token-data?type=balance&publicKey=YOUR_WALLET_ADDRESS'
                    ]
                });
        }
    } catch (error) {
        console.error('Unhandled error in token-data handler:', error);
        return response.status(500).json({ 
            error: 'Internal server error',
            message: 'An unexpected error occurred'
        });
    }
}

/* --- HANDLER FUNCTIONS --- */

/**
 * Handles tokenomics data request using Helius RPC
 * Returns properly structured supply data with decimals
 * 
 * @param {Object} response - Vercel response object
 * @param {string} apiKey - Helius API key
 * @param {Object} config - Token configuration
 */
async function handleTokenomics(response, apiKey, config) {
    try {
        // Use Helius RPC to fetch token supply directly
        const supplyResponse = await fetch(
            `https://rpc.helius.xyz/?api-key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getTokenSupply',
                    params: [config.mintAddress]
                })
            }
        );

        if (!supplyResponse.ok) {
            const errorText = await supplyResponse.text();
            console.error(`Helius RPC supply error: ${supplyResponse.status} - ${errorText}`);
            throw new Error(`Helius RPC API returned status ${supplyResponse.status}`);
        }

        const supplyData = await supplyResponse.json();

        // Validate RPC response structure
        if (supplyData.error) {
            console.error('RPC supply error:', supplyData.error);
            throw new Error(`RPC error: ${supplyData.error.message || 'Unknown RPC error'}`);
        }

        if (!supplyData.result || !supplyData.result.value) {
            throw new Error('Invalid supply data structure from Helius');
        }

        // Return data in the format frontend expects
        // Frontend needs: supply (raw), decimals, and uiAmount (human-readable)
        return response.status(200).json({
            supply: supplyData.result.value.amount,
            decimals: supplyData.result.value.decimals,
            uiAmount: supplyData.result.value.uiAmount
        });

    } catch (error) {
        console.error('Error fetching tokenomics:', error);
        return response.status(500).json({ 
            error: 'Failed to fetch tokenomics data',
            message: error.message,
            details: 'Unable to retrieve token supply information'
        });
    }
}

/**
 * Handles wallet balance request
 * Returns data in the format expected by frontend (raw Helius response)
 * 
 * @param {Object} response - Vercel response object
 * @param {string} apiKey - Helius API key
 * @param {string} publicKey - Wallet address to query
 */
async function handleBalance(response, apiKey, publicKey) {
    // Validate public key parameter
    if (!publicKey) {
        return response.status(400).json({ 
            error: 'Missing parameter',
            message: 'publicKey parameter is required for balance requests',
            example: '/api/token-data?type=balance&publicKey=YOUR_WALLET_ADDRESS'
        });
    }

    // Basic validation: Solana addresses are base58 and typically 32-44 characters
    if (publicKey.length < 32 || publicKey.length > 44) {
        return response.status(400).json({ 
            error: 'Invalid publicKey',
            message: 'The provided wallet address appears to be invalid'
        });
    }

    try {
        const balanceResponse = await fetch(
            `https://api.helius.xyz/v0/addresses/${publicKey}/balances?api-key=${apiKey}`
        );

        if (!balanceResponse.ok) {
            const errorText = await balanceResponse.text();
            console.error(`Helius balance API error: ${balanceResponse.status} - ${errorText}`);
            throw new Error(`Helius balance API returned status ${balanceResponse.status}`);
        }

        const balanceData = await balanceResponse.json();

        // Return raw balance data (frontend expects this format)
        return response.status(200).json(balanceData);

    } catch (error) {
        console.error('Error fetching balance:', error);
        return response.status(500).json({ 
            error: 'Failed to fetch balance',
            message: error.message,
            details: `Unable to retrieve balance for address: ${publicKey}`
        });
    }
}

/* =============================================================================
   DEPLOYMENT NOTES
   ============================================================================= 
   
   1. Environment Variables (Vercel Dashboard):
      - Set HELIUS_API_KEY in Project Settings > Environment Variables
   
   2. File Location:
      - Place this file at: /api/token-data.js
      - Vercel will automatically create the endpoint at /api/token-data
   
   3. Security:
      - NEVER commit API keys to git
      - API key is only accessible server-side
      - Consider adding rate limiting for production
   
   4. Response Formats:
      
      TOKENOMICS ENDPOINT (/api/token-data?type=tokenomics):
      Returns: { supply: "1000000000000000000", decimals: 9, uiAmount: 1000000000 }
      
      BALANCE ENDPOINT (/api/token-data?type=balance&publicKey=...):
      Returns: Raw Helius balance data (tokens array, etc.)
   
   5. Frontend Usage:
      
      // Fetch tokenomics
      const response = await fetch('/api/token-data?type=tokenomics');
      const data = await response.json();
      const currentSupply = data.uiAmount; // Human-readable supply
      
      // Fetch balance
      const balanceResponse = await fetch(
          `/api/token-data?type=balance&publicKey=${walletAddress}`
      );
      const balanceData = await balanceResponse.json();
      const token = balanceData.tokens.find(t => t.mint === 'YOUR_MINT_ADDRESS');
   
   6. Error Handling:
      - All errors return JSON with 'error' and 'message' fields
      - Check response.ok before parsing JSON
      - Log errors to console for debugging
   
   7. Changes in v2.0:
      - Removed LP address (no longer needed for circulating supply)
      - Simplified to use getTokenSupply RPC method
      - Returns cleaner data structure
      - Fixed data structure mismatch that caused frontend errors
   
   ============================================================================= */
