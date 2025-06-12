import { supabase } from './supabase';

interface PesapalConfig {
  consumerKey: string;
  consumerSecret: string;
  baseUrl: string;
  ipnId: string;
  callbackUrl: string;
}

interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

interface PaymentResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  error?: string;
  status: string;
}

interface PaymentStatus {
  payment_method: string;
  amount: number;
  created_date: string;
  confirmation_code: string;
  payment_status_description: string;
  description: string;
  message: string;
  payment_account: string;
  call_back_url: string;
  status_code: number;
  merchant_reference: string;
  payment_status_code: string;
  currency: string;
}

class PesapalService {
  private config: PesapalConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.config = {
      consumerKey: import.meta.env.VITE_PESAPAL_CONSUMER_KEY,
      consumerSecret: import.meta.env.VITE_PESAPAL_CONSUMER_SECRET,
      baseUrl: import.meta.env.VITE_PESAPAL_BASE_URL,
      ipnId: import.meta.env.VITE_PESAPAL_IPN_ID,
      callbackUrl: import.meta.env.VITE_PESAPAL_CALLBACK_URL
    };

    if (!this.config.consumerKey || !this.config.consumerSecret) {
      throw new Error('PesaPal credentials not configured');
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/Auth/RequestToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          consumer_key: this.config.consumerKey,
          consumer_secret: this.config.consumerSecret
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`PesaPal auth error: ${data.error}`);
      }

      this.accessToken = data.token;
      // Set expiry to 50 minutes (tokens typically last 1 hour)
      this.tokenExpiry = new Date(Date.now() + 50 * 60 * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting PesaPal access token:', error);
      throw error;
    }
  }

  async initiatePayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const token = await this.getAccessToken();
      
      const paymentData = {
        id: paymentRequest.orderId,
        currency: paymentRequest.currency,
        amount: paymentRequest.amount,
        description: paymentRequest.description,
        callback_url: this.config.callbackUrl,
        notification_id: this.config.ipnId,
        billing_address: {
          email_address: paymentRequest.customerEmail,
          phone_number: paymentRequest.customerPhone,
          country_code: "UG",
          first_name: paymentRequest.customerName.split(' ')[0] || paymentRequest.customerName,
          last_name: paymentRequest.customerName.split(' ').slice(1).join(' ') || '',
          line_1: "Kampala, Uganda",
          line_2: "",
          city: "Kampala",
          state: "Central",
          postal_code: "00000",
          zip_code: "00000"
        }
      };

      const response = await fetch(`${this.config.baseUrl}/api/Transactions/SubmitOrderRequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Payment initiation failed: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(`PesaPal payment error: ${result.error}`);
      }

      // Store payment record in database
      await this.storePaymentRecord(paymentRequest.orderId, result.order_tracking_id, 'initiated');

      return result;
    } catch (error) {
      console.error('Error initiating PesaPal payment:', error);
      throw error;
    }
  }

  async checkPaymentStatus(orderTrackingId: string): Promise<PaymentStatus> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(
        `${this.config.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to check payment status: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(`PesaPal status check error: ${result.error}`);
      }

      return result;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  }

  private async storePaymentRecord(orderId: string, trackingId: string, status: string) {
    try {
      const { error } = await supabase
        .from('payments')
        .insert([{
          order_id: orderId,
          tracking_id: trackingId,
          status: status,
          provider: 'pesapal',
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error storing payment record:', error);
      }
    } catch (error) {
      console.error('Error storing payment record:', error);
    }
  }

  async updatePaymentStatus(trackingId: string, status: string, paymentData?: any) {
    try {
      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString()
      };

      if (paymentData) {
        updateData.payment_data = paymentData;
        updateData.confirmation_code = paymentData.confirmation_code;
        updateData.payment_method = paymentData.payment_method;
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('tracking_id', trackingId);

      if (error) {
        console.error('Error updating payment status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  async handlePaymentCallback(trackingId: string, merchantReference: string) {
    try {
      // Check payment status with PesaPal
      const paymentStatus = await this.checkPaymentStatus(trackingId);
      
      // Update payment record
      await this.updatePaymentStatus(trackingId, paymentStatus.payment_status_description, paymentStatus);
      
      // Update order status based on payment
      if (paymentStatus.status_code === 1) { // Payment successful
        await supabase
          .from('orders')
          .update({ 
            payment_status: 'completed',
            order_status: 'confirmed'
          })
          .eq('id', merchantReference);
      } else if (paymentStatus.status_code === 2) { // Payment failed
        await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', merchantReference);
      }

      return paymentStatus;
    } catch (error) {
      console.error('Error handling payment callback:', error);
      throw error;
    }
  }

  // Utility method to format amount for PesaPal (they expect amount in smallest currency unit)
  formatAmount(amount: number): number {
    // For UGX, PesaPal expects the amount as-is (no decimal conversion needed)
    return Math.round(amount);
  }

  // Validate payment data before sending to PesaPal
  validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.orderId || request.orderId.trim() === '') {
      errors.push('Order ID is required');
    }

    if (!request.amount || request.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!request.customerName || request.customerName.trim() === '') {
      errors.push('Customer name is required');
    }

    if (!request.customerEmail || !this.isValidEmail(request.customerEmail)) {
      errors.push('Valid customer email is required');
    }

    if (!request.customerPhone || request.customerPhone.trim() === '') {
      errors.push('Customer phone is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const pesapalService = new PesapalService();
export type { PaymentRequest, PaymentResponse, PaymentStatus };