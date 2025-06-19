# Environment Variables for Deployment

## Required Environment Variables

### Supabase Configuration
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Pesapal Configuration (if using payments)
```
VITE_PESAPAL_CONSUMER_KEY=your_pesapal_consumer_key
VITE_PESAPAL_CONSUMER_SECRET=your_pesapal_consumer_secret
VITE_PESAPAL_BASE_URL=https://www.pesapal.com/api/v2
```

### Environment
```
NODE_ENV=production
```

## How to Get These Values

### Supabase
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key

### Pesapal
1. Contact Pesapal for API credentials
2. Get your Consumer Key and Secret
3. Use the production base URL for live payments

## Security Notes
- Never commit these values to version control
- Use Vercel's environment variables feature
- Keep your Supabase service role key secure (server-side only) 