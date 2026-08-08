/**
 * Netlify Function: amazonStatus
 * 
 * Secure endpoint to check the status of the Amazon API integration
 * for the Admin Panel Settings page.
 * 
 * Never exposes the actual Secret Keys to the frontend.
 * 
 * Query params:
 *   test=true (performs a live test call to PA-API to verify validity/rate limit)
 */

const { getAmazonOAuthToken } = require('./amazonAuth');

exports.handler = async function (event) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };

  const accessKey  = process.env.AMAZON_CREATOR_CLIENT_ID || process.env.AMAZON_ACCESS_KEY;
  const secretKey  = process.env.AMAZON_CREATOR_CLIENT_SECRET || process.env.AMAZON_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PARTNER_TAG;
  const region     = process.env.AMAZON_REGION || 'us-east-1';

  let status = 'NOT CONFIGURED';
  let message = 'API credentials are not set in Netlify Environment Variables.';
  let maskedTag = null;
  let testResult = null;

  if (accessKey && secretKey && partnerTag) {
    status = 'CONNECTED';
    message = 'Credentials are present in environment variables.';
    
    // Mask the tag for display (e.g. velvetfinds-21 -> velve********-21)
    if (partnerTag.length > 5) {
      const parts = partnerTag.split('-');
      if (parts.length > 1) {
        maskedTag = parts[0].substring(0, 5) + '********-' + parts[1];
      } else {
        maskedTag = partnerTag.substring(0, 5) + '********';
      }
    } else {
      maskedTag = partnerTag;
    }

    const testParam = event.queryStringParameters && event.queryStringParameters.test === 'true';
    if (testParam) {
      try {
        // Minimal test call to PA API
        const requestBody = JSON.stringify({
          Keywords: 'test',
          SearchIndex: 'All',
          PartnerTag: partnerTag,
          PartnerType: 'Associates',
          Marketplace: 'www.amazon.in',
          Resources: ['ItemInfo.Title'],
          ItemCount: 1,
        });

        let accessToken;
        try {
          accessToken = await getAmazonOAuthToken(accessKey, secretKey);
        } catch (err) {
          throw new Error('OAuth token request failed: ' + err.message);
        }

        const paApiUrl = 'https://webservices.amazon.in/paapi5/searchitems';

        const headers = {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
          'Host': 'webservices.amazon.in',
        };

        const res = await fetch(paApiUrl, { method: 'POST', headers, body: requestBody });
        
        if (res.ok) {
          testResult = { status: 'SUCCESS', message: 'Successfully connected to Amazon Creators API.' };
        } else if (res.status === 429) {
          status = 'RATE LIMITED';
          testResult = { status: 'RATE LIMITED', message: 'Connected, but the API rate limit has been exceeded.' };
        } else if (res.status === 401 || res.status === 403) {
          status = 'AUTHENTICATION FAILED';
          testResult = { status: 'FAILED', message: 'Authentication failed. Please verify your Client ID, Secret, and Partner Tag.' };
        } else {
          status = 'ERROR';
          const errData = await res.json();
          testResult = { status: 'ERROR', message: `Amazon API Error: ${res.status}`, details: errData };
        }
      } catch (err) {
        status = 'ERROR';
        testResult = { status: 'ERROR', message: 'Network error reaching Amazon API.', details: err.message };
      }
    }
  }

  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status,
      message,
      marketplace: 'www.amazon.in',
      partnerTag: maskedTag,
      hasClientId: !!accessKey,
      hasSecret: !!secretKey,
      testResult
    }),
  };
};
