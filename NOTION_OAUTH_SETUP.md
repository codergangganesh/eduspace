# Notion OAuth Setup Guide

## How to Get Notion OAuth Client ID and Secret Key

### Step 1: Create a Notion Integration

1. **Go to Notion Integrations Page**
   - Visit: https://www.notion.so/my-integrations
   - Sign in with your Notion account if not already logged in

2. **Create New Integration**
   - Click the **"+ New integration"** button
   - You'll see a form to create your integration

### Step 2: Configure Your Integration

Fill in the following details:

1. **Basic Information**
   - **Name**: `EduSpace` (or your app name)
   - **Logo**: Upload your app logo (optional)
   - **Associated workspace**: Select your Notion workspace

2. **Integration Type**
   - Select **"Public integration"** (for OAuth)
   - This allows users to authorize your app to access their Notion data

3. **Capabilities** (Select what your app needs)
   - ✅ **Read content** - If you need to read Notion pages/databases
   - ✅ **Update content** - If you need to modify Notion pages/databases
   - ✅ **Insert content** - If you need to create new pages/databases
   - ✅ **Read user information** - To get user profile data
   - ✅ **Read comments** - If you need to access comments (optional)
   - ✅ **Insert comments** - If you need to add comments (optional)

4. **User Capabilities**
   - ✅ **Request user information** - To identify users
   - This is important for OAuth flow

### Step 3: Configure OAuth Settings

1. **Redirect URIs** (Very Important!)
   Add your callback URLs:
   
   **For Development:**
   ```
   http://localhost:5173/auth/callback
   ```
   
   **For Production:**
   ```
   https://yourdomain.com/auth/callback
   ```
   
   ⚠️ **Important**: The redirect URI must EXACTLY match what you configure in your app!

2. **Organization Information** (Optional but recommended)
   - **Website**: Your app's website
   - **Privacy Policy URL**: Link to your privacy policy
   - **Terms of Service URL**: Link to your terms of service

### Step 4: Submit for Review (Public Integrations)

1. Click **"Submit for review"** button
2. Notion will review your integration (usually takes a few days)
3. You'll receive an email when approved

⚠️ **Note**: You can still test in development mode before approval!

### Step 5: Get Your Credentials

After creating the integration:

1. **OAuth Client ID**
   - Found in the **"OAuth Domain & URIs"** section
   - Labeled as **"OAuth client ID"**
   - Format: `secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Copy this value

2. **OAuth Client Secret**
   - Found in the **"Secrets"** section
   - Click **"Show"** to reveal the secret
   - Labeled as **"OAuth client secret"**
   - Format: `secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Copy this value

3. **Internal Integration Token** (Different from OAuth!)
   - This is NOT used for OAuth
   - Only use this for server-to-server integrations
   - For OAuth, you only need Client ID and Client Secret

### Step 6: Add to Your Environment Variables

Add these to your `.env` file:

```env
# Notion OAuth Configuration
VITE_NOTION_CLIENT_ID=your_oauth_client_id_here
NOTION_CLIENT_SECRET=your_oauth_client_secret_here

# Notion OAuth URLs (these are standard)
VITE_NOTION_AUTH_URL=https://api.notion.com/v1/oauth/authorize
VITE_NOTION_TOKEN_URL=https://api.notion.com/v1/oauth/token
```

⚠️ **Security Notes:**
- ✅ Client ID can be public (prefix with `VITE_`)
- ❌ Client Secret MUST be private (NO `VITE_` prefix)
- ❌ Never commit `.env` to git
- ✅ Add `.env` to `.gitignore`

### Step 7: Notion OAuth Flow

Here's how the OAuth flow works:

```
1. User clicks "Sign in with Notion"
   ↓
2. Redirect to Notion authorization URL:
   https://api.notion.com/v1/oauth/authorize?
     client_id=YOUR_CLIENT_ID&
     response_type=code&
     owner=user&
     redirect_uri=YOUR_REDIRECT_URI
   ↓
3. User authorizes your app in Notion
   ↓
4. Notion redirects back to your redirect_uri with code:
   http://localhost:5173/auth/callback?code=AUTHORIZATION_CODE
   ↓
5. Exchange code for access token:
   POST https://api.notion.com/v1/oauth/token
   Body: {
     grant_type: "authorization_code",
     code: "AUTHORIZATION_CODE",
     redirect_uri: "YOUR_REDIRECT_URI"
   }
   Auth: Basic base64(client_id:client_secret)
   ↓
6. Receive access token and user info
   ↓
7. Use access token to make API calls
```

## Testing Your Integration

### Development Mode Testing

Even before approval, you can test with:
- ✅ Your own Notion account
- ✅ Workspace members you invite
- ❌ Public users (need approval first)

### Test the OAuth Flow

1. **Start your dev server**
   ```bash
   npm run dev
   ```

2. **Navigate to your app**
   ```
   http://localhost:5173
   ```

3. **Click "Sign in with Notion"**
   - You should be redirected to Notion
   - Authorize the app
   - Should redirect back to your app

4. **Check the console**
   - Look for the authorization code
   - Verify token exchange works

## Common Issues & Solutions

### Issue 1: "Invalid redirect_uri"
**Solution**: Make sure the redirect URI in your code EXACTLY matches what you configured in Notion
```javascript
// Must match: http://localhost:5173/auth/callback
const redirectUri = `${window.location.origin}/auth/callback`;
```

### Issue 2: "Invalid client credentials"
**Solution**: 
- Double-check your Client ID and Client Secret
- Make sure there are no extra spaces
- Verify you're using OAuth credentials, not the Internal Integration Token

### Issue 3: "Integration not found"
**Solution**: 
- Make sure you created a "Public integration"
- Verify the integration is active
- Check if it's still pending review

### Issue 4: CORS errors
**Solution**: 
- Token exchange must happen on the backend (server-side)
- Don't expose Client Secret in frontend code
- Use Supabase Edge Functions or your backend API

## Notion API Resources

- **Official Documentation**: https://developers.notion.com/
- **OAuth Guide**: https://developers.notion.com/docs/authorization
- **API Reference**: https://developers.notion.com/reference/intro
- **Integration Settings**: https://www.notion.so/my-integrations
- **Community Forum**: https://developers.notion.com/community

## Security Best Practices

1. ✅ **Store secrets securely**
   - Use environment variables
   - Never commit to version control
   - Use secret management in production

2. ✅ **Validate redirect URIs**
   - Only allow whitelisted URIs
   - Use HTTPS in production

3. ✅ **Handle tokens securely**
   - Store access tokens encrypted
   - Implement token refresh
   - Clear tokens on logout

4. ✅ **Implement proper scopes**
   - Only request permissions you need
   - Explain to users why you need each permission

5. ✅ **Rate limiting**
   - Notion API has rate limits
   - Implement exponential backoff
   - Cache responses when possible

## Next Steps

After getting your credentials:

1. ✅ Add them to `.env` file
2. ✅ Implement Notion OAuth in your app
3. ✅ Test the complete flow
4. ✅ Handle token storage and refresh
5. ✅ Implement Notion API calls
6. ✅ Submit for review (if public)
7. ✅ Deploy to production

## Support

If you encounter issues:
- Check Notion's status page: https://status.notion.so/
- Review the API changelog: https://developers.notion.com/page/changelog
- Ask in the developer community
- Contact Notion support: developers@makenotion.com
