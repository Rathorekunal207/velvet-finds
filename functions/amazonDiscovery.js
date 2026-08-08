/**
 * Netlify Function: amazonDiscovery
 *
 * Automatically discovers new Amazon India products based on stored
 * keyword/category presets and saves them as 'pending' in JSONBin.
 *
 * This function is triggered ONLY by a manual "Run Discovery" button click in
 * the admin panel — it NEVER auto-publishes products.
 *
 * It re-uses amazonSearch internally (via an internal call pattern)
 * so all PA-API credentials stay server-side.
 *
 * Query parameters (all optional):
 *   keywords  — comma-separated keywords (default: preset list)
 *   maxPerKw  — max items per keyword (default: 5)
 *
 * Environment variables (same as amazonSearch):
 *   AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG, AMAZON_REGION
 *   BIN_ID, JSONBIN_API_KEY — for JSONBin product storage
 *
 * Returns JSON: { discovered: N, skipped: N, products: [...] }
 */

const crypto = require('crypto');

/* ── AWS Signature V4 helpers (duplicated here for standalone use) ── */
function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}
function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}
function getSigningKey(secretKey, dateStamp, region, service) {
  const kDate    = hmac('AWS4' + secretKey, dateStamp);
  const kRegion  = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

async function searchAmazon({ keyword, category, partnerTag, accessKey, secretKey, region, maxItems = 5 }) {
  const SEARCH_INDEX_MAP = {
    'Home Decor':  'HomeGarden',
    'Kitchen':     'Kitchen',
    'Beauty':      'Beauty',
    'Tech Gadgets':'Electronics',
    'Fitness':     'Sports',
    'Travel':      'Luggage',
    'Gifts':       'All',
    'Office Setup':'OfficeProducts',
    'Fashion':     'Apparel',
    'Bedroom':     'HomeGarden',
    'Living Room': 'HomeGarden',
  };

  const requestBody = JSON.stringify({
    Keywords:    keyword,
    SearchIndex: SEARCH_INDEX_MAP[category] || 'All',
    PartnerTag:  partnerTag,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.in',
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'ItemInfo.ByLineInfo',
      'Offers.Listings.Price',
      'Offers.Listings.Availability.Message',
      'CustomerReviews.StarRating',
      'CustomerReviews.Count',
    ],
    ItemCount: maxItems,
  });

  const now      = new Date();
  const dateTime = now.toISOString().replace(/[:-]|\.\d{3}/g, '').substring(0, 15) + 'Z';
  const datestamp = dateTime.substring(0, 8);
  const paApiUrl  = 'https://webservices.amazon.in/paapi5/searchitems';
  const host      = 'webservices.amazon.in';
  const payloadHash = hash(requestBody);

  const canonicalHeaders =
    `content-encoding:amz-sdk-request\n` +
    `content-type:application/json; charset=UTF-8\n` +
    `host:${host}\n` +
    `x-amz-date:${dateTime}\n` +
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems\n`;

  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';
  const canonicalRequest = ['POST', '/paapi5/searchitems', '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const credentialScope = `${datestamp}/${region}/ProductAdvertisingAPI/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', dateTime, credentialScope, hash(canonicalRequest)].join('\n');
  const signingKey = getSigningKey(secretKey, datestamp, region, 'ProductAdvertisingAPI');
  const signature  = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  const headers = {
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    'Content-Encoding': 'amz-sdk-request',
    'Content-Type': 'application/json; charset=UTF-8',
    Host: host,
    'X-Amz-Date': dateTime,
    'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
  };

  const res = await fetch(paApiUrl, { method: 'POST', headers, body: requestBody });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));

  const items = (json.SearchResult && json.SearchResult.Items) || [];
  return items.map(item => {
    const listing  = item.Offers && item.Offers.Listings && item.Offers.Listings[0];
    const priceObj = listing && listing.Price;
    return {
      asin:          item.ASIN,
      title:         item.ItemInfo && item.ItemInfo.Title && item.ItemInfo.Title.DisplayValue,
      image:         item.Images && item.Images.Primary && item.Images.Primary.Large && item.Images.Primary.Large.URL,
      price:         priceObj && priceObj.Amount ? Math.round(priceObj.Amount) : null,
      originalPrice: null,
      availability:  listing && listing.Availability && listing.Availability.Message || 'Check on Amazon',
      affiliateLink: item.DetailPageURL || `https://www.amazon.in/dp/${item.ASIN}?tag=${partnerTag}&linkCode=ogi&th=1&psc=1`,
      category,
      brand:         item.ItemInfo && item.ItemInfo.ByLineInfo && item.ItemInfo.ByLineInfo.Brand && item.ItemInfo.ByLineInfo.Brand.DisplayValue,
      rating:        item.CustomerReviews && item.CustomerReviews.StarRating ? parseFloat(item.CustomerReviews.StarRating.Value) : 4.5,
      reviews:       item.CustomerReviews && item.CustomerReviews.Count ? parseInt(item.CustomerReviews.Count.Value) : 0,
    };
  }).filter(p => p.asin && p.title);
}

/* ── Default discovery keyword presets ───────────────────────── */
const DEFAULT_PRESETS = [
  { keyword: 'home decor',         category: 'Home Decor' },
  { keyword: 'bedroom accessories',category: 'Bedroom' },
  { keyword: 'kitchen organizer',  category: 'Kitchen' },
  { keyword: 'beauty skincare',    category: 'Beauty' },
  { keyword: 'tech gadgets India', category: 'Tech Gadgets' },
  { keyword: 'gift ideas India',   category: 'Gifts' },
];

exports.handler = async function (event) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };

  const accessKey  = process.env.AMAZON_CREATOR_CLIENT_ID || process.env.AMAZON_ACCESS_KEY;
  const secretKey  = process.env.AMAZON_CREATOR_CLIENT_SECRET || process.env.AMAZON_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PARTNER_TAG;
  const region     = process.env.AMAZON_REGION || 'us-east-1';
  const binId      = process.env.BIN_ID;
  const jsonbinKey = process.env.JSONBIN_API_KEY;

  /* ── When credentials are missing, return empty discovery result ── */
  if (!accessKey || !secretKey || !partnerTag || !binId || !jsonbinKey) {
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        discovered: 0,
        skipped: 0,
        products: [],
        message: 'Amazon API credentials not configured. Please configure AMAZON_CREATOR_CLIENT_ID, AMAZON_CREATOR_CLIENT_SECRET, and AMAZON_PARTNER_TAG in Netlify environment variables.',
        code: 'NOT_CONFIGURED'
      }),
    };
  }

  const params   = event.queryStringParameters || {};
  const maxPerKw = Math.min(parseInt(params.maxPerKw) || 5, 10);

  /* ── Load existing products for duplicate detection ── */
  const binUrl = `https://api.jsonbin.io/v3/b/${binId}/latest`;
  let existing = [];
  try {
    const res = await fetch(binUrl, { headers: { 'X-Master-Key': jsonbinKey } });
    if (res.ok) {
      const d = await res.json();
      existing = Array.isArray(d.record) ? d.record : [];
    }
  } catch (e) {
    console.warn('[amazonDiscovery] Could not load existing products:', e.message);
  }

  const existingAsins = new Set(existing.filter(p => p.asin).map(p => p.asin));

  /* ── Run each preset keyword ── */
  const newProducts = [];
  let skipped = 0;

  for (const preset of DEFAULT_PRESETS) {
    try {
      const results = await searchAmazon({
        keyword: preset.keyword,
        category: preset.category,
        partnerTag, accessKey, secretKey, region,
        maxItems: maxPerKw,
      });

      for (const p of results) {
        if (existingAsins.has(p.asin)) { skipped++; continue; }
        const newProd = {
          id:         'amz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
          asin:       p.asin,
          name:       p.title,
          description: p.brand ? `By ${p.brand}. ${p.availability}` : p.availability,
          image:      p.image || null,
          price:      p.price || 0,
          originalPrice: p.originalPrice || null,
          availability: p.availability,
          affiliateLink: p.affiliateLink,
          category:   p.category,
          store:      'Amazon',
          brand:      p.brand || null,
          rating:     p.rating || 4.5,
          reviews:    p.reviews || 0,
          status:     'pending',   // NEVER auto-publish
          badge:      null,
          features:   [],
          height:     300,
          savedCount: '0',
          gradient:   'linear-gradient(160deg,#e9c9c2,#3d2144)',
          createdAt:  new Date().toISOString(),
          importedAt: new Date().toISOString(),
          updatedAt:  new Date().toISOString(),
          importedBy: 'discovery',
        };
        newProducts.push(newProd);
        existingAsins.add(p.asin);
      }

      // Small delay to respect rate limits
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error('[amazonDiscovery] Error for keyword:', preset.keyword, err.message);
    }
  }

  /* ── Save newly discovered products ── */
  if (newProducts.length > 0) {
    const updated = existing.concat(newProducts);
    try {
      await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method:  'PUT',
        headers: { 'X-Master-Key': jsonbinKey, 'Content-Type': 'application/json' },
        body:    JSON.stringify(updated),
      });
    } catch (err) {
      console.error('[amazonDiscovery] Failed to save products:', err.message);
      return {
        statusCode: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to save discovered products.' }),
      };
    }
  }

  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      discovered: newProducts.length,
      skipped,
      products: newProducts,
    }),
  };
};
