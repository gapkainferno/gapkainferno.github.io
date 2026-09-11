/**
 * blog-app.js — English version for en/ folder
 * Dynamic blog system with filters, search and pagination
 */

class BlogApp {
    constructor() {
        this.currentCategory = 'all';
        this.currentPage = 1;
        this.postsPerPage = 12;
        this.searchQuery = '';
        
        this.init();
    }

    init() {
        this.renderFeaturedPost();
        this.renderPopularPosts();
        this.renderPosts();
        this.attachEventListeners();
    }

    renderFeaturedPost() {
        const featuredPost = blogPosts.find(post => post.featured);
        if (!featuredPost) return;

        const container = document.getElementById('featured-post');
        if (!container) return;

        container.innerHTML = `
            <div class="featured-post-content">
                <div class="featured-post-image">
                    <img src="${featuredPost.image}" alt="${featuredPost.title}">
                    <span class="featured-badge">⭐ Featured article</span>
                </div>
                <div class="featured-post-text">
                    <div class="featured-category">${featuredPost.categoryLabel}</div>
                    <h2>${featuredPost.title}</h2>
                    <div class="featured-meta">
                        <span>📅 ${this.formatDate(featuredPost.date)}</span>
                        <span>⏱️ ${featuredPost.readTime}</span>
                        <span>✍️ ${featuredPost.author}</span>
                    </div>
                    <p>${featuredPost.excerpt}</p>
                    <button class="read-more-btn" onclick="blogApp.openPost('${featuredPost.id}')">
                        Read more →
                    </button>
                </div>
            </div>
        `;
    }

    renderPopularPosts() {
        const container = document.getElementById('popular-posts');
        if (!container) return;

        const popular = blogPosts
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        container.innerHTML = popular.map(post => `
            <div class="popular-post-item" onclick="blogApp.openPost('${post.id}')">
                <div class="popular-post-thumb">
                    <img src="${post.image}" alt="${post.title}">
                </div>
                <div class="popular-post-info">
                    <h4>${post.title}</h4>
                    <p>${this.formatDate(post.date)} • ${post.readTime}</p>
                </div>
            </div>
        `).join('');
    }

    renderPosts() {
        const container = document.getElementById('blog-posts');
        if (!container) return;

        let filteredPosts = this.getFilteredPosts();
        
        const startIndex = (this.currentPage - 1) * this.postsPerPage;
        const endIndex = startIndex + this.postsPerPage;
        const postsToShow = filteredPosts.slice(startIndex, endIndex);

        if (postsToShow.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <h3>😕 Nothing found</h3>
                    <p>Try a different filter or search query</p>
                </div>
            `;
            this.updateLoadMoreButton(false);
            return;
        }

        container.innerHTML = postsToShow.map(post => this.createPostCard(post)).join('');
        
        const hasMore = endIndex < filteredPosts.length;
        this.updateLoadMoreButton(hasMore);
    }

    createPostCard(post) {
        return `
            <article class="blog-post-card" onclick="blogApp.openPost('${post.id}')">
                <div class="post-image">
                    <img src="${post.image}" alt="${post.title}">
                    <span class="post-category-badge">${post.categoryLabel}</span>
                </div>
                <div class="post-content">
                    <div class="post-meta">
                        <span>📅 ${this.formatDate(post.date)}</span>
                        <span>⏱️ ${post.readTime}</span>
                    </div>
                    <h3>${post.title}</h3>
                    <p class="post-excerpt">${post.excerpt}</p>
                    <a href="#" class="post-read-more" onclick="event.preventDefault()">
                        Read more →
                    </a>
                </div>
            </article>
        `;
    }

    getFilteredPosts() {
        let posts = [...blogPosts];

        if (this.currentCategory !== 'all') {
            posts = posts.filter(post => post.category === this.currentCategory);
        }

        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            posts = posts.filter(post => 
                post.title.toLowerCase().includes(query) ||
                post.excerpt.toLowerCase().includes(query) ||
                post.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        return posts;
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    openPost(postId) {
        window.location.href = `blog-article.html?id=${postId}`;
    }

    updateLoadMoreButton(hasMore) {
        const btn = document.getElementById('load-more');
        if (!btn) return;
        btn.style.display = hasMore ? 'block' : 'none';
    }

    attachEventListeners() {
        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.currentPage = 1;
                this.renderPosts();
            });
        });

        // Search
        const searchInput = document.getElementById('blog-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.currentPage = 1;
                this.renderPosts();
            });
        }

        // Load more
        const loadMoreBtn = document.getElementById('load-more');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.currentPage++;
                this.renderPosts();
            });
        }

        // Archive links
        document.querySelectorAll('.archive-list a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const month = link.dataset.month;
                this.searchQuery = month;
                this.currentPage = 1;
                this.renderPosts();
                
                window.scrollTo({
                    top: document.querySelector('.blog-posts-grid').offsetTop - 100,
                    behavior: 'smooth'
                });
            });
        });
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.blogApp = new BlogApp();
});