# Vercel Deployment Guide - PrismVI25 DNG Processor

## 🚀 Deployment Instructions

### 1. Frontend Deployment (Vercel)

#### Environment Variables Setup
In your Vercel dashboard, add these environment variables:

```
REACT_APP_API_URL=https://your-backend-url.herokuapp.com/api
```

#### Deploy Steps
1. Connect your GitHub repo to Vercel
2. Set the environment variable above
3. Deploy - Vercel will automatically detect it's a React app

### 2. Backend Deployment (Heroku/Render)

#### Option A: Heroku
```bash
# Create Procfile
echo "web: python dng_backend.py" > Procfile

# Create requirements.txt
pip freeze > requirements.txt

# Deploy to Heroku
heroku create your-app-name
heroku config:set FLASK_ENV=production
git push heroku main
```

#### Option B: Render
1. Connect your GitHub repo to Render
2. Set environment variable: `FLASK_ENV=production`
3. Deploy - Render will detect Python app

### 3. CORS Configuration

The backend is already configured for CORS with:
- ✅ Allow all origins (`*`)
- ✅ All methods supported
- ✅ Preflight handling
- ✅ Proper headers

### 4. Frontend API Configuration

The frontend automatically uses:
- **Local**: `http://localhost:5001` (development)
- **Production**: `REACT_APP_API_URL` environment variable

### 5. Testing CORS

```bash
# Test CORS preflight
curl -X OPTIONS https://your-backend-url.herokuapp.com/api/kpi-data \
  -H "Origin: https://your-vercel-app.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type"
```

## 🔧 Troubleshooting

### CORS Issues
If you still get CORS errors:

1. **Check Backend URL**: Make sure `REACT_APP_API_URL` is correct
2. **Verify Backend**: Ensure backend is running and accessible
3. **Network Tab**: Check browser network tab for exact error

### Common Solutions
```javascript
// In frontend, add this to axios config if needed
const config = {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }
};
```

## 📊 Features Working in Production

### ✅ Dynamic Dashboard
- **Images Processed**: Real-time counter
- **Satisfaction**: Updates from user ratings
- **Auto-refresh**: Every 5 seconds

### ✅ Satisfaction Survey
- **Rating Dialog**: Appears after each enhancement
- **1-5 Stars**: User satisfaction tracking
- **Persistent**: Ratings stored in backend

### ✅ Enhanced CORS
- **All Origins**: `*` for deployment flexibility
- **All Methods**: GET, POST, OPTIONS, PUT, DELETE
- **Preflight**: Automatic handling
- **Headers**: Content-Type, Authorization, X-Requested-With

## 🌐 Production URLs

Replace these with your actual URLs:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.herokuapp.com`

## 🎯 Quick Test

1. Deploy both frontend and backend
2. Set `REACT_APP_API_URL` in Vercel
3. Upload a DNG file
4. Check if satisfaction dialog appears
5. Verify dashboard updates dynamically

## 📝 Environment Files

### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend-url.herokuapp.com
```

### Backend (requirements.txt)
```
Flask==2.3.3
Flask-CORS==4.0.0
rawpy==0.18.0
exifread==3.0.0
opencv-python==4.8.1.78
numpy==1.24.3
Pillow==10.0.0
```

Your PrismVI25 DNG Processor is now ready for production deployment! 🎯
