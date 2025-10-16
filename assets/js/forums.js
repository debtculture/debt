// =================================================================================
// --- INITIALIZATION ---
// =================================================================================
const supabaseUrl = 'https://pvbguojrkigzvnuwjawy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Ymd1b2pya2lnenZudXdqYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjMwMjIsImV4cCI6MjA3NDk5OTAyMn0.DeUDUPCyPfUifEqRmj6f85qXthbW3rF1qPjNhdRqVlw';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

// =================================================================================
// --- MAIN LOGIC ---
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
    loadForumPosts();
    checkLoginStatus();
});

function checkLoginStatus() {
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
        document.getElementById('create-post-btn').style.display = 'block';
    }
}

async function loadForumPosts() {
    try {
        const { data: posts, error } = await supabaseClient
            .from('posts')
            .select(`
                *,
                author:profiles(username, wallet_address),
                comments(count)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderPosts(posts);

    } catch (error) {
        console.error('Error fetching forum posts:', error);
        document.getElementById('post-list').innerHTML = '<p style="color: #ff5555; padding: 40px; text-align: center;">Error loading posts.</p>';
    }
}

function renderPosts(posts) {
    const postList = document.getElementById('post-list');
    if (posts.length === 0) {
        postList.innerHTML = '<p style="padding: 40px; text-align: center; color: #888;">No posts have been created yet.</p>';
        return;
    }

    const postHtml = posts.map(post => {
        const lastActivity = new Date(post.created_at).toLocaleString();
        const replyCount = post.comments[0]?.count || 0;
        const authorUsername = post.author?.username || 'Unknown';
        const authorWallet = post.author?.wallet_address || '#';

        return `
            <div class="post-row">
                <div class="post-title">
                    <a href="post.html?id=${post.id}">${escapeHTML(post.title)}</a>
                </div>
                <div class="post-author">
                    <a href="profile.html?user=${authorWallet}">${authorUsername}</a>
                </div>
                <div class="post-replies">${replyCount}</div>
                <div class="post-activity">${lastActivity}</div>
            </div>
        `;
    }).join('');

    postList.innerHTML = postHtml;
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// --- Mobile Menu Toggle Functions ---
    window.toggleMenu = function() {
        const menu = document.getElementById("mobileMenu");
        const hamburger = document.querySelector(".hamburger");
        const isOpen = menu.style.display === "block";
        menu.style.display = isOpen ? "none" : "block";
        hamburger.classList.toggle("active", !isOpen);
    }

    window.closeMenu = function() {
        const menu = document.getElementById("mobileMenu");
        const hamburger = document.querySelector(".hamburger");
        menu.style.display = "none";
        hamburger.classList.remove("active");
    }
