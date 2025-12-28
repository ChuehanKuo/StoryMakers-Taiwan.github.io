# StoryMakers Taiwan Website

A modern, responsive website for StoryMakers Taiwan (故事造城), featuring community storytelling, cultural preservation, and urban regeneration projects.

## Features

- **Static Site**: HTML/CSS/JavaScript (no frameworks)
- **Supabase Backend**: Community submissions and moderation
- **Story System**: Community-contributed stories with approval workflow
- **Responsive Design**: Mobile-first, works on all devices
- **SEO Optimized**: Meta tags, Open Graph, structured data, sitemap

## Deployment on GitHub Pages

### Quick Start

1. **Create a GitHub Repository**
   - Go to GitHub and create a new repository (e.g., `storymakers-website`)
   - Do NOT initialize with README, .gitignore, or license (we already have these)

2. **Push Your Code**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select **Deploy from a branch**
   - Select branch: `main` and folder: `/ (root)`
   - Click **Save**
   - Your site will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### Custom Domain (Optional)

If you want to use a custom domain (e.g., `storymakers.tw`):

1. Add a `CNAME` file in the root directory with your domain name:
   ```
   storymakers.tw
   ```

2. Configure DNS settings at your domain registrar:
   - Type: `CNAME`
   - Name: `@` or `www`
   - Value: `YOUR_USERNAME.github.io`

3. In GitHub repository Settings → Pages, add your custom domain

## Local Development

### Using Python (Recommended)

```bash
# Python 3
python3 -m http.server 8000

# Or Python 2
python -m SimpleHTTPServer 8000
```

Then open: `http://localhost:8000`

### Using Node.js (Alternative)

```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000
```

## Supabase Setup

### 1. Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned (takes a few minutes)

### 3. Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this project
3. Copy and paste the entire SQL script into the SQL Editor
4. Click **Run** to execute the schema
5. Verify that all tables were created successfully

### 4. Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name: `post-images`
4. Set to **Private** (not public)
5. Click **Create bucket**

### 5. Configure Storage Policies

The storage policies are included in `supabase/schema.sql`. If they weren't applied, you can add them manually:

1. Go to **Storage** → **Policies** → **post-images**
2. Add the following policies (or run the storage policy SQL from schema.sql):
   - **Public can upload images**: Allow INSERT for `anon` role
   - **Public can view images**: Allow SELECT for `anon` role

### 6. Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy your **Project URL**
3. Copy your **anon/public** key

### 7. Configure the Website

1. Open `config.js` in the root directory
2. Replace the placeholder values:
   ```javascript
   const CONFIG = {
       supabase: {
           url: 'YOUR_SUPABASE_URL',  // Replace with your Project URL
           anonKey: 'YOUR_SUPABASE_ANON_KEY'  // Replace with your anon key
       }
   };
   ```

### 8. Create Admin User

1. In Supabase dashboard, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter an email and password (save these credentials!)
4. Copy the user's UUID
5. Go to **SQL Editor** and run:
   ```sql
   UPDATE profiles SET is_admin = true WHERE id = 'USER_UUID_HERE';
   ```
   (Replace `USER_UUID_HERE` with the actual UUID)

## Project Structure

```
StoryMakers Website/
├── index.html              # Homepage
├── about.html              # About Us page
├── projects.html           # Projects overview (includes stories section)
├── shilin.html             # Shilin Story Chronicle hub
├── contact.html            # Contact page
├── submit.html             # Story submission form
├── story.html              # Individual story detail page
├── stories.html            # Stories listing page (legacy, redirects to projects)
├── admin.html              # Admin moderation panel
├── shilin-2hr.html         # 2-hour travel guide
├── shilin-halfday.html     # Half-day travel guide
├── shilin-fullday.html     # Full-day travel guide
├── config.js               # Supabase configuration
├── robots.txt              # SEO robots file
├── sitemap.xml             # SEO sitemap
├── assets/                 # Images and media
│   └── images/
├── scripts/                # JavaScript files
│   ├── main.js             # Main site functionality
│   ├── stories.js          # Stories listing logic
│   ├── story.js            # Story detail logic
│   ├── submit.js           # Submission form logic
│   ├── admin.js            # Admin panel logic
│   ├── shilinStories.js    # Shilin stories logic
│   └── supabaseClient.js   # Supabase client initialization
├── styles/                 # CSS files
│   └── main.css            # Main stylesheet
├── data/                   # Static data files
│   └── posts.json          # Sample posts (legacy, not used with Supabase)
└── supabase/               # Database schema
    └── schema.sql          # SQL schema file
```

## Important Notes

- **config.js**: Contains Supabase credentials. For production, consider using environment variables or GitHub Secrets if you need to hide these values.
- **Supabase Keys**: The `anon` key is safe to expose in client-side code (it's designed for public use). The `service_role` key should NEVER be exposed.
- **Admin Access**: Only users with `is_admin = true` in the `profiles` table can access the admin panel.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

Copyright © 2025 StoryMakers Taiwan (故事造城). All rights reserved.
