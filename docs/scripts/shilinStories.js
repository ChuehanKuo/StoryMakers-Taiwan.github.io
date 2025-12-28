// ============================================
// Shilin Page - Load Featured Stories
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadShilinStories();
});

async function loadShilinStories() {
    const container = document.getElementById('shilin-featured-stories');
    if (!container) return;
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            // Fallback: show message if Supabase not configured
            container.innerHTML = '<p style="text-align: center; color: var(--color-text-light);">Stories coming soon.</p>';
            return;
        }
        
        // Fetch approved posts filtered by Shilin district
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
            .ilike('project_district', '%Shilin%')
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (error) {
            throw error;
        }
        
        if (!posts || posts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--color-text-light);">No Shilin stories available yet. <a href="submit.html">Submit a story</a> to get started!</p>';
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
        
        renderShilinStories(formattedPosts);
    } catch (error) {
        console.error('Error loading Shilin stories:', error);
        container.innerHTML = '<p style="text-align: center; color: var(--color-text-light);">Unable to load stories. Please try again later.</p>';
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

function renderShilinStories(posts) {
    const container = document.getElementById('shilin-featured-stories');
    if (!container) return;
    
    container.innerHTML = posts.map(post => createStoryCard(post)).join('');
}

function createStoryCard(post) {
    const formattedDate = formatDate(post.date);
    const tagsHtml = post.tags.slice(0, 3).map(tag => `<span class="story-tag">${escapeHtml(tag)}</span>`).join('');
    const coverImageStyle = post.coverImage 
        ? `background-image: url('${escapeHtml(post.coverImage)}');`
        : '';
    const storyLink = `story.html?id=${post.id}`;
    
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
                <a href="${storyLink}" class="btn btn-primary" style="margin-top: var(--spacing-sm);">Read Story</a>
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
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

