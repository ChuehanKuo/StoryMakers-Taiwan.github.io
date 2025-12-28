// ============================================
// Story Detail Page - Render Single Story
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadStory();
});

async function loadStory() {
    try {
        // Get story ID from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const storyId = urlParams.get('id');
        
        if (!storyId) {
            showError('No story ID provided.');
            return;
        }
        
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase client not initialized. Please check your configuration.');
        }
        
        // Fetch story with tags and images
        const { data: story, error } = await supabase
            .from('posts')
            .select(`
                *,
                post_tags (
                    tags (
                        name
                    )
                ),
                post_images (
                    image_url,
                    caption,
                    display_order
                )
            `)
            .eq('id', storyId)
            .eq('status', 'approved')
            .single();
        
        if (error) {
            throw error;
        }
        
        if (!story) {
            showError('Story not found or not available.');
            return;
        }
        
        renderStory(story);
        addArticleSchema(story);
    } catch (error) {
        console.error('Error loading story:', error);
        showError('Unable to load story. Please try again later.');
    }
}

function renderStory(story) {
    const root = document.getElementById('story-root');
    if (!root) return;
    
    const formattedDate = formatDate(story.published_at || story.created_at);
    const tags = story.post_tags ? story.post_tags.map(pt => pt.tags.name) : [];
    const tagsHtml = tags.map(tag => `<span class="story-tag">${escapeHtml(tag)}</span>`).join('');
    const contentHtml = renderContent(story.content, story.post_images);
    const coverImageStyle = story.cover_image_url 
        ? `background-image: url('${escapeHtml(story.cover_image_url)}');`
        : '';
    
    root.innerHTML = `
        <article class="story-detail">
            <header class="story-header">
                <div class="story-meta">
                    <span class="story-date">${formattedDate}</span>
                    <div class="story-tags">${tagsHtml}</div>
                </div>
                <h1 class="story-title-main">${escapeHtml(story.title)}</h1>
                ${story.title_zh ? `<h2 class="story-title-main-zh">${escapeHtml(story.title_zh)}</h2>` : ''}
            </header>
            
            ${story.cover_image_url ? `<div class="story-cover-large" style="${coverImageStyle}"></div>` : ''}
            
            <div class="story-content">
                ${contentHtml}
            </div>
        </article>
    `;
}

function renderContent(content, images) {
    if (!content || !Array.isArray(content)) return '';
    
    // Sort images by display_order
    const sortedImages = images ? [...images].sort((a, b) => a.display_order - b.display_order) : [];
    let imageIndex = 0;
    
    return content.map(block => {
        switch (block.type) {
            case 'paragraph':
                return `<p>${escapeHtml(block.text)}</p>`;
            case 'heading':
                const level = block.level || 2;
                return `<h${level}>${escapeHtml(block.text)}</h${level}>`;
            case 'image':
                // Use image from post_images if available, otherwise use block.src
                if (imageIndex < sortedImages.length) {
                    const img = sortedImages[imageIndex++];
                    return `<img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(img.caption || '')}" class="story-content-image" />${img.caption ? `<p class="story-image-caption">${escapeHtml(img.caption)}</p>` : ''}`;
                } else if (block.src) {
                    return `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || '')}" class="story-content-image" />`;
                }
                return '';
            default:
                return '';
        }
    }).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addArticleSchema(story) {
    // Remove existing schema if any
    const existingSchema = document.querySelector('script#article-schema');
    if (existingSchema) {
        existingSchema.remove();
    }
    
    // Extract description from content
    let description = story.excerpt || '';
    if (!description && story.content && Array.isArray(story.content)) {
        const firstParagraph = story.content.find(block => block.type === 'paragraph');
        if (firstParagraph && firstParagraph.text) {
            description = firstParagraph.text.substring(0, 200);
        }
    }
    
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": story.title,
        "description": description,
        "image": story.cover_image_url ? story.cover_image_url : "https://storymakers.tw/assets/images/og-image.jpg",
        "datePublished": story.published_at || story.created_at,
        "dateModified": story.updated_at || story.published_at || story.created_at,
        "author": {
            "@type": "Organization",
            "name": "StoryMakers Taiwan",
            "alternateName": "故事造城"
        },
        "publisher": {
            "@type": "Organization",
            "name": "StoryMakers Taiwan",
            "alternateName": "故事造城",
            "logo": {
                "@type": "ImageObject",
                "url": "https://storymakers.tw/assets/images/logo.png"
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://storymakers.tw/story.html?id=${story.id}`
        }
    };
    
    if (story.title_zh) {
        articleSchema.alternativeHeadline = story.title_zh;
    }
    
    // Add tags as keywords
    if (story.post_tags && story.post_tags.length > 0) {
        articleSchema.keywords = story.post_tags.map(pt => pt.tags.name).join(', ');
    }
    
    // Create and inject schema script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'article-schema';
    script.textContent = JSON.stringify(articleSchema);
    document.head.appendChild(script);
    
    // Update page title and meta tags
    if (story.title) {
        document.title = `${story.title} | StoryMakers Taiwan | 故事造城`;
    }
    
    // Update Open Graph meta tags
    updateMetaTag('og:title', story.title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:url', `https://storymakers.tw/story.html?id=${story.id}`);
    if (story.cover_image_url) {
        updateMetaTag('og:image', story.cover_image_url);
    }
    
    // Update Twitter meta tags
    updateMetaTag('twitter:title', story.title);
    updateMetaTag('twitter:description', description);
    if (story.cover_image_url) {
        updateMetaTag('twitter:image', story.cover_image_url);
    }
    
    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
    }
    canonical.href = `https://storymakers.tw/story.html?id=${story.id}`;
}

function updateMetaTag(property, content) {
    if (!content) return;
    let meta = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
}

function showError(message) {
    const root = document.getElementById('story-root');
    if (root) {
        root.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-xl);">
                <p style="color: var(--color-text-light); margin-bottom: var(--spacing-md);">${escapeHtml(message)}</p>
                <a href="projects.html#stories-section" class="btn btn-primary">Back to Stories</a>
            </div>
        `;
    }
}

