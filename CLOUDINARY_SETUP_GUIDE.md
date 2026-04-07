# 🖼️ Cloudinary Image Storage Setup Guide

## Why Cloudinary?

On Render's free tier, uploaded images are stored in **ephemeral storage** and are **deleted when the app restarts**. Cloudinary provides persistent cloud storage for images.

---

## Step 1: Sign Up for Cloudinary (FREE)

1. Go to: https://cloudinary.com/users/register_free
2. Create a free account
3. **Free tier includes:**
   - 25 GB storage
   - 25 GB bandwidth/month
   - Image transformations (resize, crop, optimize)

---

## Step 2: Get Your Cloudinary Credentials

1. After signing up, go to: https://console.cloudinary.com/
2. You'll see your **Dashboard** with three important values:
   ```
   Cloud Name: dxxxxxxxxx
   API Key: 123456789012345
   API Secret: AbCdEfGhIjKlMnOpQrStUvWxYz
   ```
3. **Copy these values** - you'll need them in the next steps

---

## Step 3: Update Local .env File

Open `BACKEND/.env` and add your Cloudinary credentials:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=dqr8xv9p2
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz
```

---

## Step 4: Install Cloudinary Packages

Run in the `BACKEND` directory:

```bash
cd BACKEND
npm install
```

This will install:
- `cloudinary` - Cloudinary SDK
- `multer-storage-cloudinary` - Multer integration for Cloudinary

---

## Step 5: Add Cloudinary Credentials to Render

1. Go to your Render dashboard: https://dashboard.render.com/
2. Click on your **lost-and-found-app** service
3. Go to **Environment** tab
4. Add these three environment variables:

   | Key | Value |
   |-----|-------|
   | `CLOUDINARY_CLOUD_NAME` | Your cloud name |
   | `CLOUDINARY_API_KEY` | Your API key |
   | `CLOUDINARY_API_SECRET` | Your API secret |

5. Click **Save Changes**
6. Render will automatically redeploy with the new variables

---

## Step 6: Delete Old itemRoutes.js File

There's an old file in the root directory with hardcoded URLs. Delete it:

**Option A: Double-click the batch file**
```
delete-old-file.bat
```

**Option B: Manual deletion**
Delete this file:
```
itemRoutes.js  (in the root directory, NOT in BACKEND/routes/)
```

---

## Step 7: Test Locally

1. Start your backend server:
   ```bash
   cd BACKEND
   npm start
   ```

2. Upload an image through your frontend or Postman
3. Check the console logs - you should see:
   ```
   Image uploaded: {
     filename: 'item-1234567890',
     path: 'https://res.cloudinary.com/your-cloud/image/upload/...',
     imageURL: 'https://res.cloudinary.com/your-cloud/image/upload/...',
     storage: 'Cloudinary'
   }
   ```

4. The `imageURL` should start with `https://res.cloudinary.com/`

---

## Step 8: Deploy to Render

1. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: Add Cloudinary image storage for persistent images"
   git push origin main
   ```

2. Render will automatically deploy
3. Once deployed, test image uploads on your live site

---

## How It Works

### Before (Ephemeral Storage):
```
User uploads image → Saved to /uploads folder on Render server
→ Server restarts → ❌ Image is DELETED
```

### After (Cloudinary):
```
User uploads image → Uploaded to Cloudinary cloud storage
→ Cloudinary returns permanent URL → Saved in MongoDB
→ Server restarts → ✅ Image remains accessible via Cloudinary URL
```

---

## Features

✅ **Automatic fallback**: If Cloudinary credentials are not set, falls back to local storage  
✅ **Image optimization**: Cloudinary automatically optimizes images (max 1200x900, auto quality)  
✅ **Image transformations**: Supports resize, crop, format conversion  
✅ **CDN delivery**: Images served through Cloudinary's global CDN for fast loading  
✅ **Persistent storage**: Images survive app restarts and redeployments  

---

## Troubleshooting

### Images still using local storage?

Check the console logs when uploading. It should show:
```
storage: 'Cloudinary'
```

If it shows `storage: 'Local'`, check:
1. Environment variables are set correctly in Render
2. No typos in variable names
3. Render has redeployed after adding variables

### Upload fails with "Invalid credentials"?

- Double-check your Cloudinary credentials
- Make sure there are no extra spaces in the .env file
- Try regenerating your API secret in Cloudinary dashboard

### Images not loading?

- Check the imageURL in MongoDB - it should start with `https://res.cloudinary.com/`
- Check your Cloudinary dashboard to see if images are being uploaded
- Check browser console for CORS errors

---

## Free Tier Limits

Cloudinary free tier is generous:
- **25 GB storage** (enough for ~10,000-25,000 images)
- **25 GB bandwidth/month** (enough for ~100,000-250,000 views)
- **Image transformations included**

If you exceed limits, consider:
1. Upgrading to paid plan
2. Implementing image cleanup (delete old unclaimed items)
3. Using smaller image sizes

---

## Support

- Cloudinary Docs: https://cloudinary.com/documentation
- Cloudinary Support: https://support.cloudinary.com/
- Test upload: https://console.cloudinary.com/console/media_library

---

**✅ All done! Your images will now persist across server restarts!**
