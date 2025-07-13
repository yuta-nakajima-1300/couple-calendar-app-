# Deployment Guide for Couple Calendar App

## Environment Variables Setup

This app requires Firebase configuration through environment variables. 

### Required Environment Variables

```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
EXPO_PUBLIC_ENVIRONMENT=production
```

### Netlify Deployment

1. **Important**: Do NOT commit sensitive Firebase credentials to the repository
2. Set environment variables in Netlify Dashboard:
   - Go to Site settings > Environment variables
   - Add all the required environment variables listed above
3. Remove any hardcoded credentials from `netlify.toml`
4. Deploy using the Netlify CLI or Git integration

### Local Development

1. Create a `.env` file in the project root
2. Add all required environment variables
3. Run `npm start` or `npm run web` to start development

### Security Notes

- Never commit `.env` files to version control
- Always use environment variables for sensitive configuration
- The `.env` file is already in `.gitignore`
- For production deployments, set environment variables directly in the hosting platform (Netlify, Vercel, etc.)