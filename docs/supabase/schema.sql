-- ============================================
-- StoryMakers Taiwan - Supabase Database Schema
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Tables
-- ============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    title_zh TEXT,
    excerpt TEXT,
    excerpt_zh TEXT,
    content JSONB NOT NULL, -- Array of content blocks
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    slug TEXT UNIQUE,
    project_district TEXT DEFAULT 'Shilin',
    cover_image_url TEXT,
    author_id UUID REFERENCES public.profiles(id),
    author_name TEXT,
    author_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post tags junction table
CREATE TABLE IF NOT EXISTS public.post_tags (
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Post images table
CREATE TABLE IF NOT EXISTS public.post_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON public.post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON public.post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_post_images_post_id ON public.post_images(post_id);

-- ============================================
-- Functions
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for posts updated_at
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(
        regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'),
        '\s+', '-', 'g'
    ));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Posts policies
-- Public can view approved posts
CREATE POLICY "Public can view approved posts"
    ON public.posts FOR SELECT
    USING (status = 'approved');

-- Public can create posts (with pending status)
CREATE POLICY "Public can create pending posts"
    ON public.posts FOR INSERT
    WITH CHECK (status = 'pending');

-- Public can view their own posts (any status)
CREATE POLICY "Users can view their own posts"
    ON public.posts FOR SELECT
    USING (
        auth.uid() = author_id OR 
        (author_email IS NOT NULL AND author_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    );

-- Admins can view all posts
CREATE POLICY "Admins can view all posts"
    ON public.posts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update posts (approve/reject)
CREATE POLICY "Admins can update posts"
    ON public.posts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Tags policies
-- Public can view all tags
CREATE POLICY "Public can view tags"
    ON public.tags FOR SELECT
    USING (true);

-- Post tags policies
-- Public can view post tags for approved posts
CREATE POLICY "Public can view post tags for approved posts"
    ON public.post_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE id = post_tags.post_id AND status = 'approved'
        )
    );

-- Admins can view all post tags
CREATE POLICY "Admins can view all post tags"
    ON public.post_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Post images policies
-- Public can view images for approved posts
CREATE POLICY "Public can view images for approved posts"
    ON public.post_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE id = post_images.post_id AND status = 'approved'
        )
    );

-- Public can insert images for their own posts
CREATE POLICY "Public can insert images for pending posts"
    ON public.post_images FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE id = post_images.post_id AND status = 'pending'
        )
    );

-- Admins can view all post images
CREATE POLICY "Admins can view all post images"
    ON public.post_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- Storage Bucket Policies
-- ============================================

-- Note: Run these in Supabase Dashboard > Storage > Policies
-- Or via SQL in the Supabase SQL Editor

-- Create storage bucket if it doesn't exist (run in Supabase Dashboard)
-- Bucket name: post-images
-- Public: true (recommended for MVP - allows public viewing of approved images)
-- OR Public: false (private - requires signed URLs for viewing)

-- Storage policy: Public can upload to post-images bucket
-- This allows anonymous uploads for submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'post-images',
    'post-images',
    false,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public to upload images
CREATE POLICY "Public can upload images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'post-images' AND
        auth.role() = 'anon'
    );

-- Policy: Allow public to view images (for approved posts)
-- Note: This is handled via signed URLs in the application
CREATE POLICY "Public can view images"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'post-images'
    );

-- Policy: Allow users to delete their own uploads (before approval)
CREATE POLICY "Users can delete their own uploads"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'post-images' AND
        auth.role() = 'anon'
    );

-- ============================================
-- Initial Data (Optional)
-- ============================================

-- Insert some default tags
INSERT INTO public.tags (name) VALUES
    ('Shilin'),
    ('Night Market'),
    ('Community'),
    ('History'),
    ('Temple'),
    ('Religion'),
    ('Culture'),
    ('Urban Regeneration')
ON CONFLICT (name) DO NOTHING;

