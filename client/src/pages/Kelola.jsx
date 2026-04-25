import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Users, Coins, PlusCircle, Search, Trash2, ArrowUpRight, ArrowDownLeft, FileText, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminAEO from './AdminAEO';

export default function Kelola() {
    const { logout } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Add User State
    const [newUserOpen, setNewUserOpen] = useState(false);
    const [newData, setNewData] = useState({ name: '', email: '', whatsapp: '', password: '', initialTokens: 0 });

    // Token Modal State
    const [tokenModalOpen, setTokenModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [tokenAmount, setTokenAmount] = useState(0);
    const [tokenAction, setTokenAction] = useState('add');

    // Blog SEO State
    const [activeTab, setActiveTab] = useState('users');
    const [blogData, setBlogData] = useState({ title: '', slug: '', excerpt: '', author: 'Admin', keywords: '', content: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/kelola/users');
            setUsers(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to fetch users", variant: "destructive" });
        }
    };

    const handleCreateUser = async () => {
        try {
            await api.post('/kelola/users', newData);
            toast({ title: "Success", description: "User created successfully" });
            setNewUserOpen(false);
            setNewData({ name: '', email: '', whatsapp: '', password: '', initialTokens: 0 });
            fetchUsers();
        } catch (error) {
            toast({ title: "Error", description: error.response?.data?.error || "Failed to create user", variant: "destructive" });
        }
    };

    const handleUpdateTokens = async () => {
        if (!selectedUser) return;
        const amount = tokenAction === 'add' ? parseInt(tokenAmount) : -parseInt(tokenAmount);
        try {
            await api.put(`/kelola/users/${selectedUser.id}/tokens`, { amount });
            toast({ title: "Success", description: `Updated tokens for ${selectedUser.email}` });
            setTokenModalOpen(false);
            setTokenAmount(0);
            fetchUsers();
        } catch {
            toast({ title: "Error", description: "Failed to update tokens", variant: "destructive" });
        }
    };

    const filteredUsers = users.filter(u =>
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.whatsapp || '').includes(searchTerm)
    );

    // Analytics
    const totalUsers = users.length;
    const totalTokens = users.reduce((acc, curr) => acc + (curr.token_balance || 0), 0);
    const activeUsers = users.filter(u => u.token_balance > 0).length;

    return (
        <div className="min-h-screen bg-slate-50/50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Panel Kelola</h1>
                        <p className="text-muted-foreground">Kelola pengguna, token, dan kesehatan sistem.</p>
                    </div>
                    <Button variant="outline" onClick={logout}>Logout</Button>
                </div>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalUsers}</div>
                            <p className="text-xs text-muted-foreground">Registered on platform</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Circulating Tokens</CardTitle>
                            <Coins className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalTokens}</div>
                            <p className="text-xs text-muted-foreground">Total balance across all users</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeUsers}</div>
                            <p className="text-xs text-muted-foreground">Users with &gt;0 tokens</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-start gap-4 border-b w-full">
                    <Button
                        variant={activeTab === 'users' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('users')}
                        className={cn("rounded-none border-b-2 border-transparent px-8 py-6 text-lg", activeTab === 'users' && "border-primary")}
                    >
                        <Users className="w-5 h-5 mr-2" /> User Management
                    </Button>
                    <Button
                        variant={activeTab === 'seo' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('seo')}
                        className={cn("rounded-none border-b-2 border-transparent px-8 py-6 text-lg", activeTab === 'seo' && "border-primary")}
                    >
                        <FileText className="w-5 h-5 mr-2" /> Blog & SEO Tool
                    </Button>
                    <Button
                        variant={activeTab === 'aeo' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('aeo')}
                        className={cn("rounded-none border-b-2 border-transparent px-8 py-6 text-lg", activeTab === 'aeo' && "border-primary")}
                    >
                        <Check className="w-5 h-5 mr-2" /> AEO Control Panel
                    </Button>
                </div>

                {activeTab === 'users' ? (
                    /* User Management Section */
                    <div className="space-y-6">
                        {/* Actions Bar */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by Name, Email or WhatsApp..."
                                    className="pl-8 bg-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                                        <PlusCircle className="h-4 w-4" /> Add User Manually
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New User</DialogTitle>
                                        <DialogDescription>Create a user account manually.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Full Name</Label>
                                            <Input value={newData.name} onChange={e => setNewData({ ...newData, name: e.target.value })} placeholder="John Doe" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>WhatsApp Number</Label>
                                            <Input value={newData.whatsapp} onChange={e => setNewData({ ...newData, whatsapp: e.target.value })} placeholder="62812..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input value={newData.email} onChange={e => setNewData({ ...newData, email: e.target.value })} placeholder="email@example.com" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Password</Label>
                                            <div className="flex gap-2">
                                                <Input value={newData.password} onChange={e => setNewData({ ...newData, password: e.target.value })} type="text" placeholder="Password" />
                                                <Button type="button" variant="outline" onClick={() => {
                                                    const randomPass = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
                                                    setNewData({ ...newData, password: randomPass });
                                                }}>Generate</Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Initial Tokens</Label>
                                            <Input type="number" value={newData.initialTokens} onChange={e => setNewData({ ...newData, initialTokens: e.target.value })} />
                                        </div>
                                    </div>
                                    <DialogFooter className="gap-2 sm:justify-between">
                                        <Button type="button" variant="secondary" onClick={() => {
                                            const text = `Email: ${newData.email}\nPassword: ${newData.password}`;
                                            navigator.clipboard.writeText(text);
                                            toast({ title: "Copied!", description: "Credentials copied to clipboard." });
                                        }}>
                                            Copy Credentials
                                        </Button>
                                        <Button onClick={handleCreateUser}>Create User</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* User Table */}
                        <Card>
                            <CardContent className="p-0">
                                <div className="rounded-md border">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                                            <tr>
                                                <th className="p-4">Name / Email</th>
                                                <th className="p-4">WhatsApp</th>
                                                <th className="p-4">Tokens</th>
                                                <th className="p-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan="4" className="p-8 text-center">Loading users...</td></tr>
                                            ) : filteredUsers.length === 0 ? (
                                                <tr><td colSpan="4" className="p-8 text-center">No users found.</td></tr>
                                            ) : (
                                                filteredUsers.map((user) => (
                                                    <tr key={user.id} className="border-t hover:bg-muted/30 transition-colors">
                                                        <td className="p-4">
                                                            <div className="font-medium text-foreground">{user.name || "No Name"}</div>
                                                            <div className="text-muted-foreground text-xs">{user.email}</div>
                                                        </td>
                                                        <td className="p-4 font-mono">{user.whatsapp || "-"}</td>
                                                        <td className="p-4">
                                                            <div className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                                user.token_balance > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                                                                {user.token_balance} Tokens
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <Button variant="outline" size="sm" onClick={() => {
                                                                setSelectedUser(user);
                                                                setTokenModalOpen(true);
                                                            }}>
                                                                Manage Tokens
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : activeTab === 'seo' ? (
                    /* Blog SEO Tool Section */
                    <div className="grid lg:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Create New Blog Post</CardTitle>
                                <CardDescription>Fill in the details to generate SEO-optimized article data.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Article Title</Label>
                                    <Input
                                        placeholder="e.g. Cara Mengurus NIB OSS"
                                        value={blogData.title}
                                        onChange={e => {
                                            const title = e.target.value;
                                            setBlogData({
                                                ...blogData,
                                                title,
                                                // Auto-generate slug
                                                slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                                            });
                                        }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Slug (URL Friendly)</Label>
                                        <Input value={blogData.slug} onChange={e => setBlogData({ ...blogData, slug: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Author</Label>
                                        <Input value={blogData.author} onChange={e => setBlogData({ ...blogData, author: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Meta Keywords (Comma separated)</Label>
                                    <Input
                                        placeholder="nib, oss, peta digital, shapefile"
                                        value={blogData.keywords}
                                        onChange={e => setBlogData({ ...blogData, keywords: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Excerpt (Meta Description)</Label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Brief summary for Google connection..."
                                        value={blogData.excerpt}
                                        onChange={e => setBlogData({ ...blogData, excerpt: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Content (Markdown)</Label>
                                    <textarea
                                        className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                                        placeholder="## Heading 2&#10;Write your content using Markdown..."
                                        value={blogData.content}
                                        onChange={e => setBlogData({ ...blogData, content: e.target.value })}
                                    />
                                </div>
                                <Button className="w-full" onClick={async () => {
                                    if (!blogData.title || !blogData.content) {
                                        toast({ title: "Error", description: "Title and Content are required", variant: "destructive" });
                                        return;
                                    }

                                    try {
                                        const { data: _data, error: insertError } = await supabase
                                            .from('articles')
                                            .insert([
                                                {
                                                    slug: blogData.slug,
                                                    title: blogData.title,
                                                    excerpt: blogData.excerpt,
                                                    author: blogData.author,
                                                    keywords: blogData.keywords,
                                                    content: blogData.content,
                                                    is_published: true
                                                }
                                            ])
                                            .select();

                                        if (insertError) throw insertError;

                                        toast({ title: "Success!", description: "Article published to database." });
                                        // Reset form
                                        setBlogData({ title: '', slug: '', excerpt: '', author: 'Admin', keywords: '', content: '' });
                                    } catch (err) {
                                        console.error(err);
                                        toast({ title: "Error", description: err.message || "Failed to save article", variant: "destructive" });
                                    }
                                }}>
                                    <Check className="w-4 h-4 mr-2" /> Publish Article
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="h-full flex flex-col">
                            <CardHeader>
                                <CardTitle>Recent Articles (Database)</CardTitle>
                                <CardDescription>
                                    List of articles currently live on Supabase.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto">
                                <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg border-dashed">
                                    Refresh page to see latest articles list here...
                                    <br />
                                    (Connect your Supabase credentials in .env first)
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border p-4">
                        <AdminAEO />
                    </div>
                )}

                {/* Token Management Modal */}
                <Dialog open={tokenModalOpen} onOpenChange={setTokenModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Manage Tokens</DialogTitle>
                            <DialogDescription>
                                Adjust token balance for <b>{selectedUser?.name || selectedUser?.email}</b>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6 space-y-6">
                            <div className="flex items-center justify-center gap-4">
                                <div className="text-center p-4 bg-slate-100 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Current Balance</div>
                                    <div className="text-3xl font-bold">{selectedUser?.token_balance}</div>
                                </div>
                                <div className="text-2xl text-muted-foreground">→</div>
                                <div className="text-center p-4 bg-slate-100 rounded-lg border-2 border-primary/20">
                                    <div className="text-sm text-muted-foreground">New Balance</div>
                                    <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-600">
                                        {selectedUser?.token_balance + (tokenAction === 'add' ? parseInt(tokenAmount || 0) : -parseInt(tokenAmount || 0))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={tokenAction === 'add' ? 'default' : 'outline'}
                                        className={cn("flex-1", tokenAction === 'add' && "bg-green-600 hover:bg-green-700")}
                                        onClick={() => setTokenAction('add')}
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Tokens
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={tokenAction === 'remove' ? 'default' : 'outline'}
                                        className={cn("flex-1", tokenAction === 'remove' && "bg-red-600 hover:bg-red-700")}
                                        onClick={() => setTokenAction('remove')}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Deduct Tokens
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <Label>Amount</Label>
                                    <Input
                                        type="number"
                                        value={tokenAmount}
                                        onChange={(e) => setTokenAmount(e.target.value)}
                                        className="text-lg"
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setTokenModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdateTokens}>Confirm Update</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    );
}
