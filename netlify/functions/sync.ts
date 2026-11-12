import { getStore } from '@netlify/blobs';

// In-memory fallback if Blobs environment is not yet configured on Netlify
const memoryFallback = new Map<string, { watchlist: unknown[]; updatedAt: number }>();

export async function handler(event: {
  httpMethod?: string;
  queryStringParameters?: Record<string, string>;
  body?: string | null;
}) {
  const allowedHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: allowedHeaders,
      body: '',
    };
  }

  // 1. GET /api/sync?code=XYZ
  if (event.httpMethod === 'GET') {
    const rawCode = event.queryStringParameters?.code || '';
    const cleanCode = rawCode.trim().toUpperCase();

    if (!cleanCode) {
      return {
        statusCode: 400,
        headers: allowedHeaders,
        body: JSON.stringify({ error: 'Missing sync code parameter (?code=...)' }),
      };
    }

    try {
      // Try Netlify Blobs first
      try {
        const store = getStore({ name: 'finpulse_sync', consistency: 'strong' });
        const data = await store.get(cleanCode, { type: 'json' });
        if (data && typeof data === 'object' && 'watchlist' in data) {
          return {
            statusCode: 200,
            headers: allowedHeaders,
            body: JSON.stringify({
              success: true,
              code: cleanCode,
              watchlist: (data as { watchlist: unknown[] }).watchlist,
              updatedAt: (data as { updatedAt: number }).updatedAt || Date.now(),
            }),
          };
        }
      } catch (blobErr) {
        console.warn('Blobs read fallback to memory:', blobErr);
      }

      // Memory fallback check
      const memData = memoryFallback.get(cleanCode);
      if (memData) {
        return {
          statusCode: 200,
          headers: allowedHeaders,
          body: JSON.stringify({
            success: true,
            code: cleanCode,
            watchlist: memData.watchlist,
            updatedAt: memData.updatedAt,
          }),
        };
      }

      return {
        statusCode: 404,
        headers: allowedHeaders,
        body: JSON.stringify({
          error: `No portfolio found for sync code "${cleanCode}". Make sure the code is typed correctly.`,
        }),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        statusCode: 500,
        headers: allowedHeaders,
        body: JSON.stringify({ error: 'Failed to retrieve sync data', details: msg }),
      };
    }
  }

  // 2. POST /api/sync
  if (event.httpMethod === 'POST') {
    try {
      const payload = event.body ? JSON.parse(event.body) : {};
      const rawCode = payload.code || '';
      const cleanCode = String(rawCode).trim().toUpperCase();
      const watchlist = payload.watchlist;

      if (!cleanCode || !Array.isArray(watchlist)) {
        return {
          statusCode: 400,
          headers: allowedHeaders,
          body: JSON.stringify({ error: 'Invalid payload: code and watchlist array are required' }),
        };
      }

      const syncRecord = {
        watchlist,
        updatedAt: Date.now(),
      };

      // Try Netlify Blobs first
      try {
        const store = getStore({ name: 'finpulse_sync', consistency: 'strong' });
        await store.setJSON(cleanCode, syncRecord);
      } catch (blobErr) {
        console.warn('Blobs write fallback to memory:', blobErr);
      }

      // Also keep in memory fallback
      memoryFallback.set(cleanCode, syncRecord);

      return {
        statusCode: 200,
        headers: allowedHeaders,
        body: JSON.stringify({
          success: true,
          code: cleanCode,
          updatedAt: syncRecord.updatedAt,
        }),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        statusCode: 500,
        headers: allowedHeaders,
        body: JSON.stringify({ error: 'Failed to save sync data', details: msg }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: allowedHeaders,
    body: JSON.stringify({ error: 'Method Not Allowed' }),
  };
}
