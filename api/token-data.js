/* =============================================================================
   TOKEN DATA API - Vercel Serverless Function
   Securely fetches Solana token data using Helius API
   ============================================================================= */

/**
 * Serverless function handler for token data requests
 * Endpoints:
 *   - /api/token-data?type=tokenomics - Fetches supply and LP data
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
        mintAddress: '9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump',
        lpAddress: 'Hnpbt4yVSTc2LLrmuzZQaJbMomgae8fhEUMRPocYwxAa'
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
 * Handles tokenomics data request (supply + liquidity pool)
 * @param {Object} response - Vercel response object
 * @param {string} apiKey - Helius API key
 * @param {Object} config - Token configuration
 */
async function handleTokenomics(response, apiKey, config) {
    try {
        // Fetch token metadata (includes supply information)
        const supplyResponse = await fetch(
            `https://api.helius.xyz/v0/token-metadata?api-key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    mintAccounts: [config.mintAddress] 
                })
            }
        );

        if (!supplyResponse.ok) {
            const errorText = await supplyResponse.text();
            throw new Error(`Helius metadata API error: ${supplyResponse.status} - ${errorText}`);
        }

        const supplyData = await supplyResponse.json();

        // Fetch liquidity pool token balance
        const lpResponse = await fetch(
            `https://rpc.helius.xyz/?api-key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getTokenAccountBalance',
                    params: [config.lpAddress]
                })
            }
        );

        if (!lpResponse.ok) {
            const errorText = await lpResponse.text();
            throw new Error(`Helius RPC API error: ${lpResponse.status} - ${errorText}`);
        }

        const lpData = await lpResponse.json();

        // Validate RPC response structure
        if (lpData.error) {
            throw new Error(`RPC error: ${lpData.error.message || 'Unknown RPC error'}`);
        }

        // Return combined data
        return response.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                supply: supplyData,
                liquidityPool: lpData
            }
        });

    } catch (error) {
        console.error('Error fetching tokenomics:', error);
        return response.status(500).json({ 
            error: 'Failed to fetch tokenomics data',
            message: error.message,
            details: 'Unable to retrieve token supply or liquidity pool information'
        });
    }
}

/**
 * Handles wallet balance request
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
            throw new Error(`Helius balance API error: ${balanceResponse.status} - ${errorText}`);
        }

        const balanceData = await balanceResponse.json();

        return response.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            publicKey: publicKey,
            data: balanceData
        });

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
   
   4. Usage Examples:
      Frontend JavaScript:
      ```javascript
      // Fetch tokenomics
      const response = await fetch('/api/token-data?type=tokenomics');
      const data = await response.json();
      
      // Fetch balance
      const balanceResponse = await fetch(
          `/api/token-data?type=balance&publicKey=${walletAddress}`
      );
      const balanceData = await balanceResponse.json();
      ```
   
   ============================================================================= */
