// Pesapal integration utilities - Production-ready implementation
export interface PesapalConfig {
  consumerKey: string
  consumerSecret: string
  baseUrl: string
  callbackUrl: string
  ipnId: string
}

export interface PaymentRequest {
  orderId: string
  amount: number
  currency: string
  description: string
  customer: {
    name: string
    phone: string
    email?: string
  }
  callbackUrl: string
}

export interface PaymentResponse {
  paymentUrl: string
  transactionId: string
  status: string
  orderTrackingId: string
}

export interface AuthResponse {
  token: string
  expiryDate: string
  error?: string
  message?: string
}

// Pesapal configuration using environment variables
const pesapalConfig: PesapalConfig = {
  consumerKey: import.meta.env.VITE_PESAPAL_CONSUMER_KEY || '',
  consumerSecret: import.meta.env.VITE_PESAPAL_CONSUMER_SECRET || '',
  baseUrl: 'https://pay.pesapal.com/v3', // Production Pesapal API
  callbackUrl: import.meta.env.VITE_PESAPAL_CALLBACK_URL || `${window.location.origin}/payment-callback`,
  ipnId: import.meta.env.VITE_PESAPAL_IPN_ID || ''
}

// Get Supabase URL for Edge Functions
const getSupabaseUrl = () => {
  return import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
}

// Initialize payment with Pesapal via Edge Function
export const initiatePesapalPayment = async (paymentRequest: PaymentRequest): Promise<PaymentResponse> => {
  try {
    console.log('Initiating payment via Edge Function')

    const supabaseUrl = getSupabaseUrl()
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/pesapal-payment`

    console.log('Calling Edge Function:', edgeFunctionUrl)
    console.log('Payment request:', {
      orderId: paymentRequest.orderId,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      customer: paymentRequest.customer
    })

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentRequest)
    })

    console.log('Edge Function response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edge Function error response:', errorText)
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: 'Unknown error', message: errorText }
      }

      console.error('Edge Function error:', errorData)
      throw new Error(errorData.message || `Payment initialization failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('Payment initialization successful:', data)

    if (!data.paymentUrl) {
      throw new Error('No payment URL received from payment service')
    }

    return {
      paymentUrl: data.paymentUrl,
      transactionId: data.transactionId || data.orderTrackingId,
      status: data.status || 'PENDING',
      orderTrackingId: data.orderTrackingId || data.transactionId
    }

  } catch (error) {
    console.error('Error initiating Pesapal payment:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        throw new Error('Unable to connect to payment service. Please check your internet connection and try again.')
      } else if (error.message.includes('Configuration Error') || error.message.includes('not properly configured')) {
        throw new Error('Payment system is not properly configured. Please contact support.')
      } else if (error.message.includes('Authentication failed') || error.message.includes('Invalid credentials')) {
        throw new Error('Payment system authentication failed. Please contact support.')
      } else if (error.message.includes('Payment Request Failed')) {
        throw new Error('Payment initialization failed. Please check your details and try again.')
      } else {
        throw error
      }
    }
    
    throw new Error('Failed to initialize payment. Please try again or contact support.')
  }
}

// Verify payment status via Edge Function
export const verifyPesapalPayment = async (orderTrackingId: string): Promise<{ status: string; amount: number }> => {
  try {
    console.log('Verifying payment via Edge Function')

    const supabaseUrl = getSupabaseUrl()
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/pesapal-verify`

    const response = await fetch(`${edgeFunctionUrl}?orderTrackingId=${orderTrackingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Verification failed' }))
      console.error('Payment verification error:', errorData)
      throw new Error(errorData.message || 'Payment verification failed')
    }

    const data = await response.json()
    console.log('Payment verification successful:', data)

    return {
      status: data.status || 'UNKNOWN',
      amount: data.amount || 0
    }

  } catch (error) {
    console.error('Error verifying payment:', error)
    throw new Error('Failed to verify payment status')
  }
}

// Generate test payment URL for development/fallback
export const generateTestPaymentUrl = (orderId: string): string => {
  const params = new URLSearchParams({
    orderID: orderId,
    status: 'COMPLETED',
    transactionID: `TEST_${Date.now()}`,
    orderTrackingId: `TEST_TRACK_${Date.now()}`
  })
  
  return `${pesapalConfig.callbackUrl}?${params.toString()}`
}

// Validate Pesapal configuration
export const validatePesapalConfig = (): boolean => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const consumerKey = import.meta.env.VITE_PESAPAL_CONSUMER_KEY
  const consumerSecret = import.meta.env.VITE_PESAPAL_CONSUMER_SECRET
  const ipnId = import.meta.env.VITE_PESAPAL_IPN_ID
  
  return !!(supabaseUrl && supabaseKey && consumerKey && consumerSecret && ipnId)
}

// Get configuration status for debugging
export const getPesapalConfigStatus = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const consumerKey = import.meta.env.VITE_PESAPAL_CONSUMER_KEY
  const consumerSecret = import.meta.env.VITE_PESAPAL_CONSUMER_SECRET
  const ipnId = import.meta.env.VITE_PESAPAL_IPN_ID
  
  return {
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseKey: !!supabaseKey,
    hasConsumerKey: !!consumerKey,
    hasConsumerSecret: !!consumerSecret,
    hasIpnId: !!ipnId,
    callbackUrl: pesapalConfig.callbackUrl,
    isValid: validatePesapalConfig(),
    mode: 'production', // Now using production Pesapal
    baseUrl: pesapalConfig.baseUrl
  }
}