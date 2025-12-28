// ============================================
// Story Submission Handler
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('story-submit-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

async function handleSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    const errorMsg = document.getElementById('error-message');
    const successMsg = document.getElementById('success-message');
    
    // Hide previous messages
    if (errorMsg) errorMsg.style.display = 'none';
    if (successMsg) successMsg.style.display = 'none';
    
    // Validate form
    const formData = new FormData(e.target);
    const title = formData.get('title');
    const content = formData.get('content');
    const projectDistrict = formData.get('project_district') || 'Shilin';
    const tags = formData.get('tags');
    const authorName = formData.get('author_name');
    const authorEmail = formData.get('author_email');
    const rightsCheckbox = formData.get('rights_owned');
    const photos = formData.getAll('photos');
    
    // Validation
    if (!title || !content) {
        showError('Title and story content are required.');
        return;
    }
    
    if (!rightsCheckbox) {
        showError('You must confirm that you own the rights to the content you upload.');
        return;
    }
    
    // Disable submit button
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase client not initialized. Please check your configuration.');
        }
        
        // Generate slug from title
        const slug = generateSlug(title);
        
        // Upload photos first
        const uploadedImageUrls = [];
        if (photos && photos.length > 0) {
            for (let i = 0; i < photos.length; i++) {
                const photo = photos[i];
                if (photo.size > 0) {
                    const imageUrl = await uploadImage(photo, slug, i);
                    if (imageUrl) {
                        uploadedImageUrls.push(imageUrl);
                    }
                }
            }
        }
        
        // Parse tags
        const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
        
        // Create content blocks from textarea
        const contentBlocks = content.split('\n\n').map(paragraph => ({
            type: 'paragraph',
            text: paragraph.trim()
        })).filter(block => block.text.length > 0);
        
        // Set cover image (first uploaded image or null)
        const coverImageUrl = uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : null;
        
        // Create post
        const { data: post, error: postError } = await supabase
            .from('posts')
            .insert({
                title: title,
                content: contentBlocks,
                status: 'pending',
                slug: slug,
                project_district: projectDistrict,
                cover_image_url: coverImageUrl,
                author_name: authorName || null,
                author_email: authorEmail || null
            })
            .select()
            .single();
        
        if (postError) {
            throw postError;
        }
        
        // Insert tags and create relationships
        if (tagArray.length > 0) {
            await insertTagsAndRelations(post.id, tagArray);
        }
        
        // Insert post images
        if (uploadedImageUrls.length > 0) {
            await insertPostImages(post.id, uploadedImageUrls);
        }
        
        // Show success message
        showSuccess('Your story has been submitted successfully! It will be reviewed before publishing.');
        
        // Reset form
        e.target.reset();
        
    } catch (error) {
        console.error('Submission error:', error);
        showError(error.message || 'An error occurred while submitting your story. Please try again.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Story';
        }
    }
}

async function uploadImage(file, slug, index) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return null;
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${slug}-${Date.now()}-${index}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { data, error } = await supabase.storage
            .from('post-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) {
            console.error('Image upload error:', error);
            return null;
        }
        
        // Get public URL
        // Note: If bucket is private, you may need to use signed URLs
        // For MVP, consider making the bucket public for reading
        const { data: urlData } = supabase.storage
            .from('post-images')
            .getPublicUrl(filePath);
        
        return urlData.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
}

async function insertTagsAndRelations(postId, tagNames) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    
    // Get or create tags
    for (const tagName of tagNames) {
        // Try to get existing tag
        let { data: tag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName)
            .single();
        
        // Create tag if it doesn't exist
        if (!tag) {
            const { data: newTag, error } = await supabase
                .from('tags')
                .insert({ name: tagName })
                .select()
                .single();
            
            if (error) {
                console.error('Error creating tag:', error);
                continue;
            }
            tag = newTag;
        }
        
        // Create post_tag relationship
        await supabase
            .from('post_tags')
            .insert({
                post_id: postId,
                tag_id: tag.id
            });
    }
}

async function insertPostImages(postId, imageUrls) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    
    const imageRecords = imageUrls.map((url, index) => ({
        post_id: postId,
        image_url: url,
        storage_path: url.split('/').pop(),
        display_order: index
    }));
    
    await supabase
        .from('post_images')
        .insert(imageRecords);
}

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function showError(message) {
    const errorMsg = document.getElementById('error-message');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        alert('Error: ' + message);
    }
}

function showSuccess(message) {
    const successMsg = document.getElementById('success-message');
    if (successMsg) {
        successMsg.textContent = message;
        successMsg.style.display = 'block';
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        alert(message);
    }
}

