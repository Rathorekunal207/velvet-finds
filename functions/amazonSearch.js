/**
 * Netlify Function: amazonSearch
 *
 * Calls Amazon Product Advertising API v5 (PA-API 5.0) with AWS Signature V4.
 * All credentials are read from Netlify environment variables — NEVER from the frontend.
 *
 * Required environment variables (set in Netlify site settings → Build & deploy → Environment):
 *   AMAZON_ACCESS_KEY   — Your Amazon AWS access key
 *   AMAZON_SECRET_KEY   — Your Amazon AWS secret key
 *   AMAZON_PARTNER_TAG  — Your Amazon Associates tracking ID (e.g. velvetfinds-21)
 *   AMAZON_REGION       — PA-API region (use "us-east-1" for Amazon India)
 *
 * Query parameters:
 *   keyword  — Search keyword / phrase (required)
 *   category — Amazon search index (optional, default: All)
 *   maxItems — Max results to return (optional, default: 10, max: 10)
 *
 * Returns JSON: { products: [ { asin, title, image, price, originalPrice, availability, affiliateLink, category, brand, rating, reviews } ] }
 */

const crypto = require('crypto');

/* ── AWS Signature V4 helpers ─────────────────────────────────── */

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
  const kSigning = hmac(kService, 'aws4_request');
  return kSigning;
}

function buildAuthHeader({ method, url, body, accessKey, secretKey, region, service, dateTime }) {
  const parsedUrl  = new URL(url);
  const host       = parsedUrl.hostname;
  const path       = parsedUrl.pathname;

  const datestamp  = dateTime.substring(0, 8);
  const amzDate    = dateTime;

  const payloadHash = hash(body);

  const canonicalHeaders =
    `content-encoding:amz-sdk-request\n` +
    `content-type:application/json; charset=UTF-8\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems\n`;

  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';

  const canonicalRequest = [
    method,
    path,
    '',                  // no query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${datestamp}/${region}/${service}/aws4_request`;

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hash(canonicalRequest),
  ].join('\n');

  const signingKey = getSigningKey(secretKey, datestamp, region, service);
  const signature  = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  const authorizationHeader =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;

  return {
    Authorization: authorizationHeader,
    'Content-Encoding': 'amz-sdk-request',
    'Content-Type': 'application/json; charset=UTF-8',
    Host: host,
    'X-Amz-Date': amzDate,
    'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
  };
}

/* ── PA-API search index mapping ─────────────────────────────── */
const SEARCH_INDEX_MAP = {
  'Home Decor':     'HomeGarden',
  'Bedroom':        'HomeGarden',
  'Living Room':    'HomeGarden',
  'Kitchen':        'Kitchen',
  'Beauty':         'Beauty',
  'Skincare':       'Beauty',
  'Tech Gadgets':   'Electronics',
  'Fitness':        'Sports',
  'Travel':         'Luggage',
  'Gifts':          'All',
  'Office Setup':   'OfficeProducts',
  'Fashion':        'Apparel',
  'Baby & Pet':     'PetSupplies',
};

/* ── Main handler ─────────────────────────────────────────────── */
exports.handler = async function (event) {
  /* ── CORS preflight ── */
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  /* ── Read credentials ── */
  const accessKey  = process.env.AMAZON_ACCESS_KEY;
  const secretKey  = process.env.AMAZON_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PARTNER_TAG;
  const region     = process.env.AMAZON_REGION || 'us-east-1';

  /* ── Graceful degradation when credentials are not set ──
     Returns clearly-labelled demo data so the admin UI still works locally
     without Netlify environment variables configured.                      */
  if (!accessKey || !secretKey || !partnerTag) {
    console.warn('[amazonSearch] Missing Amazon API credentials — returning demo data.');
    const keyword = (event.queryStringParameters && event.queryStringParameters.keyword) || 'home decor';
    const category = (event.queryStringParameters && event.queryStringParameters.category) || 'Home Decor';

    const demoProducts = [
      {
        asin: 'B0DEMO0001',
        title: `[DEMO] ${keyword} — Premium Product 1`,
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
        price: 1299,
        originalPrice: 1799,
        availability: 'In Stock',
        affiliateLink: `https://www.amazon.in/dp/B0DEMO0001?tag=${partnerTag || 'velvetfinds-21'}`,
        category: category,
        brand: 'Demo Brand',
        rating: 4.5,
        reviews: 128,
        isDemo: true,
      },
      {
        asin: 'B0DEMO0002',
        title: `[DEMO] ${keyword} — Bestseller Pick`,
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80',
        price: 849,
        originalPrice: 1199,
        availability: 'In Stock',
        affiliateLink: `https://www.amazon.in/dp/B0DEMO0002?tag=${partnerTag || 'velvetfinds-21'}`,
        category: category,
        brand: 'Demo Brand',
        rating: 4.7,
        reviews: 342,
        isDemo: true,
      },
      {
        asin: 'B0DEMO0003',
        title: `[DEMO] ${keyword} — Editor's Pick`,
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80',
        price: 2199,
        originalPrice: null,
        availability: 'In Stock',
        affiliateLink: `https://www.amazon.in/dp/B0DEMO0003?tag=${partnerTag || 'velvetfinds-21'}`,
        category: category,
        brand: 'Demo Brand',
        rating: 4.8,
        reviews: 89,
        isDemo: true,
      },
    ];

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: demoProducts, demo: true }),
    };
  }

  /* ── Parse query params ── */
  const params  = event.queryStringParameters || {};
  const keyword = (params.keyword || '').trim();
  const category = (params.category || '').trim();
  const maxItems = Math.min(parseInt(params.maxItems) || 10, 10);

  if (!keyword) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing required parameter: keyword' }),
    };
  }

  const searchIndex = SEARCH_INDEX_MAP[category] || 'All';

  /* ── Build PA-API request body ── */
  const requestBody = JSON.stringify({
    Keywords:    keyword,
    SearchIndex: searchIndex,
    PartnerTag:  partnerTag,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.in',
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'ItemInfo.ByLineInfo',
      'ItemInfo.Features',
      'Offers.Listings.Price',
      'Offers.Listings.Availability.Message',
      'CustomerReviews.StarRating',
      'CustomerReviews.Count',
      'BrowseNodeInfo.BrowseNodes',
    ],
    ItemCount: maxItems,
    EnableVariations: false,
  });

  /* ── Build Signature V4 ── */
  const now      = new Date();
  const dateTime = now.toISOString().replace(/[:-]|\.\d{3}/g, '').substring(0, 15) + 'Z';

  const paApiUrl = 'https://webservices.amazon.in/paapi5/searchitems';

  const authHeaders = buildAuthHeader({
    method:    'POST',
    url:       paApiUrl,
    body:      requestBody,
    accessKey,
    secretKey,
    region,
    service:   'ProductAdvertisingAPI',
    dateTime,
  });

  /* ── Call PA-API ── */
  let responseJson;
  try {
    const res = await fetch(paApiUrl, {
      method:  'POST',
      headers: authHeaders,
      body:    requestBody,
    });

    responseJson = await res.json();

    if (!res.ok) {
      console.error('[amazonSearch] PA-API error:', JSON.stringify(responseJson));
      return {
        statusCode: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Amazon PA-API returned an error.',
          details: responseJson,
        }),
      };
    }
  } catch (err) {
    console.error('[amazonSearch] Network error:', err.message);
    return {
      statusCode: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to reach Amazon PA-API', message: err.message }),
    };
  }

  /* ── Parse response ── */
  const items = (responseJson.SearchResult && responseJson.SearchResult.Items) || [];

  const products = items.map(item => {
    const asin  = item.ASIN;
    const title = item.ItemInfo && item.ItemInfo.Title && item.ItemInfo.Title.DisplayValue;
    const brand = item.ItemInfo && item.ItemInfo.ByLineInfo && item.ItemInfo.ByLineInfo.Brand && item.ItemInfo.ByLineInfo.Brand.DisplayValue;
    const img   = item.Images && item.Images.Primary && item.Images.Primary.Large && item.Images.Primary.Large.URL;

    const listing  = item.Offers && item.Offers.Listings && item.Offers.Listings[0];
    const priceObj = listing && listing.Price;
    const priceAmt = priceObj && priceObj.Amount;
    const availability = listing && listing.Availability && listing.Availability.Message;

    const rating   = item.CustomerReviews && item.CustomerReviews.StarRating && item.CustomerReviews.StarRating.Value;
    const reviews  = item.CustomerReviews && item.CustomerReviews.Count && item.CustomerReviews.Count.Value;

    const affiliateLink = `https://www.amazon.in/dp/${asin}?tag=${partnerTag}&linkCode=ogi&th=1&psc=1`;

    return {
      asin,
      title:         title || `Amazon Product ${asin}`,
      image:         img || null,
      price:         priceAmt ? Math.round(priceAmt) : null,
      originalPrice: null,
      availability:  availability || 'Check on Amazon',
      affiliateLink,
      category:      category || 'Home Decor',
      brand:         brand || null,
      rating:        rating ? parseFloat(rating) : 4.5,
      reviews:       reviews ? parseInt(reviews) : 0,
    };
  }).filter(p => p.asin && p.title);

  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ products }),
  };
};
