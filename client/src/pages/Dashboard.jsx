import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import PaymentModal from '@/components/PaymentModal';
import { Download, Search, Menu, X, Plus, Minus, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import DigitasiMap from '@/components/DigitasiMap';

export default function Dashboard() {
    const { user, updateBalance, logout } = useAuth();
    const { toast } = useToast();

    // Input States
    const [url, setUrl] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [area, setArea] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetMapTrigger, setResetMapTrigger] = useState(0);

    const handleResetMap = () => {
        setResetMapTrigger(prev => prev + 1);
        setCustomPolygon(null);
        setArea('');
    };

    // Sidebar Toggle
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Map State Glue
    const [mapCenter, setMapCenter] = useState(null); // [lat, lng]
    const [customPolygon, setCustomPolygon] = useState(null); // { area, coordinates, geojson }

    const handleSearch = async () => {
        if (!searchQuery) return;
        setIsSearching(true);
        setSearchResults([]);

        const fetchLocation = async (query) => {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
            return await res.json();
        };

        try {
            let data = await fetchLocation(searchQuery);
            if (data.length === 0) {
                // Fallback cleanup
                const cleanedQuery = searchQuery.replace(/(RT|RW)\.?\s*\d+(\s*\/\s*(RT|RW)\.?\s*\d+)?/gi, '').replace(/\b\d{5}\b/g, '').trim();
                if (cleanedQuery !== searchQuery) {
                    toast({ title: "Mencari Area...", description: "Mencoba mencari level Desa/Kecamatan..." });
                    data = await fetchLocation(cleanedQuery);
                }
            }
            setSearchResults(data);
            if (data.length === 0) toast({ title: "Tidak Ditemukan", variant: "destructive" });
        } catch {
            toast({ title: "Error", description: "Gagal mencari lokasi", variant: "destructive" });
        } finally {
            setIsSearching(false);
        }
    };

    const selectLocation = (result) => {
        setLat(result.lat);
        setLng(result.lon);
        setMapCenter([parseFloat(result.lat), parseFloat(result.lon)]);
        handleResetMap();
        setSearchResults([]);
        setSearchQuery(result.display_name);
        toast({ title: "Lokasi Dipilih", description: result.display_name });
    };

    // Helper functions for stepper buttons
    const adjustLat = (delta) => {
        setLat(prev => {
            const current = parseFloat(String(prev).replace(',', '.')) || 0;
            const next = current + delta;
            // Limit to 7 decimal places for neatness
            const nextStr = parseFloat(next.toFixed(7)).toString();
            const parsedLng = parseFloat(String(lng).replace(',', '.'));
            if (!isNaN(parsedLng)) setMapCenter([next, parsedLng]);
            return nextStr;
        });
    };

    const adjustLng = (delta) => {
        setLng(prev => {
            const current = parseFloat(String(prev).replace(',', '.')) || 0;
            const next = current + delta;
            const nextStr = parseFloat(next.toFixed(7)).toString();
            const parsedLat = parseFloat(String(lat).replace(',', '.'));
            if (!isNaN(parsedLat)) setMapCenter([parsedLat, next]);
            return nextStr;
        });
    };

    const adjustArea = (delta) => {
        setArea(prev => {
            const current = parseFloat(String(prev).replace(',', '.')) || 0;
            const next = Math.max(0, current + delta); // Prevent negative area
            return next.toString();
        });
    };

    const parseUrl = async (input) => {
        setUrl(input);
        const strInput = String(input || '');
        let parsedLat = null;
        let parsedLng = null;

        // 1. Prioritas !3d !4d
        const latMatch = strInput.match(/!3d(-?\d+[\.,]\d+)/);
        const lngMatch = strInput.match(/!4d(-?\d+[\.,]\d+)/);

        if (latMatch && lngMatch) {
            parsedLat = latMatch[1];
            parsedLng = lngMatch[1];
        } else {
            // 2. Fallback @lat,lng
            let match = strInput.match(/@(-?\d+[\.,]\d+),(-?\d+[\.,]\d+)/);
            if (match) {
                parsedLat = match[1];
                parsedLng = match[2];
            } else {
                match = strInput.match(/(?:q|ll)=(-?\d+[\.,]\d+)[,;](-?\d+[\.,]\d+)/);
                if (match) {
                    parsedLat = match[1];
                    parsedLng = match[2];
                } else {
                    const cleanStr = strInput.replace(/[\s]/g, '');
                    const rawMatch = cleanStr.match(/^(-?\d+[\.,]\d+)[,;](-?\d+[\.,]\d+)$/);
                    if (rawMatch) {
                        parsedLat = rawMatch[1];
                        parsedLng = rawMatch[2];
                    }
                }
            }
        }

        if (parsedLat && parsedLng) {
            parsedLat = parsedLat.replace(',', '.');
            parsedLng = parsedLng.replace(',', '.');
            setLat(parsedLat);
            setLng(parsedLng);
            const numLat = parseFloat(parsedLat);
            const numLng = parseFloat(parsedLng);
            
            if (!isNaN(numLat) && !isNaN(numLng)) {
                setMapCenter([numLat, numLng]);
                handleResetMap();
                toast({ title: "Koordinat Ditemukan", description: `${parsedLat}, ${parsedLng}` });
            }
        } else if (strInput.includes('goo.gl') || strInput.includes('maps.app.goo.gl') || strInput.startsWith('http')) {
            toast({ title: "Mengekstrak Link...", description: "Sedang mengambil koordinat dari server..." });
            try {
                const res = await api.post('/generator/parse-maps-url', { url: input });
                if (res.data && res.data.lat && res.data.lng) {
                    setLat(res.data.lat);
                    setLng(res.data.lng);
                    const numLat = parseFloat(res.data.lat);
                    const numLng = parseFloat(res.data.lng);
                    if (!isNaN(numLat) && !isNaN(numLng)) {
                        setMapCenter([numLat, numLng]);
                        handleResetMap();
                        toast({ title: "Koordinat Ditemukan", description: `${res.data.lat}, ${res.data.lng}` });
                    }
                }
            } catch (error) {
                toast({ title: "Gagal Ekstrak Link", description: error.response?.data?.error || "Gagal mengambil koordinat, silakan masukkan manual.", variant: "destructive" });
            }
        }
    };

    // Called when user finishes drawing in DigitasiMap
    const handlePolygonChange = (data) => {
        setCustomPolygon(data);
        if (data && data.area !== undefined) {
            setArea(data.area.toFixed(0));
        }
    };

    const handleGenerate = async () => {
        const hasPolygon = customPolygon && customPolygon.coordinates;
        const hasInputs = lat && lng && area;

        if (!hasPolygon && !hasInputs) {
            toast({ title: "Error", description: "Harap gambar polygon atau isi data manual.", variant: "destructive" });
            return;
        }

        if (user.token_balance < 5) {
            toast({ title: "Saldo Kurang", description: "Hubungi admin untuk top up.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            let payload = {};
            if (hasPolygon) {
                payload = { customPoints: customPolygon.coordinates };
            } else {
                payload = {
                    lat: parseFloat(String(lat).replace(',', '.')),
                    lng: parseFloat(String(lng).replace(',', '.')),
                    area: parseFloat(String(area).replace(',', '.'))
                };
            }

            const response = await api.post('/generator/create', payload, { responseType: 'blob' });

            const blob = new Blob([response.data], { type: 'application/zip' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `polygon_${Date.now()}.zip`;
            link.click();

            updateBalance(user.token_balance - 5);
            toast({ title: "Sukses", description: "Shapefile berhasil digenerate!" });

        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Gagal generate file.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden">
            {/* Header - Fixed Top (z-30) */}
            <header className="z-30 bg-white border-b shadow-sm h-16 flex-none px-6 flex justify-between items-center relative">
                <div className="font-bold text-xl flex items-center gap-6 text-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center text-white text-xs font-bold">LS</div>
                        LineSima
                    </div>
                    
                    {/* Post-Login Navigation */}
                    <nav className="hidden md:flex items-center gap-4 text-sm font-semibold">
                        <a href="/dashboard" className="text-slate-900 border-b-2 border-amber-500 pb-1">Buat Peta Polygon</a>
                        <a href="#" className="text-slate-500 hover:text-slate-900 pb-1 border-b-2 border-transparent">Riwayat Polygon</a>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex text-sm font-medium bg-secondary px-3 py-1.5 rounded-full items-center gap-2">
                        <span className="text-slate-500">Balance:</span>
                        <span className="text-amber-600 font-bold">{user?.token_balance}</span>
                    </div>
                    <PaymentModal>
                        <Button size="sm" variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50 rounded-full px-4 font-bold">
                            Top-up Token
                        </Button>
                    </PaymentModal>
                    <Button variant="ghost" size="sm" onClick={logout} className="text-slate-500 hover:text-red-500">
                        Logout
                    </Button>
                </div>
            </header>

            {/* Main Area - Full Screen Map under Sidebar */}
            <main className="flex-1 relative w-full overflow-hidden">

                {/* 1. Map (Background, z-0) */}
                <div className="absolute inset-0 z-0">
                    <DigitasiMap
                        center={mapCenter}
                        zoom={mapCenter ? 17 : 5}
                        onPolygonChange={handlePolygonChange}
                        onDownload={handleGenerate}
                        manualLat={lat}
                        manualLng={lng}
                        manualArea={area}
                        resetTrigger={resetMapTrigger}
                    />
                </div>

                {/* 2. Top Panel (Floating Overlay, z-20) */}
                <div
                    className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[95%] sm:w-[500px] transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-y-0' : '-translate-y-[150%]'
                        }`}
                >
                    <Card className="shadow-2xl border-0 sm:border sm:border-slate-200/60 bg-white/95 backdrop-blur-md max-h-[calc(100vh-100px)] flex flex-col">
                        <CardHeader className="py-4 px-5 border-b flex-none flex flex-row justify-between items-center">
                            <CardTitle className="text-lg">Generator Tool</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8">
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-5 space-y-5 overflow-y-auto flex-1">
                            {/* Info Box */}
                            <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-xs leading-relaxed border border-blue-100">
                                <strong>Panduan Sistem:</strong>
                                <ul className="list-decimal pl-4 mt-1 space-y-0.5">
                                    <li>Cari lokasi lahan Anda melalui kotak pencarian.</li>
                                    <li>Gunakan ikon ⬡ (draw polygon) di kiri peta untuk mulai menggambar batas lahan.</li>
                                    <li>Klik titik awal kembali untuk menutup bidang polygon.</li>
                                    <li>Klik tombol <strong>"Dapatkan File OSS"</strong>.</li>
                                </ul>
                            </div>

                            {/* Search */}
                            <div className="space-y-2 relative z-50">
                                <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Cari Lokasi</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Nama Kota / Jalan..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="bg-slate-50 border-slate-200 focus-visible:ring-amber-500"
                                    />
                                    <Button onClick={handleSearch} className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm" disabled={isSearching}>
                                        {isSearching ? <span className="animate-spin">⌛</span> : <Search className="w-4 h-4" />}
                                    </Button>
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-b-md shadow-xl max-h-48 overflow-y-auto mt-0 divide-y">
                                        {searchResults.map((result) => (
                                            <div
                                                key={result.place_id}
                                                className="p-3 hover:bg-amber-50 cursor-pointer text-sm transition-colors"
                                                onClick={() => selectLocation(result)}
                                            >
                                                <p className="font-semibold text-slate-800 line-clamp-1">{result.display_name.split(',')[0]}</p>
                                                <p className="text-xs text-slate-500 line-clamp-1">{result.display_name}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Google Maps Link */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Import dari Google Maps</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Paste URL Google Maps..."
                                        value={url}
                                        onChange={(e) => parseUrl(e.target.value)}
                                        className="bg-slate-50 border-slate-200 focus-visible:ring-amber-500"
                                    />
                                </div>
                            </div>                            {/* Manual Inputs / Readout */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Latitude (Y)</Label>
                                    <div className="flex items-center">
                                        <Button variant="outline" size="icon" onClick={() => adjustLat(-0.0001)} className="h-8 w-8 rounded-r-none border-r-0 focus:z-10 bg-slate-50 hover:bg-slate-200" title="Geser ke Selatan"><ChevronDown className="h-3 w-3" /></Button>
                                        <Input 
                                            value={lat} 
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setLat(val);
                                                const parsed = parseFloat(String(val).replace(',', '.'));
                                                const parsedLng = parseFloat(String(lng).replace(',', '.'));
                                                if (!isNaN(parsed) && !isNaN(parsedLng)) {
                                                    setMapCenter([parsed, parsedLng]);
                                                }
                                            }} 
                                            className="h-8 text-xs bg-slate-50 text-center rounded-none px-1 focus:z-10" 
                                        />
                                        <Button variant="outline" size="icon" onClick={() => adjustLat(0.0001)} className="h-8 w-8 rounded-l-none border-l-0 focus:z-10 bg-slate-50 hover:bg-slate-200" title="Geser ke Utara"><ChevronUp className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Longitude (X)</Label>
                                    <div className="flex items-center">
                                        <Button variant="outline" size="icon" onClick={() => adjustLng(-0.0001)} className="h-8 w-8 rounded-r-none border-r-0 focus:z-10 bg-slate-50 hover:bg-slate-200" title="Geser ke Barat"><ChevronLeft className="h-3 w-3" /></Button>
                                        <Input 
                                            value={lng} 
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setLng(val);
                                                const parsed = parseFloat(String(val).replace(',', '.'));
                                                const parsedLat = parseFloat(String(lat).replace(',', '.'));
                                                if (!isNaN(parsed) && !isNaN(parsedLat)) {
                                                    setMapCenter([parsedLat, parsed]);
                                                }
                                            }} 
                                            className="h-8 text-xs bg-slate-50 text-center rounded-none px-1 focus:z-10" 
                                        />
                                        <Button variant="outline" size="icon" onClick={() => adjustLng(0.0001)} className="h-8 w-8 rounded-l-none border-l-0 focus:z-10 bg-slate-50 hover:bg-slate-200" title="Geser ke Timur"><ChevronRight className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Luas Area (m²)</Label>
                                    {customPolygon && <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">✓ Polygon Aktif</span>}
                                </div>
                                <div className="flex items-center shadow-sm">
                                    <Button variant="outline" size="icon" onClick={() => adjustArea(-10)} className="h-10 w-12 shrink-0 rounded-r-none border-r-0 focus:z-10 bg-slate-100 hover:bg-slate-200" title="Kurangi 10m²"><Minus className="h-4 w-4 text-slate-700" /></Button>
                                    <div className="relative flex-1">
                                        <Input
                                            type="number"
                                            value={area}
                                            onChange={(e) => setArea(e.target.value)}
                                            placeholder="0"
                                            className="h-10 font-mono text-center text-base border-slate-200 focus-visible:ring-amber-500 rounded-none z-0 focus:z-10 w-full"
                                        />
                                        <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">m²</span>
                                    </div>
                                    <Button variant="outline" size="icon" onClick={() => adjustArea(10)} className="h-10 w-12 shrink-0 rounded-l-none border-l-0 focus:z-10 bg-slate-100 hover:bg-slate-200" title="Tambah 10m²"><Plus className="h-4 w-4 text-slate-700" /></Button>
                                </div>
                            </div>
                            <div className="mt-2 space-y-2">
                                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg" size="lg" onClick={handleGenerate} disabled={loading}>
                                    <Download className="w-4 h-4 mr-2" />
                                    {loading ? "Memproses..." : "Dapatkan File OSS Sekarang"}
                                </Button>
                                <div className="flex justify-center items-center">
                                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded border border-green-200">
                                        ✓ OSS-Ready: Validasi WGS84
                                    </span>
                                </div>
                            </div>

                            {/* Upsell Banner */}
                            <div className="mt-6 p-4 bg-slate-900 rounded-xl text-white border-2 border-amber-500 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black px-2 py-1 rounded-bl-lg z-10">DONE-FOR-YOU</div>
                                <div className="absolute inset-0 bg-white/5 opacity-10"></div>
                                <div className="relative z-10">
                                    <h4 className="font-bold text-sm mb-1 text-amber-400">Bingung buat polygon?</h4>
                                    <p className="text-xs opacity-90 mb-3">Kami buatkan untuk Anda — Rp 150.000 / polygon. Dijamin 100% lolos OSS.</p>
                                    <Button asChild size="sm" className="w-full text-xs bg-amber-500 hover:bg-amber-600 text-black font-bold h-8">
                                        <a href="https://wa.me/6288983840979?text=Halo%20Admin,%20saya%20ingin%20menggunakan%20jasa%20pembuatan%20polygon%20Done-For-You." target="_blank" rel="noreferrer">
                                            Pesan Jasa Sekarang
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Panel Toggle Button (Floating) */}
                {!sidebarOpen && (
                    <Button
                        variant="secondary"
                        className="absolute z-30 top-4 left-1/2 -translate-x-1/2 shadow-md bg-white hover:bg-slate-100 text-slate-700 transition-all duration-300 ease-in-out rounded-full px-6 flex items-center gap-2 font-semibold"
                        onClick={() => setSidebarOpen(true)}
                        title="Buka Generator Tool"
                    >
                        <Menu className="h-4 w-4" /> Buka Generator Tool
                    </Button>
                )}

            </main>
        </div>
    );
}
