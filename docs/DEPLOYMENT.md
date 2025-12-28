# GitHub Pages Deployment Guide

## Quick Deployment Steps

### 1. Initialize Git Repository

```bash
# Navigate to your project directory
cd "/Users/chuehankuo/Desktop/StoryMakers Website"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: StoryMakers Taiwan website"

# Rename branch to main (if needed)
git branch -M main
```

### 2. Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **+** icon in the top right → **New repository**
3. Repository name: `storymakers-website` (or your preferred name)
4. Description: "StoryMakers Taiwan website"
5. Visibility: **Public** (required for free GitHub Pages) or **Private** (requires GitHub Pro)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **Create repository**

### 3. Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/storymakers-website.git

# Push to GitHub
git push -u origin main
```

### 4. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**
6. Wait 1-2 minutes for GitHub to build your site
7. Your site will be available at:
   ```
   https://YOUR_USERNAME.github.io/storymakers-website/
   ```

### 5. Update Domain References (Optional)

After deployment, you may want to update domain references:

1. **sitemap.xml**: Update `https://storymakers.tw/` to your GitHub Pages URL or custom domain
2. **All HTML files**: Update Open Graph `og:url` and canonical URLs if you want to use a custom domain

To update sitemap and meta tags:

```bash
# Update sitemap.xml
# Replace: https://storymakers.tw/
# With: https://YOUR_USERNAME.github.io/storymakers-website/

# Update meta tags in HTML files (search and replace)
# Replace: https://storymakers.tw/
# With: https://YOUR_USERNAME.github.io/storymakers-website/
```

Or use a custom domain (see Custom Domain section below).

## Custom Domain Setup

### Option 1: Using a Custom Domain with GitHub Pages

1. **Add CNAME file** to your repository root:
   ```
   storymakers.tw
   ```
   (Replace with your actual domain)

2. **Configure DNS** at your domain registrar:
   - Add a CNAME record:
     - Type: `CNAME`
     - Name: `@` or `www` (or both)
     - Value: `YOUR_USERNAME.github.io`
   - Or add A records pointing to GitHub Pages IPs:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153

3. **Configure in GitHub**:
   - Go to repository Settings → Pages
   - Under "Custom domain", enter your domain
   - Check "Enforce HTTPS" (after DNS propagates)

### Option 2: Keep GitHub Pages URL

If you want to keep the `github.io` URL, just update the sitemap and meta tags as described in Step 5 above.

## Updating the Site

To update your site after making changes:

```bash
# Make your changes to files

# Stage changes
git add .

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push origin main
```

GitHub Pages will automatically rebuild your site. Changes typically appear within 1-2 minutes.

## Troubleshooting

### Site Not Loading

1. Check that GitHub Pages is enabled (Settings → Pages)
2. Verify the branch is set to `main` and folder is `/ (root)`
3. Check the Actions tab for any build errors
4. Wait a few minutes - initial deployment can take 2-5 minutes

### CSS/JS Not Loading

- Ensure all paths are relative (they should be: `styles/main.css` not `/styles/main.css`)
- Check browser console for 404 errors
- Verify file names match exactly (case-sensitive on GitHub Pages)

### Supabase Not Working

- Make sure `config.js` is updated with your actual Supabase credentials
- Check browser console for Supabase errors
- Verify your Supabase project is active and configured correctly

## Next Steps

1. Set up Supabase backend (see README.md)
2. Configure `config.js` with your Supabase credentials
3. Create an admin user in Supabase
4. Test the site thoroughly
5. Update sitemap.xml and meta tags with your final domain

