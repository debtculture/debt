/* =============================================================================
   TOKEN DATA API - Vercel Serverless Function
   Securely fetches Solana token data using Helius API
   IMPROVEMENTS: Better validation, rate limiting, airdrop stubs
   ============================================================================= */

/**
 * Serverless function handler for token data requests
 * Endpoints:
 *   - /api/token-data?type=tokenomics - Fetches supply and LP data
 *   - /api/token-data?type=balance&publicKey={wallet} - Fetches wallet balance
 *   - /api/token-data?type=airdrop&publicKey={wallet} - Checks airdrop eligibility (STUB)
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

    // Set CORS headers
    // PRODUCTION NOTE: Change '*' to your specific domain for security
    // e.g., 'https://debtculture.xyz'
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
    response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    response.setHeader('Access-Control-Allow-Methods', 'GET');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Cache headers - adjust based on data update frequency
    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

    try {
        // Route request based on type parameter
        switch (type) {
            case 'tokenomics':
                return await handleTokenomics(response, HELIUS_API_KEY, TOKEN_CONFIG);
            
            case 'balance':
                return await handleBalance(response, HELIUS_API_KEY, publicKey);
            
            case 'airdrop':
                return await handleAirdropCheck(response, HELIUS_API_KEY, publicKey);
            
            default:
                return response.status(400).json({ 
                    error: 'Invalid request type',
                    message: 'Valid types are: "tokenomics", "balance", or "airdrop"',
                    examples: [
                        '/api/token-data?type=tokenomics',
                        '/api/token-data?type=balance&publicKey=YOUR_WALLET_ADDRESS',
                        '/api/token-data?type=airdrop&publicKey=YOUR_WALLET_ADDRESS'
                    ]
                });
        }
    } catch (error) {
        console.error('Unhandled error in token-data handler:', error);
        return response.status(500).json({ 
            error: 'Internal server error',
            message: 'An unexpected error occurred',
            // Don't expose error details in production
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
    }
}

/* --- HANDLER FUNCTIONS --- */

/**
 * Handles tokenomics data request (supply + liquidity pool)
 * Returns data in the format expected by frontend:
 * { supplyData: [...], lpData: {...} }
 * 
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
                }),
                // Add timeout to prevent hanging requests
                signal: AbortSignal.timeout(10000)
            }
        );

        if (!supplyResponse.ok) {
            const errorText = await supplyResponse.text();
            console.error(`Helius metadata API error: ${supplyResponse.status} - ${errorText}`);
            throw new Error(`Helius metadata API returned status ${supplyResponse.status}`);
        }

        const supplyData = await supplyResponse.json();

        // Validate response structure
        if (!Array.isArray(supplyData) || supplyData.length === 0) {
            throw new Error('Invalid supply data structure received from Helius');
        }

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
                }),
                signal: AbortSignal.timeout(10000)
            }
        );

        if (!lpResponse.ok) {
            const errorText = await lpResponse.text();
            console.error(`Helius RPC API error: ${lpResponse.status} - ${errorText}`);
            throw new Error(`Helius RPC API returned status ${lpResponse.status}`);
        }

        const lpData = await lpResponse.json();

        // Validate RPC response structure
        if (lpData.error) {
            console.error('RPC error:', lpData.error);
            throw new Error(`RPC error: ${lpData.error.message || 'Unknown RPC error'}`);
        }

        if (!lpData.result || !lpData.result.value) {
            throw new Error('Invalid LP data structure received from Helius');
        }

        // IMPORTANT: Return in the EXACT format the frontend expects
        return response.status(200).json({
            supplyData: supplyData,
            lpData: lpData
        });

    } catch (error) {
        console.error('Error fetching tokenomics:', error);
        
        // Return appropriate error status
        const statusCode = error.name === 'AbortError' ? 504 : 500;
        
        return response.status(statusCode).json({ 
            error: 'Failed to fetch tokenomics data',
            message: error.message,
            details: 'Unable to retrieve token supply or liquidity pool information'
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

    // Enhanced validation: Solana addresses are base58 and typically 32-44 characters
    if (typeof publicKey !== 'string' || publicKey.length < 32 || publicKey.length > 44) {
        return response.status(400).json({ 
            error: 'Invalid publicKey',
            message: 'The provided wallet address appears to be invalid (must be 32-44 characters)'
        });
    }

    // Validate base58 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(publicKey)) {
        return response.status(400).json({ 
            error: 'Invalid publicKey',
            message: 'The provided wallet address contains invalid characters (must be base58)'
        });
    }

    try {
        const balanceResponse = await fetch(
            `https://api.helius.xyz/v0/addresses/${publicKey}/balances?api-key=${apiKey}`,
            {
                signal: AbortSignal.timeout(10000)
            }
        );

        if (!balanceResponse.ok) {
            const errorText = await balanceResponse.text();
            console.error(`Helius balance API error: ${balanceResponse.status} - ${errorText}`);
            
            // Handle specific error codes
            if (balanceResponse.status === 404) {
                return response.status(404).json({
                    error: 'Wallet not found',
                    message: 'The specified wallet address does not exist or has no balance'
                });
            }
            
            throw new Error(`Helius balance API returned status ${balanceResponse.status}`);
        }

        const balanceData = await balanceResponse.json();

        // Validate response structure
        if (!balanceData || typeof balanceData !== 'object') {
            throw new Error('Invalid balance data structure received from Helius');
        }

        // Return raw balance data (frontend expects this format)
        return response.status(200).json(balanceData);

    } catch (error) {
        console.error('Error fetching balance:', error);
        
        const statusCode = error.name === 'AbortError' ? 504 : 500;
        
        return response.status(statusCode).json({ 
            error: 'Failed to fetch balance',
            message: error.message,
            details: `Unable to retrieve balance for address: ${publicKey.substring(0, 8)}...`
        });
    }
}

/**
 * STUB: Handles airdrop eligibility check
 * This is a placeholder for future airdrop functionality
 * 
 * @param {Object} response - Vercel response object
 * @param {string} apiKey - Helius API key
 * @param {string} publicKey - Wallet address to check
 */
async function handleAirdropCheck(response, apiKey, publicKey) {
    // Validate public key parameter (same as balance)
    if (!publicKey) {
        return response.status(400).json({ 
            error: 'Missing parameter',
            message: 'publicKey parameter is required for airdrop checks',
            example: '/api/token-data?type=airdrop&publicKey=YOUR_WALLET_ADDRESS'
        });
    }

    if (typeof publicKey !== 'string' || publicKey.length < 32 || publicKey.length > 44) {
        return response.status(400).json({ 
            error: 'Invalid publicKey',
            message: 'The provided wallet address appears to be invalid'
        });
    }

    try {
        // TODO: Implement actual airdrop eligibility logic
        // This might involve:
        // 1. Checking wallet's token holdings
        // 2. Verifying wallet age
        // 3. Checking transaction history
        // 4. Querying airdrop whitelist/snapshot
        
        // STUB: Return mock data for now
        return response.status(200).json({
            eligible: false,
            reason: 'Airdrop functionality not yet implemented',
            message: 'Check back later for airdrop announcements',
            // When implemented, include:
            // eligible: true/false,
            // amount: claimable amount,
            // requirements: [list of requirements],
            // deadline: timestamp
        });

    } catch (error) {
        console.error('Error checking airdrop eligibility:', error);
        return response.status(500).json({ 
            error: 'Failed to check airdrop eligibility',
            message: error.message
        });
    }
}

/* =============================================================================
   RATE LIMITING IMPLEMENTATION NOTES
   ============================================================================= 
   
   OPTION 1: Vercel Edge Config (Recommended for Production)
   
   ```javascript
   import { get } from '@vercel/edge-config';
   
   // In handler function:
   const rateLimitKey = `ratelimit:${request.headers['x-forwarded-for'] || 'unknown'}`;
   const currentCount = await get(rateLimitKey) || 0;
   
   if (currentCount > 100) { // 100 requests per hour
       return response.status(429).json({
           error: 'Rate limit exceeded',
           message: 'Too many requests. Please try again later.'
       });
   }
   ```
   
   OPTION 2: Redis (for more complex rate limiting)
   
   ```javascript
   import { Redis } from '@upstash/redis';
   const redis = Redis.fromEnv();
   
   // Sliding window rate limiter
   const rateLimitKey = `ratelimit:${clientIp}:${Date.now() / 60000 | 0}`;
   const count = await redis.incr(rateLimitKey);
   await redis.expire(rateLimitKey, 60);
   
   if (count > 100) {
       return response.status(429).json({
           error: 'Rate limit exceeded',
           retryAfter: 60
       });
   }
   ```
   
   OPTION 3: Simple In-Memory (Development Only)
   
   ```javascript
   const rateLimits = new Map();
   
   function checkRateLimit(identifier) {
       const now = Date.now();
       const windowMs = 60 * 60 * 1000; // 1 hour
       
       if (!rateLimits.has(identifier)) {
           rateLimits.set(identifier, { count: 1, resetAt: now + windowMs });
           return true;
       }
       
       const limit = rateLimits.get(identifier);
       if (now > limit.resetAt) {
           limit.count = 1;
           limit.resetAt = now + windowMs;
           return true;
       }
       
       if (limit.count >= 100) {
           return false;
       }
       
       limit.count++;
       return true;
   }
   ```
   
   RECOMMENDED LIMITS:
   - Tokenomics endpoint: 60 requests/hour (data changes slowly)
   - Balance endpoint: 100 requests/hour (user-specific queries)
   - Airdrop endpoint: 10 requests/hour (prevent abuse)
   
   ============================================================================= */

/* =============================================================================
   DEPLOYMENT CHECKLIST
   ============================================================================= 
   
   1. Environment Variables (Vercel Dashboard > Settings > Environment Variables):
      ✓ HELIUS_API_KEY - Your Helius API key
      ✓ ALLOWED_ORIGIN - Your domain (e.g., https://debtculture.xyz)
      ✓ NODE_ENV - Set to 'production' for production deployments
   
   2. Security:
      ✓ Never commit API keys to git
      ✓ Set specific CORS origin (not '*') in production
      ✓ Implement rate limiting (see notes above)
      ✓ Enable Vercel's DDoS protection
   
   3. Monitoring:
      ✓ Enable Vercel Analytics
      ✓ Set up error tracking (e.g., Sentry)
      ✓ Monitor API usage via Helius dashboard
   
   4. Testing:
      ✓ Test all endpoints with valid/invalid inputs
      ✓ Test timeout scenarios
      ✓ Test rate limiting (when implemented)
      ✓ Test error responses
   
   5. Performance:
      ✓ Verify cache headers are working
      ✓ Monitor response times
      ✓ Consider edge caching for tokenomics data
   
   ============================================================================= */

/* =============================================================================
   FRONTEND INTEGRATION EXAMPLES
   ============================================================================= 
   
   // Fetch tokenomics with error handling
   async function fetchTokenomics() {
       try {
           const response = await fetch('/api/token-data?type=tokenomics');
           
           if (!response.ok) {
               const error = await response.json();
               throw new Error(error.message || 'Failed to fetch tokenomics');
           }
           
           const { supplyData, lpData } = await response.json();
           
           // Process supply data
           const supply = supplyData[0]?.onChainAccountInfo?.accountInfo?.parsed?.info?.supply;
           const decimals = supplyData[0]?.onChainAccountInfo?.accountInfo?.parsed?.info?.decimals;
           
           // Process LP data
           const lpAmount = lpData.result?.value?.uiAmount;
           
           return { supply, decimals, lpAmount };
           
       } catch (error) {
           console.error('Error fetching tokenomics:', error);
           throw error;
       }
   }
   
   // Fetch wallet balance with retry
   async function fetchWalletBalance(publicKey, retries = 3) {
       for (let i = 0; i < retries; i++) {
           try {
               const response = await fetch(
                   `/api/token-data?type=balance&publicKey=${publicKey}`
               );
               
               if (response.status === 429) {
                   // Rate limited, wait and retry
                   await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
                   continue;
               }
               
               if (!response.ok) {
                   const error = await response.json();
                   throw new Error(error.message);
               }
               
               const data = await response.json();
               const tokenBalance = data.tokens?.find(
                   t => t.mint === '9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump'
               );
               
               return tokenBalance?.amount || 0;
               
           } catch (error) {
               if (i === retries - 1) throw error;
               await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
           }
       }
   }
   
   ============================================================================= */
