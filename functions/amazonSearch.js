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

const { getAmazonOAuthToken } = require('./amazonAuth');

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
  const accessKey  = process.env.AMAZON_CREATOR_CLIENT_ID || process.env.AMAZON_ACCESS_KEY;
  const secretKey  = process.env.AMAZON_CREATOR_CLIENT_SECRET || process.env.AMAZON_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PARTNER_TAG;
  const region     = process.env.AMAZON_REGION || 'us-east-1';

  /* ── Strict requirement for credentials ── */
  if (!accessKey || !secretKey || !partnerTag) {
    console.error('[amazonSearch] Missing Amazon API credentials (AMAZON_CREATOR_CLIENT_ID, etc.).');
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Amazon API credentials are not configured.', code: 'NOT_CONFIGURED' }),
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

  /* ── Authenticate via OAuth 2.0 ── */
  let accessToken;
  try {
    accessToken = await getAmazonOAuthToken(accessKey, secretKey);
  } catch (err) {
    console.error('[amazonSearch] OAuth token fetch failed:', err.message);
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to authenticate with Amazon Creators API.', message: err.message, code: 'AUTH_FAILED' }),
    };
  }

  const paApiUrl = 'https://webservices.amazon.in/paapi5/searchitems';

  const authHeaders = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
    'Host': 'webservices.amazon.in',
  };

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

    // Use official DetailPageURL if provided, else construct standard affiliate link
    const affiliateLink = item.DetailPageURL || `https://www.amazon.in/dp/${asin}?tag=${partnerTag}&linkCode=ogi&th=1&psc=1`;

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
