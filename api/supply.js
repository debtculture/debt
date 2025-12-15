export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800'); // 30 minutes

  try {
    const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
    const MINT_ADDRESS = '9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump';

    const response = await fetch(
      `https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAccounts: [MINT_ADDRESS]
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch supply');
    }

    const data = await response.json();
    const token = data[0];

    const totalSupply = Number(token.supply);
    const decimals = Number(token.decimals);

    const normalizedSupply = totalSupply / Math.pow(10, decimals);

    res.status(200).json({
      total_supply: normalizedSupply,
      circulating_supply: normalizedSupply
    });

  } catch (err) {
    res.status(500).json({ error: 'Supply fetch failed' });
  }
}
