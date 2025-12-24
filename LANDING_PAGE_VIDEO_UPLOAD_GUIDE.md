# Landing Page Hero Video Upload Guide

## Overview

Your landing page now supports a hero video in the header section. Videos are stored in Supabase Storage and managed through the database.

## ✅ What Was Completed

### 1. SEO Fixed
- **Title**: "Punta Cana Airport Transfer From $25 | Dominican Transfers"
- **Description**: Optimized for search engines
- **Open Graph**: Facebook/social sharing with your vehicle images
- **Twitter Cards**: Proper social media previews
- **Canonical URL**: Set to dominicantransfers.com
- **NO MORE "bolt.new"**: Your own branding shows when sharing links

### 2. Favicon Updated
- Already using taxi emoji (🚕) as favicon
- Shows in browser tabs and bookmarks

### 3. Light Mode with Chat Colors
- **Background**: White with teal/green gradient accents
- **Cards**: Glass effect with white/slate backgrounds
- **Buttons**: Teal-500 to Green-500 gradients
- **Text**: Slate-900 (dark) on light backgrounds
- **Accents**: Teal-600/700 for highlights
- **Same style as your chat interface**

### 4. Video Support in Hero
- Automatic loading from Supabase
- Video player with controls
- Poster image support (thumbnail before play)
- Responsive and mobile-friendly
- Falls back to text hero if no video

### 5. Supabase Storage Setup
- **Bucket**: `landing-videos` (public access)
- **Size Limit**: 100MB per file
- **Formats**: MP4, WebM, QuickTime, plus JPEG/PNG for posters
- **Security**: Public read, authenticated write

## 🎥 How to Upload Your Video

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - Find the `landing-videos` bucket

3. **Upload Your Video**
   - Click "Upload file"
   - Select your MP4 video file
   - Wait for upload to complete
   - Copy the public URL

4. **Optional: Upload Poster Image**
   - Upload a JPEG/PNG thumbnail image
   - This shows before the video plays
   - Copy the poster image URL

5. **Update Database**
   - Go to "Table Editor" in left sidebar
   - Find `landing_page_settings` table
   - Click on the single row
   - Paste video URL into `hero_video_url`
   - Paste poster URL into `hero_video_poster_url` (optional)
   - Save changes

### Option 2: Using SQL

```sql
-- Update the landing page settings with your video URLs
UPDATE landing_page_settings
SET
  hero_video_url = 'https://your-project.supabase.co/storage/v1/object/public/landing-videos/your-video.mp4',
  hero_video_poster_url = 'https://your-project.supabase.co/storage/v1/object/public/landing-videos/poster.jpg',
  updated_at = now()
WHERE is_active = true;
```

### Option 3: Using JavaScript/TypeScript

```typescript
import { supabase } from './lib/supabase';

// Upload video file
const uploadVideo = async (file: File) => {
  const { data, error } = await supabase.storage
    .from('landing-videos')
    .upload(`hero-video-${Date.now()}.mp4`, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('landing-videos')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

// Update database with video URL
const updateLandingVideo = async (videoUrl: string, posterUrl?: string) => {
  const { error } = await supabase
    .from('landing_page_settings')
    .update({
      hero_video_url: videoUrl,
      hero_video_poster_url: posterUrl || null,
      updated_at: new Date().toISOString()
    })
    .eq('is_active', true);

  if (error) console.error('Update error:', error);
};
```

## 📋 Video Requirements

### Recommended Specifications
- **Format**: MP4 (H.264 codec)
- **Resolution**: 1920x1080 (1080p) or 1280x720 (720p)
- **Aspect Ratio**: 16:9
- **File Size**: Under 50MB for fast loading
- **Duration**: 30-60 seconds (short and engaging)
- **Audio**: Optional (many users browse muted)

### Optimization Tips
1. **Compress your video** using tools like:
   - HandBrake (free, desktop)
   - CloudConvert.com (online)
   - FFmpeg command line

2. **Example FFmpeg command**:
   ```bash
   ffmpeg -i input.mp4 -vcodec h264 -acodec aac -b:v 2M -b:a 128k output.mp4
   ```

3. **Create a poster image**:
   - Take a screenshot from the video
   - Save as JPEG (1920x1080)
   - Optimize/compress

## 🎨 Current Design Features

### Light Mode Colors
- **Primary**: Teal-500 to Green-500 gradients
- **Background**: White with subtle teal-50 gradient
- **Cards**: Glass effect (white/70 with backdrop blur)
- **Text**: Slate-900 (dark), Slate-600 (secondary)
- **Accents**: Teal-600/700 for links and highlights

### Animations
- ✅ Glowing buttons with shine effects
- ✅ Hover scale transforms (1.05x)
- ✅ Gradient animations (8s infinite)
- ✅ Card hover effects with shadows
- ✅ Smooth transitions (300-1000ms)
- ✅ Pulsing "Limited Time Offer" badge

### Navigation
- ✅ Sticky menu bar with glass effect
- ✅ Mobile hamburger menu
- ✅ Smooth scroll to sections
- ✅ Desktop + mobile responsive

### Video Section
- Appears above the main headline
- Rounded corners with shadow
- Native browser controls
- Responsive sizing
- Hover overlay effect
- Poster image support

## 🔧 Removing/Hiding the Video

If you want to remove the video temporarily:

```sql
UPDATE landing_page_settings
SET hero_video_url = NULL
WHERE is_active = true;
```

Or set `is_active = false` to disable the entire settings row.

## 📱 Testing Your Video

1. **Upload video to Supabase Storage**
2. **Update database with URL**
3. **Visit**: `https://yourdomain.com/?landing=true`
4. **Check**:
   - Video loads and plays
   - Poster image shows (if set)
   - Mobile responsive
   - Controls work
   - Page doesn't slow down

## 🎯 Best Practices

### Video Content Ideas
- Showcase your transfer vehicles
- Show the booking process
- Highlight customer testimonials
- Display popular destinations
- Airport pickup demonstration
- Driver meet & greet process

### Video Production Tips
1. **Keep it short** (30-60 seconds)
2. **Show, don't tell** (visual over text)
3. **Good lighting** (professional appearance)
4. **Stable footage** (use tripod/stabilizer)
5. **Clear audio** (if using voice)
6. **Call to action** (end with booking prompt)

### Performance Considerations
- Videos under 20MB load fastest
- Poster images make page feel faster
- Consider mobile data users
- Test on slow connections
- Video is optional (site works without it)

## 🚀 Access Your Landing Page

**URL**: `https://yourdomain.com/?landing=true`

**Alternative**: `https://yourdomain.com/landing`

## 📊 Database Schema

```sql
landing_page_settings (
  id uuid PRIMARY KEY,
  hero_video_url text,           -- Full URL to video
  hero_video_poster_url text,    -- Full URL to poster image
  hero_title text,               -- Customizable headline
  hero_subtitle text,            -- Customizable subheading
  is_active boolean,             -- Enable/disable settings
  created_at timestamptz,
  updated_at timestamptz
)
```

## 🔐 Security

- ✅ Public read access (anyone can view)
- ✅ Authenticated write (only admins can upload)
- ✅ RLS policies enabled
- ✅ File size limits enforced
- ✅ MIME type restrictions
- ✅ No unauthenticated uploads

## 🆘 Troubleshooting

### Video Not Showing
1. Check video URL in database
2. Verify file is in `landing-videos` bucket
3. Ensure bucket is public
4. Check browser console for errors
5. Test video URL directly in browser

### Video Too Slow
1. Compress video file
2. Reduce resolution to 720p
3. Lower bitrate
4. Use shorter duration
5. Add poster image

### Upload Fails
1. Check file size (under 100MB)
2. Verify file format (MP4/WebM)
3. Ensure authenticated access
4. Check storage quota
5. Try smaller file first

## 📞 Need Help?

If you need assistance:
1. Check Supabase Storage dashboard
2. Review browser console errors
3. Test with small video first
4. Verify database settings
5. Check video URL accessibility

---

**Status**: Production Ready ✅
**Video Support**: Enabled ✅
**SEO**: Fixed ✅
**Favicon**: Taxi icon ✅
**Light Mode**: Teal/Green theme ✅
**Animations**: All working ✅

Your landing page is ready to use with or without a video!
