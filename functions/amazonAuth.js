/**
 * Internal Utility: amazonAuth.js
 * Handles OAuth 2.0 Token Generation and Caching for Amazon Creators API.
 * 
 * Uses `client_credentials` grant type on the Login with Amazon (LwA) endpoint.
 * Caches the token in-memory to prevent hitting rate limits across warm invocations.
 */

// In-memory cache for the OAuth token (persists across warm Netlify function invocations)
let cachedToken = null;
let tokenExpiresAt = null;

async function getAmazonOAuthToken(clientId, clientSecret) {
  const now = Date.now();
  
  // If we have a valid token that expires in more than 5 minutes (300,000 ms), use it.
  if (cachedToken && tokenExpiresAt && (tokenExpiresAt - now > 300000)) {
    return cachedToken;
  }

  // Otherwise, request a new token
  const tokenEndpoint = 'https://api.amazon.com/auth/o2/token';
  
  const bodyParams = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  });

  try {
    const res = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[amazonAuth] Error fetching token:', JSON.stringify(data));
      throw new Error(data.error_description || data.error || 'Failed to fetch OAuth token');
    }

    cachedToken = data.access_token;
    // data.expires_in is typically 3600 seconds (1 hour)
    const expiresInMs = (data.expires_in || 3600) * 1000;
    tokenExpiresAt = now + expiresInMs;
    
    return cachedToken;
  } catch (err) {
    console.error('[amazonAuth] OAuth Request failed:', err.message);
    throw err;
  }
}

module.exports = {
  getAmazonOAuthToken
};
