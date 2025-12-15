export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800'); // 30 minutes

  try {
    const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
    const MINT_ADDRESS = '9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump';

    // 🔒 Supply adjustments (normalized, NOT raw units)
    const LOCKED_TOKENS = 173_333_331;
    const INACCESSIBLE_TOKENS = 27_030_282.139407;

    const rpcResponse = await fetch(
      `https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTokenSupply',
          params: [MINT_ADDRESS]
        })
      }
    );

    if (!rpcResponse.ok) {
      throw new Error('RPC request failed');
    }

    const rpcData = await rpcResponse.json();
    const supplyInfo = rpcData.result.value;

    const totalSupply = supplyInfo.uiAmount; // already decimal-normalized
    const decimals = supplyInfo.decimals;

    const circulatingSupply = Math.max(
      totalSupply - LOCKED_TOKENS - INACCESSIBLE_TOKENS,
      0
    );

    res.status(200).json({
      total_supply: totalSupply,
      circulating_supply: circulatingSupply,
      decimals: decimals,
      breakdown: {
        locked: LOCKED_TOKENS,
        inaccessible: INACCESSIBLE_TOKENS
      },
      notes:
        'Circulating supply equals total on-chain supply minus locked tokens and permanently inaccessible tokens. Burned tokens are reflected on-chain.'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supply' });
  }
}
