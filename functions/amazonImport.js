/**
 * Netlify Function: amazonImport
 *
 * Accepts a pre-fetched Amazon product JSON in the request body and stores it
 * in JSONBin with status: 'pending'. Used as an optional server-side import
 * pathway (the admin panel also has a direct client-side import using data.js).
 *
 * Required env vars:
 *   BIN_ID           — JSONBin bin ID
 *   JSONBIN_API_KEY  — JSONBin master API key
 *
 * POST body: { product: { asin, title, image, price, affiliateLink, category, ... } }
 *
 * Returns: { success, product } or { error, duplicate }
 */

exports.handler = async function (event) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const binId    = process.env.BIN_ID;
  const apiKey   = process.env.JSONBIN_API_KEY;

  if (!binId || !apiKey) {
    return {
      statusCode: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'JSONBin credentials not configured (BIN_ID, JSONBIN_API_KEY)' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const product = body.product;
  if (!product || !product.asin) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing product or ASIN' }) };
  }

  const BASE_URL = `https://api.jsonbin.io/v3/b/${binId}`;
  const HEADERS  = { 'X-Master-Key': apiKey, 'Content-Type': 'application/json' };

  // Fetch current data
  let existing = [];
  try {
    const res = await fetch(`${BASE_URL}/latest`, { headers: HEADERS });
    if (res.ok) {
      const d = await res.json();
      existing = Array.isArray(d.record) ? d.record : [];
    }
  } catch (err) {
    console.error('[amazonImport] Could not load bin:', err.message);
    return { statusCode: 502, headers: corsHeaders, body: JSON.stringify({ error: 'Could not read JSONBin' }) };
  }

  // Duplicate ASIN check
  if (existing.some(p => p.asin === product.asin)) {
    return {
      statusCode: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ duplicate: true, asin: product.asin }),
    };
  }

  // Build pending product record
  const newProduct = {
    id:            'amz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    asin:          product.asin,
    name:          product.title || product.name,
    description:   product.description || (product.brand ? `By ${product.brand}.` : ''),
    image:         product.image || null,
    price:         product.price || 0,
    originalPrice: product.originalPrice || null,
    availability:  product.availability || 'Check on Amazon',
    affiliateLink: product.affiliateLink,
    category:      product.category || 'Home Decor',
    store:         'Amazon',
    brand:         product.brand || null,
    rating:        product.rating || 4.5,
    reviews:       product.reviews || 0,
    badge:         null,
    features:      product.features || [],
    height:        300,
    savedCount:    '0',
    gradient:      'linear-gradient(160deg,#e9c9c2,#3d2144)',
    status:        'pending',   // ← NEVER auto-publish
    importedBy:    'server',
    importedAt:    new Date().toISOString(),
    createdAt:     new Date().toISOString(),
  };

  // Save updated array
  const updated = existing.concat([newProduct]);
  try {
    const res = await fetch(BASE_URL, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify(updated),
    });
    if (!res.ok) throw new Error(`JSONBin PUT failed: ${res.status}`);
  } catch (err) {
    console.error('[amazonImport] Save failed:', err.message);
    return { statusCode: 502, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to save product' }) };
  }

  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, product: newProduct }),
  };
};
