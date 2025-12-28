// ============================================
// Admin Panel - Story Moderation
// ============================================

let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

async function checkAuth() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Supabase client not initialized.');
            showLogin();
            return;
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            // Check if user is admin
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();
            
            if (profile && profile.role === 'admin') {
                currentUser = session.user;
                showAdminPanel();
                loadPendingPosts();
            } else {
                showError('Access denied. Admin privileges required.');
                showLogin();
            }
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showError('Error checking authentication.');
        showLogin();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase client not initialized.');
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
        
        if (profile && profile.role === 'admin') {
            currentUser = data.user;
            showAdminPanel();
            loadPendingPosts();
        } else {
            await supabase.auth.signOut();
            if (errorDiv) {
                errorDiv.textContent = 'Access denied. Admin privileges required.';
                errorDiv.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        if (errorDiv) {
            errorDiv.textContent = error.message || 'Login failed. Please try again.';
            errorDiv.style.display = 'block';
        }
    }
}

async function handleLogout() {
    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.auth.signOut();
        }
        currentUser = null;
        showLogin();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function showLogin() {
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('admin-panel').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
}

async function loadPendingPosts() {
    const container = document.getElementById('pending-posts');
    if (!container) return;
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase client not initialized.');
        }
        
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
            .in('status', ['pending', 'approved', 'rejected'])
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!posts || posts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--color-text-light);">No submissions to review.</p>';
            return;
        }
        
        container.innerHTML = posts.map(post => createPostItem(post)).join('');
        
        // Attach event listeners
        posts.forEach(post => {
            const approveBtn = document.getElementById(`approve-${post.id}`);
            const rejectBtn = document.getElementById(`reject-${post.id}`);
            if (approveBtn) {
                approveBtn.addEventListener('click', () => updatePostStatus(post.id, 'approved'));
            }
            if (rejectBtn) {
                rejectBtn.addEventListener('click', () => updatePostStatus(post.id, 'rejected'));
            }
        });
        
    } catch (error) {
        console.error('Error loading posts:', error);
        container.innerHTML = '<p style="text-align: center; color: #d32f2f;">Error loading submissions. Please refresh the page.</p>';
    }
}

function createPostItem(post) {
    const tags = post.post_tags ? post.post_tags.map(pt => pt.tags.name).join(', ') : 'No tags';
    const statusClass = post.status === 'approved' ? 'approved' : post.status === 'rejected' ? 'rejected' : '';
    const statusBadge = `<span class="status-badge status-${post.status}">${post.status.toUpperCase()}</span>`;
    const excerpt = post.excerpt || (post.content && Array.isArray(post.content) ? post.content[0]?.text?.substring(0, 150) : 'No excerpt');
    
    return `
        <div class="post-item ${statusClass}">
            <div class="post-meta">
                ${statusBadge}
                <span>Submitted: ${formatDate(post.created_at)}</span>
                ${post.author_name ? `<span>Author: ${escapeHtml(post.author_name)}</span>` : ''}
                ${post.author_email ? `<span>Email: ${escapeHtml(post.author_email)}</span>` : ''}
            </div>
            <h3>${escapeHtml(post.title)}</h3>
            ${post.title_zh ? `<h4 style="color: var(--color-text-light); font-weight: 400;">${escapeHtml(post.title_zh)}</h4>` : ''}
            <p style="color: var(--color-text-light); margin: var(--spacing-sm) 0;">${escapeHtml(excerpt)}...</p>
            <p style="font-size: 0.9rem; color: var(--color-text-light);"><strong>Tags:</strong> ${escapeHtml(tags)}</p>
            <p style="font-size: 0.9rem; color: var(--color-text-light);"><strong>District:</strong> ${escapeHtml(post.project_district || 'N/A')}</p>
            <div class="post-actions">
                ${post.status !== 'approved' ? `<button id="approve-${post.id}" class="btn btn-primary">Approve</button>` : ''}
                ${post.status !== 'rejected' ? `<button id="reject-${post.id}" class="btn btn-secondary">Reject</button>` : ''}
                <a href="story.html?id=${post.id}" class="btn btn-outline" target="_blank">View Full Story</a>
            </div>
        </div>
    `;
}

async function updatePostStatus(postId, status) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase client not initialized.');
        }
        
        const updateData = {
            status: status,
            updated_at: new Date().toISOString()
        };
        
        if (status === 'approved') {
            updateData.published_at = new Date().toISOString();
        }
        
        const { error } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', postId);
        
        if (error) throw error;
        
        showSuccess(`Post ${status} successfully.`);
        loadPendingPosts();
    } catch (error) {
        console.error('Error updating post status:', error);
        showError(`Error ${status === 'approved' ? 'approving' : 'rejecting'} post: ${error.message}`);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    const errorMsg = document.getElementById('error-message');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        setTimeout(() => {
            errorMsg.style.display = 'none';
        }, 5000);
    }
}

function showSuccess(message) {
    const successMsg = document.getElementById('success-message');
    if (successMsg) {
        successMsg.textContent = message;
        successMsg.style.display = 'block';
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 5000);
    }
}

