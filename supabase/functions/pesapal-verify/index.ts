/*
  # Pesapal Payment Verification Edge Function

  1. Purpose
    - Handle Pesapal payment verification securely on the server side
    - Bypass CORS restrictions by proxying API calls
    - Validate payment status

  2. Security
    - Uses environment variables for sensitive credentials
    - Server-side only execution
    - Proper error handling
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface AuthResponse {
  token: string;
  expiryDate: string;
  error?: string;
  message?: string;
}

async function getAuthToken(): Promise<string> {
  const consumerKey = Deno.env.get('PESAPAL_CONSUMER_KEY');
  const consumerSecret = Deno.env.get('PESAPAL_CONSUMER_SECRET');
  const baseUrl = Deno.env.get('PESAPAL_BASE_URL') || 'https://pay.pesapal.com/v3';

  if (!consumerKey || !consumerSecret) {
    throw new Error('Pesapal credentials not configured');
  }

  const response = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
  }

  const data: AuthResponse = await response.json();
  
  if (data.error || !data.token) {
    throw new Error(data.message || 'No authentication token received');
  }

  return data.token;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const url = new URL(req.url);
    const orderTrackingId = url.searchParams.get('orderTrackingId');

    if (!orderTrackingId) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation Error', 
          message: 'Order tracking ID is required' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get authentication token
    const token = await getAuthToken();

    const baseUrl = Deno.env.get('PESAPAL_BASE_URL') || 'https://pay.pesapal.com/v3';

    const response = await fetch(`${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Payment verification failed:', response.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Verification Failed', 
          message: `Status check failed: ${response.status}`,
          details: errorText
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log('Payment verification response received');
    
    return new Response(
      JSON.stringify({
        status: data.payment_status_description || data.status || 'UNKNOWN',
        amount: data.amount || 0,
        transactionId: data.confirmation_code || data.tracking_id || orderTrackingId,
        paymentMethod: data.payment_method || 'Unknown',
        currency: data.currency || 'UGX'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in Pesapal verification function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Server Error', 
        message: error instanceof Error ? error.message : 'Failed to verify payment' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});