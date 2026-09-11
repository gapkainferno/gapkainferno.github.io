/**
 * blog-article-app.js — English version for en/ folder
 * JavaScript for displaying individual blog articles
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    onValue, 
    runTransaction 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

import { FIREBASE_CONFIG } from '../config/firebase-config.js';

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);

class ArticleApp {
    constructor() {
        this.currentPost = null;
        this.init();
    }

    init() {
        this.loadArticle();
    }

    loadArticle() {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');

        if (!postId) {
            this.showError('Article not found');
            return;
        }

        this.currentPost = blogPosts.find(post => post.id === postId);

        if (!this.currentPost) {
            this.showError('Article not found');
            return;
        }

        this.renderArticle();
        this.updateMetaTags();
        this.renderRelatedPosts();
        this.setupNavigation();
        this.setupViewCounter();
    }

    renderArticle() {
        const post = this.currentPost;

        document.getElementById('article-header').innerHTML = `
            <p class="article-meta">
                ${this.formatDate(post.date)} • ${post.categoryLabel} • ${post.readTime}
            </p>
            <h1>${post.title}</h1>
            <p style="font-style: italic; font-size: 1.2rem; margin-top: 20px; color: var(--text-muted);">
                ${post.excerpt}
            </p>
            <div style="margin-top: 20px; font-size: 0.9rem; color: rgba(255,255,255,0.6);">
                ✍️ Author: ${post.author}
            </div>
        `;

        document.getElementById('article-main').innerHTML = `
            <div class="article-cut">
                ${post.content || ''}
            </div>
        `;

        const tagsContainer = document.getElementById('article-tags');
        if (tagsContainer && post.tags) {
            tagsContainer.innerHTML = `
                <h4>🏷️ Tags:</h4>
                <div class="tags-list">
                    ${post.tags.map(tag => `
                        <a href="blog.html?search=${encodeURIComponent(tag)}" class="tag-link">
                            #${tag}
                        </a>
                    `).join('')}
                </div>
            `;
        }

        const categoryEl = document.getElementById('breadcrumb-category');
        if (categoryEl) {
            categoryEl.textContent = post.categoryLabel;
        }
    }

    updateMetaTags() {
        const post = this.currentPost;
        if (!post) return;

        const setMeta = (id, content) => {
            const el = document.getElementById(id);
            if (el) el.textContent = content;
        };

        const title = `${post.title} — INFERNO Notes | Gapka Homestead`;
        setMeta('article-title', title);
        document.title = title;

        setMeta('article-description', post.excerpt);
        setMeta('og-title', title);
        setMeta('og-description', post.excerpt);
        setMeta('twitter-title', title);
        setMeta('twitter-url', window.location.href);
        setMeta('og-url', window.location.href);
        setMeta('article-canonical', window.location.href);
        setMeta('article-published', post.date);
        setMeta('article-section', post.categoryLabel);
        document.getElementById('article-modified')?.setAttribute('content', new Date().toISOString());
    }

    renderRelatedPosts() {
        const container = document.getElementById('related-posts');
        if (!container) return;

        const related = blogPosts
            .filter(p => p.id !== this.currentPost.id && p.category === this.currentPost.category)
            .slice(0, 3);

        if (related.length === 0) {
            const fallback = blogPosts
                .filter(p => p.id !== this.currentPost.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3);

            container.innerHTML = fallback.map(post => `
                <a href="blog-article.html?id=${post.id}" class="related-card">
                    <div class="related-image">
                        <img src="${post.image}" alt="${post.title}">
                    </div>
                    <div class="related-info">
                        <span class="related-category">${post.categoryLabel}</span>
                        <h4>${post.title}</h4>
                        <p>${post.excerpt.substring(0, 100)}...</p>
                        <div class="related-meta">
                            📅 ${this.formatDate(post.date)} • ⏱️ ${post.readTime}
                        </div>
                    </div>
                </a>
            `).join('');
            return;
        }

        container.innerHTML = related.map(post => `
            <a href="blog-article.html?id=${post.id}" class="related-card">
                <div class="related-image">
                    <img src="${post.image}" alt="${post.title}">
                </div>
                <div class="related-info">
                    <span class="related-category">${post.categoryLabel}</span>
                    <h4>${post.title}</h4>
                    <p>${post.excerpt.substring(0, 100)}...</p>
                    <div class="related-meta">
                        📅 ${this.formatDate(post.date)} • ⏱️ ${post.readTime}
                    </div>
                </div>
            </a>
        `).join('');
    }

    setupNavigation() {
        const currentIndex = blogPosts.findIndex(p => p.id === this.currentPost.id);

        const prevBtn = document.getElementById('prev-article');
        const nextBtn = document.getElementById('next-article');

        if (prevBtn && currentIndex > 0) {
            const prev = blogPosts[currentIndex - 1];
            prevBtn.onclick = () => window.location.href = `blog-article.html?id=${prev.id}`;
            prevBtn.disabled = false;
        } else if (prevBtn) {
            prevBtn.disabled = true;
        }

        if (nextBtn && currentIndex < blogPosts.length - 1) {
            const next = blogPosts[currentIndex + 1];
            nextBtn.onclick = () => window.location.href = `blog-article.html?id=${next.id}`;
            nextBtn.disabled = false;
        } else if (nextBtn) {
            nextBtn.disabled = true;
        }
    }

    setupViewCounter() {
        if (!this.currentPost || !db) return;

        try {
            const viewsRef = ref(db, 'blog-views/' + this.currentPost.id);

            onValue(viewsRef, (snapshot) => {
                const views = snapshot.val() || 0;
                const viewsEl = document.getElementById('article-views');
                if (viewsEl) {
                    viewsEl.textContent = `👁️ ${views} views`;
                }
            }, (error) => {
                console.warn('Views read blocked:', error?.message || error);
            });

            runTransaction(viewsRef, (currentViews) => {
                return (currentViews || 0) + 1;
            }).catch((error) => {
                console.warn('Views write blocked:', error?.message || error);
            });
        } catch (error) {
            console.warn('View counter setup failed:', error?.message || error);
        }
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    showError(message) {
        const main = document.getElementById('article-main');
        if (main) {
            main.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 50px;">
                    <h2>😕 ${message}</h2>
                    <p>The article may have been removed or the link may be incorrect.</p>
                    <a href="blog.html" class="add-btn" style="display: inline-block; margin-top: 20px;">
                        ← Back to blog
                    </a>
                </div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ArticleApp();
});