import React, { useState, useEffect } from 'react';
import { db } from '../db';
import api from '../lib/api';
import { Loader2, RefreshCw, UploadCloud, Save, Trash2, PenTool, MessageSquare, Plus, ChevronRight, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';

export default function AeoManager() {
    const { user } = useAuth();
    
    // Global State
    const [activeMode, setActiveMode] = useState('aeo'); // 'aeo' | 'blog'
    const [provider, setProvider] = useState('gemini');
    const [message, setMessage] = useState('');

    // AEO State
    const [aeoKeyword, setAeoKeyword] = useState('');
    const [isGeneratingAeo, setIsGeneratingAeo] = useState(false);
    const [generatedAeo, setGeneratedAeo] = useState(null);
    const [aeoDrafts, setAeoDrafts] = useState([]);
    const [isSyncingAeo, setIsSyncingAeo] = useState(false);

    // Blog State
    const [blogKeywordInput, setBlogKeywordInput] = useState('');
    const [blogQueue, setBlogQueue] = useState([]);
    const [blogDrafts, setBlogDrafts] = useState([]);
    const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
    const [generatingBlogTarget, setGeneratingBlogTarget] = useState('');
    const [previewBlog, setPreviewBlog] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const allAeoDrafts = await db.draft_aeo.toArray();
        setAeoDrafts(allAeoDrafts);

        const allBlogQueue = await db.blog_keyword_queue.toArray();
        setBlogQueue(allBlogQueue);

        const allBlogDrafts = await db.draft_blogs.toArray();
        setBlogDrafts(allBlogDrafts);
    };

    // --- AEO LOGIC ---
    const handleGenerateAeo = async (e) => {
        e.preventDefault();
        if (!aeoKeyword.trim()) return;

        setIsGeneratingAeo(true);
        setMessage('');
        setGeneratedAeo(null);

        try {
            const response = await api.post('/kelola/generate-aeo', { keyword: aeoKeyword, provider });
            const data = response.data;
            
            setGeneratedAeo({
                keyword: aeoKeyword,
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                faqSchema: data.faqSchema,
                status: 'draft'
            });
        } catch (error) {
            const errMsg = error.response?.data?.error || error.message || 'Gagal menghubungi AI Server';
            setMessage('Error AEO: ' + errMsg);
        } finally {
            setIsGeneratingAeo(false);
        }
    };

    const handleSaveAeoDraft = async () => {
        if (!generatedAeo) return;
        try {
            await db.draft_aeo.add(generatedAeo);
            setMessage('AEO tersimpan di penyimpanan lokal (Offline)');
            setGeneratedAeo(null);
            setAeoKeyword('');
            loadData();
        } catch (error) {
            setMessage('Gagal menyimpan draft AEO');
        }
    };

    const handlePublishAllAeo = async () => {
        if (aeoDrafts.length === 0) return;
        setIsSyncingAeo(true);
        setMessage('Sedang sinkronisasi AEO ke server...');

        try {
            let successCount = 0;
            for (const draft of aeoDrafts) {
                const payload = {
                    target_problem: draft.metaTitle,
                    solution_text: JSON.stringify({
                        metaDescription: draft.metaDescription,
                        faqSchema: draft.faqSchema
                    }),
                    schema_type: 'JSON-LD'
                };
                try {
                    await api.post('/aeo', payload);
                    await db.draft_aeo.delete(draft.id);
                    successCount++;
                } catch (err) {
                    console.error("Failed syncing AEO draft", draft.id, err);
                }
            }
            setMessage(`Berhasil mempublikasikan ${successCount} AEO ke server utama.`);
            loadData();
        } catch (error) {
            setMessage('Gagal mempublikasikan AEO: ' + error.message);
        } finally {
            setIsSyncingAeo(false);
        }
    };

    const handleDeleteAeoDraft = async (id) => {
        await db.draft_aeo.delete(id);
        loadData();
    };


    // --- BLOG LOGIC ---
    const handleAddBlogQueue = async (e) => {
        e.preventDefault();
        if (!blogKeywordInput.trim()) return;
        
        try {
            await db.blog_keyword_queue.add({ keyword: blogKeywordInput.trim(), status: 'pending' });
            setBlogKeywordInput('');
            setMessage('Keyword blog ditambahkan ke antrean.');
            loadData();
        } catch (error) {
            setMessage('Gagal menambah antrean');
        }
    };

    const handleDeleteBlogQueue = async (id) => {
        await db.blog_keyword_queue.delete(id);
        loadData();
    };

    const handleGenerateNextBlog = async () => {
        if (blogQueue.length === 0) return;
        
        const target = blogQueue[0];
        setIsGeneratingBlog(true);
        setGeneratingBlogTarget(target.keyword);
        setMessage('');

        try {
            const response = await api.post('/kelola/generate-blog', { keyword: target.keyword, provider });
            const data = response.data;
            
            const newBlog = {
                title: data.title,
                slug: data.slug,
                excerpt: data.excerpt,
                author: data.author || 'Admin',
                keywords: data.keywords,
                content: data.content,
                status: 'draft'
            };

            await db.draft_blogs.add(newBlog);
            await db.blog_keyword_queue.delete(target.id);
            setMessage(`Sukses membuat artikel: ${data.title}`);
            loadData();
        } catch (error) {
            const errMsg = error.response?.data?.error || error.message || 'Gagal menghubungi AI Server';
            setMessage('Error Blog: ' + errMsg);
        } finally {
            setIsGeneratingBlog(false);
            setGeneratingBlogTarget('');
        }
    };

    const handleDeleteBlogDraft = async (id) => {
        await db.draft_blogs.delete(id);
        if (previewBlog?.id === id) setPreviewBlog(null);
        loadData();
    };


    return (
        <div className="w-full flex flex-col bg-slate-50 min-h-screen text-slate-900 pb-20">
            {/* Header & Tabs */}
            <div className="w-full bg-slate-900 text-white p-4 shadow-md flex flex-col items-center gap-4">
                <div className="text-center w-full">
                    <h1 className="font-black text-xl tracking-wider text-amber-400 uppercase">Automated AI Studio</h1>
                    <p className="text-xs opacity-70 mt-1">Offline-first SEO & Content Generation</p>
                </div>
                
                <div className="flex w-full bg-slate-800 rounded-lg p-1">
                    <button 
                        onClick={() => setActiveMode('aeo')}
                        className={`flex-1 py-3 text-sm font-bold rounded-md flex justify-center items-center gap-2 transition-all ${activeMode === 'aeo' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <MessageSquare className="w-4 h-4" /> Mode AEO
                    </button>
                    <button 
                        onClick={() => setActiveMode('blog')}
                        className={`flex-1 py-3 text-sm font-bold rounded-md flex justify-center items-center gap-2 transition-all ${activeMode === 'blog' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <PenTool className="w-4 h-4" /> Mode Blog
                    </button>
                </div>
            </div>

            <div className="w-full p-4 flex flex-col gap-6">
                
                {/* Global Settings */}
                <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI Engine Provider</label>
                    <select 
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                    >
                        <option value="gemini">Google Gemini 2.5 Flash</option>
                        <option value="mistral">Mistral AI (Le Chat)</option>
                    </select>
                </div>

                {message && (
                    <div className="w-full p-3 bg-blue-100 text-blue-800 border-l-4 border-blue-500 text-sm font-bold shadow-sm flex flex-col">
                        {message}
                    </div>
                )}

                {/* ======================= AEO MODE ======================= */}
                {activeMode === 'aeo' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
                            <h2 className="font-bold text-sm uppercase tracking-widest text-slate-500 border-b pb-2 w-full">Target Keyword FAQ</h2>
                            <form onSubmit={handleGenerateAeo} className="flex flex-col w-full gap-4">
                                <input 
                                    type="text" 
                                    value={aeoKeyword}
                                    onChange={(e) => setAeoKeyword(e.target.value)}
                                    placeholder="Contoh: Polygon OSS untuk Restoran"
                                    className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                    required
                                />
                                <button 
                                    type="submit" 
                                    disabled={isGeneratingAeo || !aeoKeyword.trim()}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-black p-4 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
                                >
                                    {isGeneratingAeo ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                    GENERATE AEO VIA AI
                                </button>
                            </form>
                        </div>

                        {generatedAeo && (
                            <div className="w-full bg-amber-50 p-5 rounded-2xl shadow-sm border border-amber-200 flex flex-col gap-4">
                                <h2 className="font-bold text-sm uppercase tracking-widest text-amber-700 border-b border-amber-200 pb-2 w-full">Preview Hasil AI</h2>
                                <div className="flex flex-col w-full gap-3">
                                    <div className="flex flex-col w-full gap-1 border-l-2 border-amber-500 pl-3">
                                        <span className="text-[10px] font-black uppercase text-amber-600">Meta Title</span>
                                        <span className="text-sm font-bold">{generatedAeo.metaTitle}</span>
                                    </div>
                                    <div className="flex flex-col w-full gap-1 border-l-2 border-amber-500 pl-3 mt-2">
                                        <span className="text-[10px] font-black uppercase text-amber-600">FAQ Schema ({generatedAeo.faqSchema.length} items)</span>
                                        <div className="w-full max-h-40 overflow-y-auto bg-white p-3 rounded border border-amber-100 text-[10px] font-mono whitespace-pre-wrap flex flex-col">
                                            {JSON.stringify(generatedAeo.faqSchema, null, 2)}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSaveAeoDraft}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black p-4 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 mt-2"
                                >
                                    <Save className="w-5 h-5" /> SIMPAN KE DRAFT (OFFLINE)
                                </button>
                            </div>
                        )}

                        <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
                            <h2 className="font-bold text-sm uppercase tracking-widest text-slate-500 border-b pb-2">Draft Lokal AEO ({aeoDrafts.length})</h2>
                            {aeoDrafts.length === 0 ? (
                                <p className="text-xs text-center text-slate-400 py-6 italic w-full">Tidak ada draft AEO tersimpan.</p>
                            ) : (
                                <div className="flex flex-col w-full gap-3 max-h-[50vh] overflow-y-auto pr-1">
                                    {aeoDrafts.map(draft => (
                                        <div key={draft.id} className="w-full flex flex-col bg-slate-50 border border-slate-200 rounded-lg p-3 gap-2 relative group">
                                            <button onClick={() => handleDeleteAeoDraft(draft.id)} className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-md">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                            <div className="text-xs font-black uppercase text-amber-600">{draft.keyword}</div>
                                            <div className="text-sm font-bold pr-8 line-clamp-1">{draft.metaTitle}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button 
                                onClick={handlePublishAllAeo}
                                disabled={aeoDrafts.length === 0 || isSyncingAeo}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black p-4 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50 mt-2"
                            >
                                {isSyncingAeo ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                                PUBLIKASIKAN SEMUA AEO
                            </button>
                        </div>
                    </div>
                )}

                {/* ======================= BLOG MODE ======================= */}
                {activeMode === 'blog' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
                        
                        {/* Queue Input */}
                        <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
                            <h2 className="font-bold text-sm uppercase tracking-widest text-slate-500 border-b pb-2 w-full">Antrean Topik Blog</h2>
                            <form onSubmit={handleAddBlogQueue} className="flex flex-col w-full gap-3">
                                <input 
                                    type="text" 
                                    value={blogKeywordInput}
                                    onChange={(e) => setBlogKeywordInput(e.target.value)}
                                    placeholder="Contoh: Cara mengatasi error WGS84"
                                    className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                    required
                                />
                                <button 
                                    type="submit" 
                                    disabled={!blogKeywordInput.trim()}
                                    className="w-full bg-slate-100 text-slate-700 font-bold p-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 active:scale-95 transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Tambah Antrean
                                </button>
                            </form>
                            
                            <div className="flex flex-col w-full gap-2 mt-2">
                                {blogQueue.length === 0 ? (
                                    <p className="text-xs text-center text-slate-400 py-2 italic w-full">Antrean kosong.</p>
                                ) : (
                                    blogQueue.map((item, idx) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg text-sm">
                                            <div className="flex items-center gap-3">
                                                <span className="w-5 h-5 flex items-center justify-center bg-slate-200 text-xs font-bold rounded-full">{idx + 1}</span>
                                                <span className="font-medium line-clamp-1">{item.keyword}</span>
                                            </div>
                                            <button onClick={() => handleDeleteBlogQueue(item.id)} className="text-red-500 p-1">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Magic Execution Button */}
                        <button 
                            onClick={handleGenerateNextBlog}
                            disabled={isGeneratingBlog || blogQueue.length === 0}
                            className={`w-full font-black p-5 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg transition-all ${isGeneratingBlog ? 'bg-amber-400 text-black animate-pulse' : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white active:scale-95'}`}
                        >
                            {isGeneratingBlog ? (
                                <>
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <span className="text-sm">Sedang menulis: {generatingBlogTarget}...</span>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 text-lg">
                                        <PenTool className="w-6 h-6" /> TULIS ARTIKEL BERIKUTNYA (AUTO)
                                    </div>
                                    <span className="text-xs opacity-80 font-normal">Sisa antrean: {blogQueue.length} topik</span>
                                </>
                            )}
                        </button>

                        {/* Draft Blogs List */}
                        <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
                            <h2 className="font-bold text-sm uppercase tracking-widest text-slate-500 border-b pb-2">Draft Artikel ({blogDrafts.length})</h2>
                            
                            {blogDrafts.length === 0 ? (
                                <p className="text-xs text-center text-slate-400 py-6 italic w-full">Belum ada artikel yang ditulis.</p>
                            ) : (
                                <div className="flex flex-col w-full gap-3 max-h-[40vh] overflow-y-auto">
                                    {blogDrafts.map(post => (
                                        <div 
                                            key={post.id} 
                                            onClick={() => setPreviewBlog(previewBlog?.id === post.id ? null : post)}
                                            className={`w-full flex flex-col border rounded-lg p-4 gap-2 cursor-pointer transition-all ${previewBlog?.id === post.id ? 'border-amber-500 bg-amber-50 shadow-md' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="text-sm font-bold leading-tight">{post.title}</h3>
                                                    <p className="text-xs text-slate-500">/{post.slug}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteBlogDraft(post.id); }} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <ChevronRight className={`w-4 h-4 transition-transform ${previewBlog?.id === post.id ? 'rotate-90 text-amber-600' : 'text-slate-400'}`} />
                                                </div>
                                            </div>
                                            
                                            {/* Preview Expanded Area */}
                                            {previewBlog?.id === post.id && (
                                                <div className="w-full mt-3 pt-3 border-t border-amber-200 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-black uppercase text-amber-600">Excerpt</span>
                                                        <p className="text-xs italic bg-white p-2 rounded border border-amber-100">{post.excerpt}</p>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-black uppercase text-amber-600">Konten (Markdown Render)</span>
                                                        <div className="w-full bg-white p-4 rounded-lg border border-amber-100 text-xs overflow-x-auto prose prose-sm max-w-none">
                                                            <ReactMarkdown>{post.content}</ReactMarkdown>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
