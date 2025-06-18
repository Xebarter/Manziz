/*
  # Pesapal Payment Initiation Edge Function

  1. Purpose
    - Handle Pesapal payment initiation securely on the server side
    - Bypass CORS restrictions by proxying API calls
    - Validate payment data before sending to Pesapal

  2. Security
    - Uses environment variables for sensitive credentials
    - Server-side only execution
    - Input validation and sanitization
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  callbackUrl: string;
}

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
    throw new Error('Pesapal credentials not configured. Please check PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET environment variables.');
  }

  console.log('Requesting auth token from Pesapal...');

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
    console.error('Pesapal auth failed:', response.status, errorText);
    throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
  }

  const data: AuthResponse = await response.json();
  
  if (data.error || !data.token) {
    console.error('Auth response error:', data);
    throw new Error(data.message || 'No authentication token received');
  }

  console.log('Auth token received successfully');
  return data.token;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const paymentRequest: PaymentRequest = await req.json();
    console.log('Payment request received:', { orderId: paymentRequest.orderId, amount: paymentRequest.amount });

    // Validate required fields
    if (!paymentRequest.orderId || !paymentRequest.amount || !paymentRequest.customer?.name || !paymentRequest.customer?.phone) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation Error', 
          message: 'Missing required payment information' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check environment variables
    const baseUrl = Deno.env.get('PESAPAL_BASE_URL') || 'https://pay.pesapal.com/v3';
    const ipnId = Deno.env.get('PESAPAL_IPN_ID');
    
    console.log('Environment check:', {
      hasConsumerKey: !!Deno.env.get('PESAPAL_CONSUMER_KEY'),
      hasConsumerSecret: !!Deno.env.get('PESAPAL_CONSUMER_SECRET'),
      hasIpnId: !!ipnId,
      baseUrl
    });

    if (!ipnId) {
      console.error('PESAPAL_IPN_ID not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration Error', 
          message: 'Payment system not properly configured. Please contact support. (Missing IPN ID)' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get authentication token
    const token = await getAuthToken();

    // Prepare payment data according to Pesapal API v3 specification
    const paymentData = {
      id: paymentRequest.orderId,
      currency: paymentRequest.currency,
      amount: paymentRequest.amount,
      description: paymentRequest.description,
      callback_url: paymentRequest.callbackUrl,
      notification_id: ipnId,
      billing_address: {
        email_address: paymentRequest.customer.email || `${paymentRequest.customer.phone.replace('+', '')}@manziz.com`,
        phone_number: paymentRequest.customer.phone,
        country_code: 'UG',
        first_name: paymentRequest.customer.name.split(' ')[0] || 'Customer',
        last_name: paymentRequest.customer.name.split(' ').slice(1).join(' ') || 'Manziz',
        line_1: 'Kampala, Uganda',
        city: 'Kampala',
        state: 'Central',
        postal_code: '00000',
        zip_code: '00000'
      }
    };

    console.log('Sending payment request to Pesapal:', {
      id: paymentData.id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      notification_id: paymentData.notification_id
    });

    const response = await fetch(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });

    const responseText = await response.text();
    console.log('Pesapal response status:', response.status);
    console.log('Pesapal response body:', responseText);

    if (!response.ok) {
      console.error('Pesapal payment API error:', response.status, responseText);
      
      // Provide more specific error messages based on status code
      let errorMessage = 'Payment initialization failed';
      if (response.status === 400) {
        errorMessage = 'Invalid payment data. Please check your order details and try again.';
      } else if (response.status === 401) {
        errorMessage = 'Payment system authentication failed. Please contact support.';
      } else if (response.status === 403) {
        errorMessage = 'Payment system access denied. Please contact support to verify your account configuration.';
      } else if (response.status === 404) {
        errorMessage = 'Payment service endpoint not found. Please contact support.';
      } else if (response.status >= 500) {
        errorMessage = 'Payment service temporarily unavailable. Please try again in a few minutes.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Payment Request Failed', 
          message: errorMessage,
          details: `Status: ${response.status}`,
          supportInfo: 'If this problem persists, please contact support with your order details.'
        }),
        {
          status: 400, // Always return 400 to client for payment failures
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Pesapal response:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Response', 
          message: 'Received invalid response from payment service. Please try again.' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Parsed Pesapal response:', data);

    if (data.error) {
      console.error('Pesapal returned error:', data);
      return new Response(
        JSON.stringify({ 
          error: data.error, 
          message: data.message || 'Payment initialization failed. Please try again or contact support.' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!data.redirect_url) {
      console.error('No redirect URL in response:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Response', 
          message: 'Payment service did not provide a payment URL. Please try again or contact support.' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Payment initialization successful');

    return new Response(
      JSON.stringify({
        paymentUrl: data.redirect_url,
        transactionId: data.order_tracking_id || data.merchant_reference || paymentRequest.orderId,
        status: data.status || 'PENDING',
        orderTrackingId: data.order_tracking_id || data.merchant_reference || paymentRequest.orderId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in Pesapal payment function:', error);
    
    let errorMessage = 'Failed to process payment request';
    if (error instanceof Error) {
      if (error.message.includes('credentials not configured')) {
        errorMessage = 'Payment system not properly configured. Please contact support.';
      } else if (error.message.includes('Authentication failed')) {
        errorMessage = 'Payment system authentication failed. Please contact support.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to payment service. Please check your internet connection and try again.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Server Error', 
        message: errorMessage,
        supportInfo: 'If this problem persists, please contact support.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});