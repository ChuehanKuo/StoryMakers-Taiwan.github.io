// ============================================
// Stories Listing Page - Render Story Cards
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadStories();
});

async function loadStories() {
    const grid = document.getElementById('stories-grid');
    if (!grid) {
        console.warn('stories-grid element not found. Make sure the HTML includes <div id="stories-grid"></div> inside the stories section.');
        return;
    }
    
    // Ensure the stories section is visible
    const storiesSection = document.getElementById('stories-section');
    if (storiesSection) {
        storiesSection.style.display = '';
        storiesSection.style.visibility = 'visible';
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            grid.innerHTML = '<p style="text-align: center; color: var(--color-text-light);">Stories feature requires configuration. Please check your Supabase setup.</p>';
            return;
        }
        
        // Fetch approved posts with tags
        const { data: posts, error } = await supabase
            .from('posts')
            .select(`
                *,
                post_tags (
                    tags (
                        name
                    )
                )
            `)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        if (!posts || posts.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: var(--color-text-light);">No stories available at this time.</p>';
            return;
        }
        
        // Format posts data
        const formattedPosts = posts.map(post => ({
            id: post.id,
            slug: post.slug,
            title: post.title,
            titleZh: post.title_zh,
            excerpt: post.excerpt || extractExcerpt(post.content),
            excerptZh: post.excerpt_zh,
            date: post.published_at || post.created_at,
            coverImage: post.cover_image_url || '',
            tags: post.post_tags ? post.post_tags.map(pt => pt.tags.name) : []
        }));
        
        renderStories(formattedPosts);
    } catch (error) {
        console.error('Error loading stories:', error);
        grid.innerHTML = '<p style="text-align: center; color: var(--color-text-light);">Unable to load stories. Please try again later.</p>';
    }
}

function extractExcerpt(content) {
    if (!content || !Array.isArray(content)) return '';
    const firstParagraph = content.find(block => block.type === 'paragraph');
    if (firstParagraph && firstParagraph.text) {
        return firstParagraph.text.substring(0, 150) + (firstParagraph.text.length > 150 ? '...' : '');
    }
    return '';
}

function renderStories(posts) {
    const grid = document.getElementById('stories-grid');
    if (!grid) return;
    
    grid.innerHTML = posts.map(post => createStoryCard(post)).join('');
}

function createStoryCard(post) {
    const formattedDate = formatDate(post.date);
    const tagsHtml = post.tags.map(tag => `<span class="story-tag">${escapeHtml(tag)}</span>`).join('');
    const coverImageStyle = post.coverImage 
        ? `background-image: url('${escapeHtml(post.coverImage)}');`
        : '';
    
    return `
        <div class="card story-card fade-in">
            <div class="story-cover" style="${coverImageStyle}"></div>
            <div class="story-card-content">
                <div class="story-meta">
                    <span class="story-date">${formattedDate}</span>
                    <div class="story-tags">${tagsHtml}</div>
                </div>
                <h3 class="story-title">${escapeHtml(post.title)}</h3>
                ${post.titleZh ? `<h4 class="story-title-zh">${escapeHtml(post.titleZh)}</h4>` : ''}
                <p class="story-excerpt">${escapeHtml(post.excerpt)}</p>
                ${post.excerptZh ? `<p class="story-excerpt-zh">${escapeHtml(post.excerptZh)}</p>` : ''}
                <a href="story.html?id=${post.id}" class="btn btn-primary" style="margin-top: var(--spacing-sm);">Read Story</a>
            </div>
        </div>
    `;
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

