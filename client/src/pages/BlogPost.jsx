import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
// import blogPosts from '@/data/blog_posts'; // Remove static import
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ArrowLeft, Share2, Loader2 } from 'lucide-react';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function BlogPost() {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            const { data } = await supabase
                .from('articles')
                .select('*')
                .eq('slug', slug)
                .single();

            if (data) setPost(data);
            setLoading(false);
        };
        fetchPost();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Memuat artikel...</p>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold mb-4">404 - Artikel Tidak Ditemukan</h1>
                <Button asChild><Link to="/">Kembali ke Beranda</Link></Button>
            </div>
        );
    }

    // Schema Markup for Article SEO
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt,
        "author": {
            "@type": "Person",
            "name": post.author
        },
        "datePublished": post.date,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://pembuatanpolygon.site/blog/${post.slug}`
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Helmet>
                <title>{post.title} | Blog LineSima</title>
                <meta name="description" content={post.excerpt} />
                <meta name="keywords" content={post.keywords} />
                <link rel="canonical" href={`https://pembuatanpolygon.site/blog/${post.slug}`} />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="article" />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.excerpt} />
                <meta property="og:url" content={`https://pembuatanpolygon.site/blog/${post.slug}`} />
                <meta property="og:site_name" content="LineSima" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={post.title} />
                <meta name="twitter:description" content={post.excerpt} />

                {/* Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify(schemaData)}
                </script>
            </Helmet>

            <nav className="border-b bg-background/95 sticky top-0 z-50 px-4 py-3">
                <div className="container mx-auto flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl">
                        <img src="/assets/logo.svg" alt="Logo" className="w-8 h-8" />
                        <span className="hidden sm:inline">LineSima Blog</span>
                    </Link>
                    <Button variant="ghost" size="sm" asChild>
                        <Link to="/" className="gap-2">
                            <ArrowLeft className="w-4 h-4" /> Kembali
                        </Link>
                    </Button>
                </div>
            </nav>

            <article className="container mx-auto px-4 py-12 max-w-3xl flex-1">
                <header className="mb-8">
                    <Badge variant="secondary" className="mb-4">Tutorial OSS & NIB</Badge>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm border-b pb-8">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(post.created_at || post.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>
                </header>

                <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                    <ReactMarkdown>
                        {post.content}
                    </ReactMarkdown>
                </div>

                <div className="mt-12 p-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-center border border-blue-100 dark:border-blue-800">
                    <h3 className="text-2xl font-bold mb-4">Butuh Token Polygon Cepat?</h3>
                    <p className="text-muted-foreground mb-6">
                        Jangan biarkan urusan peta menghambat izin usaha Anda. Generate file .SHP instan sekarang juga.
                    </p>
                    <Button size="lg" className="w-full sm:w-auto" asChild>
                        <Link to="/">Coba Generator Gratis</Link>
                    </Button>
                </div>
            </article>

            <Footer />
        </div>
    );
}
