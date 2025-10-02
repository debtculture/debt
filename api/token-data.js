// This is our new secure, server-side function.
// It will run on Vercel's servers, not in the user's browser.

export default async function handler(request, response) {
    // Read the secret API key from an environment variable
    const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

    // Get the type of request from the URL (e.g., /api/token-data?type=tokenomics)
    const { type, publicKey } = request.query;

    if (type === 'tokenomics') {
        // This block handles fetching the main tokenomics data
        try {
            // 1. Fetch the current supply
            const supplyResponse = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mintAccounts: ['9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump'] })
            });
            if (!supplyResponse.ok) throw new Error('Helius metadata fetch failed');
            const supplyData = await supplyResponse.json();

            // 2. Fetch the liquidity pool balance
            const lpResponse = await fetch(`https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getTokenAccountBalance',
                    params: ['Hnpbt4yVSTc2LLrmuzZQaJbMomgae8fhEUMRPocYwxAa']
                })
            });
            if (!lpResponse.ok) throw new Error('Helius RPC fetch failed');
            const lpData = await lpResponse.json();
            
            // 3. Send both pieces of data back to the frontend
            response.status(200).json({
                supplyData: supplyData,
                lpData: lpData
            });

        } catch (error) {
            response.status(500).json({ error: error.message });
        }

    } else if (type === 'balance' && publicKey) {
        // This block handles fetching a user's wallet balance
        try {
            const balanceResponse = await fetch(`https://api.helius.xyz/v0/addresses/${publicKey}/balances?api-key=${HELIUS_API_KEY}`);
            if (!balanceResponse.ok) throw new Error('Helius balance fetch failed');
            const balanceData = await balanceResponse.json();
            response.status(200).json(balanceData);
        } catch (error) {
            response.status(500).json({ error: error.message });
        }

    } else {
        response.status(400).json({ error: 'Invalid request type' });
    }
}