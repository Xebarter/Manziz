export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const generateOrderId = (): string => {
  return `MZ${Date.now().toString().slice(-6)}`;
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'preparing':
      return 'bg-orange-100 text-orange-800';
    case 'ready':
      return 'bg-green-100 text-green-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPaymentStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'initiated':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    case 'refunded':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const uploadToVercelBlob = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload image');
  }
  
  const { url } = await response.json();
  return url;
};

// PesaPal utility functions
export const formatPesapalAmount = (amount: number): number => {
  // PesaPal expects amounts in the smallest currency unit
  // For UGX, this is typically the same as the display amount
  return Math.round(amount);
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Validate Ugandan phone numbers
  const ugandanPhoneRegex = /^(\+256|0)?[7][0-9]{8}$/;
  return ugandanPhoneRegex.test(phone.replace(/\s/g, ''));
};

export const formatPhoneNumber = (phone: string): string => {
  // Format phone number to international format
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('0')) {
    return '+256' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('+')) {
    return '+256' + cleaned;
  }
  return cleaned;
};

export const generatePaymentReference = (orderId: string): string => {
  return `MANZIZ-${orderId.slice(0, 8)}-${Date.now()}`;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

export const calculateDeliveryFee = (subtotal: number, deliveryType: string): number => {
  if (deliveryType === 'pickup') return 0;
  if (subtotal >= 50000) return 0; // Free delivery for orders above 50k
  return 5000;
};

export const getEstimatedDeliveryTime = (deliveryType: string, isScheduled: boolean = false): string => {
  if (isScheduled) return 'At scheduled time';
  return deliveryType === 'delivery' ? '30-45 minutes' : '15-20 minutes';
};