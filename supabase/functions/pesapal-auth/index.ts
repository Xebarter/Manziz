/*
  # Pesapal Authentication Edge Function

  1. Purpose
    - Handle Pesapal authentication securely on the server side
    - Bypass CORS restrictions by proxying API calls
    - Keep API credentials secure

  2. Security
    - Uses environment variables for sensitive credentials
    - Server-side only execution
    - Proper error handling and logging
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const consumerKey = Deno.env.get('PESAPAL_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('PESAPAL_CONSUMER_SECRET');
    const baseUrl = Deno.env.get('PESAPAL_BASE_URL') || 'https://pay.pesapal.com/v3';

    if (!consumerKey || !consumerSecret) {
      console.error('Missing Pesapal credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration Error', 
          message: 'Pesapal credentials not configured' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Attempting Pesapal authentication');

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

    console.log('Pesapal auth response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pesapal auth error:', errorText);
      
      let errorMessage = 'Authentication failed';
      if (response.status === 401) {
        errorMessage = 'Invalid Pesapal credentials';
      } else if (response.status === 400) {
        errorMessage = 'Bad request to Pesapal';
      }

      return new Response(
        JSON.stringify({ 
          error: 'Authentication Failed', 
          message: errorMessage,
          status: response.status 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data: AuthResponse = await response.json();
    
    if (data.error) {
      return new Response(
        JSON.stringify({ 
          error: data.error, 
          message: data.message || 'Authentication failed' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        token: data.token, 
        expiryDate: data.expiryDate 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in Pesapal auth function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Server Error', 
        message: 'Failed to authenticate with Pesapal' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});