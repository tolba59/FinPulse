export async function handler(event: {
  queryStringParameters?: Record<string, string>;
  httpMethod?: string;
}) {
  const allowedHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: allowedHeaders,
      body: '',
    };
  }

  const query = event.queryStringParameters?.q?.trim() || '';
  if (!query) {
    return {
      statusCode: 200,
      headers: allowedHeaders,
      body: JSON.stringify({ quotes: [] }),
    };
  }

  const fetchHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
      query
    )}&quotesCount=10&newsCount=0`;
    const res = await fetch(url, { headers: fetchHeaders });
    if (!res.ok) {
      throw new Error(`Yahoo Finance Search returned status ${res.status}`);
    }
    const data = await res.json();
    return {
      statusCode: 200,
      headers: allowedHeaders,
      body: JSON.stringify(data),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Search error:', message);
    return {
      statusCode: 502,
      headers: allowedHeaders,
      body: JSON.stringify({ error: 'Failed to search symbols', details: message }),
    };
  }
}
