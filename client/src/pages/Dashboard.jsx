import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import PaymentModal from '@/components/PaymentModal';
import { Download, Search, Menu, X } from 'lucide-react';
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
        setSearchResults([]);
        setSearchQuery(result.display_name);
        toast({ title: "Lokasi Dipilih", description: result.display_name });
    };

    const parseUrl = (input) => {
        setUrl(input);
        const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        const match = input.match(regex);
        if (match) {
            setLat(match[1]);
            setLng(match[2]);
            setMapCenter([parseFloat(match[1]), parseFloat(match[2])]);
            toast({ title: "Koordinat Ditemukan", description: `${match[1]}, ${match[2]}` });
        }
    };

    // Called when user finishes drawing in DigitasiMap
    const handlePolygonChange = (data) => {
        setCustomPolygon(data);
        setArea(data.area.toFixed(0));
    };

    const handleGenerate = async () => {
        const hasPolygon = !!customPolygon;
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
            if (customPolygon) {
                payload = { customPoints: customPolygon.coordinates };
            } else {
                payload = {
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    area: parseFloat(area)
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
                <div className="font-bold text-xl flex items-center gap-2 text-slate-800">
                    <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center text-white text-xs font-bold">PS</div>
                    PolygonSima
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex text-sm font-medium bg-secondary px-3 py-1.5 rounded-full items-center gap-2">
                        <span className="text-slate-500">Balance:</span>
                        <span className="text-amber-600 font-bold">{user?.token_balance}</span>
                    </div>
                    <PaymentModal>
                        <Button size="sm" variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50 rounded-full px-4">
                            + Tokens
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
                                <strong>Panduan:</strong> Cari lokasi atau paste Link Google Maps. Gambar polygon di peta, lalu download SHP.
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
                            </div>

                            {/* Manual Inputs / Readout */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Latitude</Label>
                                    <Input value={lat} onChange={(e) => setLat(e.target.value)} className="h-8 text-xs bg-slate-50" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Longitude</Label>
                                    <Input value={lng} onChange={(e) => setLng(e.target.value)} className="h-8 text-xs bg-slate-50" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Luas Area (m²)</Label>
                                    {customPolygon && <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">✓ Polygon Aktif</span>}
                                </div>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={area}
                                        onChange={(e) => setArea(e.target.value)}
                                        placeholder="0"
                                        className="font-mono text-right pr-8 border-slate-200 focus-visible:ring-amber-500"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-slate-400">m²</span>
                                </div>
                            </div>

                            {/* Server Generate Button */}
                            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg mt-2" size="lg" onClick={handleGenerate} disabled={loading}>
                                <Download className="w-4 h-4 mr-2" />
                                {loading ? "Memproses..." : "Generate ZIP (Server) - 5 Poin"}
                            </Button>
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
