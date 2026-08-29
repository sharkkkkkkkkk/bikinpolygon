import Dexie from 'dexie';

export const db = new Dexie('AeoDatabase');

db.version(2).stores({
    draft_aeo: '++id, keyword, metaTitle, metaDescription, faqSchema, status',
    blog_keyword_queue: '++id, keyword, status',
    draft_blogs: '++id, title, slug, excerpt, author, keywords, content, status'
});
