// ============================================
// Supabase Client Module
// ============================================

// Import Supabase JS library (CDN)
// Make sure to include this in your HTML: 
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let supabaseClient = null;

function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded. Make sure to include the Supabase CDN script.');
        return null;
    }
    
    if (!CONFIG || !CONFIG.supabase || !CONFIG.supabase.url || !CONFIG.supabase.anonKey) {
        console.error('Supabase configuration not found. Please check config.js');
        return null;
    }
    
    if (CONFIG.supabase.url === 'YOUR_SUPABASE_URL' || CONFIG.supabase.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
        console.error('Please configure your Supabase credentials in config.js');
        return null;
    }
    
    try {
        supabaseClient = supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
        return supabaseClient;
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        return null;
    }
}

function getSupabaseClient() {
    if (!supabaseClient) {
        supabaseClient = initSupabase();
    }
    return supabaseClient;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initSupabase, getSupabaseClient };
}

