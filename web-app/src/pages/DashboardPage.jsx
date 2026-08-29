import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import PaymentModal from '@/components/PaymentModal';
import AuthModal from '@/components/AuthModal';
import { 
    Download, Search, Menu, X, Plus, Minus, ChevronUp, ChevronDown, 
    ChevronLeft, ChevronRight, FileText, CheckCircle2, Zap, Layers, 
    Compass, ChevronRight as ChevronRightIcon, PanelLeftClose, PanelLeft,
    Sparkles, ShieldCheck, Pentagon, Square, Trash2, Check, RotateCcw,
    LogIn, LogOut, ArrowLeft, ArrowUpRight, Info, MessageSquare
} from 'lucide-react';
import DigitasiMap from '@/components/DigitasiMap';
import ErrorBoundary from '@/components/ErrorBoundary';
import domtoimage from 'dom-to-image-more';
import { AmdalnetExportPanel } from '@/components/AmdalnetExportPanel';
import { checkAccessStatus } from '@/lib/deviceAccess';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { toast } = useToast();

    // Input States
    const [url, setUrl] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [area, setArea] = useState('');
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [resetMapTrigger, setResetMapTrigger] = useState(0);

    // External Draw Tool Actions & State registered from DigitasiMap
    const [drawTools, setDrawTools] = useState(null);
    const [drawState, setDrawState] = useState({ isDrawing: false, mode: null });

    // Auth Modal & Payment Modal State
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    // Sidebar Toggle (Desktop Sidebar & Mobile Drawer)
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Map State Glue
    const [mapCenter, setMapCenter] = useState(null); // [lat, lng]
    const [customPolygon, setCustomPolygon] = useState(null); // { area, coordinates, geojson }
    const [mapInstance, setMapInstance] = useState(null);

    // Dynamic Area Calculation
    const currentAreaM2 = customPolygon?.area ?? (parseFloat(String(area).replace(',', '.')) || 0);

    // Trigger Leaflet map invalidateSize whenever sidebar opens/closes or map is mounted
    useEffect(() => {
        if (mapInstance && mapInstance.invalidateSize) {
            const t1 = setTimeout(() => mapInstance.invalidateSize(), 150);
            const t2 = setTimeout(() => mapInstance.invalidateSize(), 350);
            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
            };
        }
    }, [mapInstance, sidebarOpen]);

    const handleResetMap = () => {
        setResetMapTrigger(prev => prev + 1);
        setCustomPolygon(null);
        setArea('');
    };

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
                const cleanedQuery = searchQuery.replace(/(RT|RW)\.?\s*\d+(\s*\/\s*(RT|RW)\.?\s*\d+)?/gi, '').replace(/\b\d{5}\b/g, '').trim();
                if (cleanedQuery !== searchQuery) {
                    toast({ title: "Mencari Area...", description: "Mencoba mencari level Desa/Kecamatan..." });
                    data = await fetchLocation(cleanedQuery);
                }
            }
            setSearchResults(data);
            if (data.length === 0) {
                toast({ title: "Lokasi Tidak Ditemukan", description: "Coba hapus detail RT/RW atau gunakan kata kunci nama desa/kota.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Gagal Pencarian", description: "Terjadi kesalahan saat mencari lokasi.", variant: "destructive" });
        } finally {
            setIsSearching(false);
        }
    };

    const selectLocation = (result) => {
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        setLat(latitude.toString());
        setLng(longitude.toString());
        setMapCenter([latitude, longitude]);
        setSearchResults([]);
        setSearchQuery(result.display_name.split(',')[0]);
        toast({ title: "Lokasi Ditemukan", description: result.display_name });
    };

    const parseUrl = (inputUrl) => {
        setUrl(inputUrl);
        if (!inputUrl) return;

        let latVal = null;
        let lngVal = null;

        const atMatch = inputUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (atMatch) {
            latVal = parseFloat(atMatch[1]);
            lngVal = parseFloat(atMatch[2]);
        }

        if (!latVal || !lngVal) {
            const qMatch = inputUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (qMatch) {
                latVal = parseFloat(qMatch[1]);
                lngVal = parseFloat(qMatch[2]);
            }
        }

        if (!latVal || !lngVal) {
            const llMatch = inputUrl.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (llMatch) {
                latVal = parseFloat(llMatch[1]);
                lngVal = parseFloat(llMatch[2]);
            }
        }

        if (!latVal || !lngVal) {
            const directMatch = inputUrl.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
            if (directMatch) {
                latVal = parseFloat(directMatch[1]);
                lngVal = parseFloat(directMatch[2]);
            }
        }

        if (latVal && lngVal) {
            setLat(latVal.toString());
            setLng(lngVal.toString());
            setMapCenter([latVal, lngVal]);
            toast({ title: "Koordinat Berhasil Diurai", description: `Lat: ${latVal}, Lng: ${lngVal}` });
        }
    };

    const adjustLat = (delta) => {
        const current = parseFloat(String(lat).replace(',', '.')) || -6.2088;
        const newVal = (current + delta).toFixed(6);
        setLat(newVal);
        const parsedLng = parseFloat(String(lng).replace(',', '.')) || 106.8456;
        setMapCenter([parseFloat(newVal), parsedLng]);
    };

    const adjustLng = (delta) => {
        const current = parseFloat(String(lng).replace(',', '.')) || 106.8456;
        const newVal = (current + delta).toFixed(6);
        setLng(newVal);
        const parsedLat = parseFloat(String(lat).replace(',', '.')) || -6.2088;
        setMapCenter([parsedLat, parseFloat(newVal)]);
    };

    const adjustArea = (delta) => {
        const current = parseFloat(String(area).replace(',', '.')) || 0;
        const newVal = Math.max(0, current + delta);
        setArea(newVal.toString());
    };

    const handlePolygonChange = (polygonData) => {
        setCustomPolygon(polygonData);
        if (polygonData && polygonData.area) {
            setArea(polygonData.area.toFixed(1));
        }
    };

    const getCustomPointsFromPolygon = () => {
        if (!customPolygon?.geojson) return null;
        const geoJSON = customPolygon.geojson;
        if (geoJSON.type === 'FeatureCollection' && geoJSON.features?.length > 0) {
            return geoJSON.features[geoJSON.features.length - 1].geometry?.coordinates[0] || null;
        } else if (geoJSON.type === 'Feature' && geoJSON.geometry) {
            return geoJSON.geometry.coordinates[0] || null;
        }
        return null;
    };

    const [metadataModalOpen, setMetadataModalOpen] = useState(false);

    useEffect(() => {
        window.handleOpenExportModal = () => setMetadataModalOpen(true);

        // 1. Instantly sanitize & clean URL query parameters for secure & clean address bar
        if (window.location.search) {
            const urlParams = new URLSearchParams(window.location.search);
            const orderIdFromUrl = urlParams.get('order_id') || urlParams.get('orderId');
            if (orderIdFromUrl) {
                localStorage.setItem('bp_last_order_id', orderIdFromUrl);
            }
            // Strip all query strings from browser address bar
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // 2. Perform background verification securely via backend API
        checkAccessStatus().then((access) => {
            if (access?.isActive) {
                toast({
                    title: "Akses Berhasil Aktif! 🎉",
                    description: "Paket Akses BikinPolygon Pass Anda telah aktif. Silakan unduh polygon Anda."
                });
            }
        });

        return () => {
            delete window.handleOpenExportModal;
        };
    }, [toast]);

    const handleGenerate = async () => {
        setMetadataModalOpen(true);
    };

    const handleGeneratePDF = async () => {
        setMetadataModalOpen(true);
    };

    // Reusable Sidebar Content Render Component
    const ControlsPanelContent = () => (
        <div className="p-4 space-y-5 text-slate-800 text-xs font-['Plus_Jakarta_Sans',sans-serif]">
            
            {/* Draw Tools Direct Trigger Bar */}
            <div className="bg-[#0F172A] text-white p-4 rounded-2xl border border-zinc-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#ADFA1D] flex items-center gap-1.5">
                        <Pentagon className="w-3.5 h-3.5 fill-[#ADFA1D]" /> Toolbar Digitasi Peta
                    </span>
                    {drawState.isDrawing && (
                        <span className="text-[10px] bg-[#ADFA1D] text-black font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                            Sedang Menggambar...
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button
                        onClick={() => drawTools?.startPolygon()}
                        disabled={drawState.isDrawing && drawState.mode !== 'polygon'}
                        type="button"
                        className={`h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                            drawState.mode === 'polygon' 
                                ? 'bg-[#ADFA1D] text-black shadow-[0_0_15px_rgba(173,250,29,0.3)]' 
                                : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800'
                        }`}
                    >
                        <Pentagon className="w-4 h-4 text-[#ADFA1D]" />
                        <span>Gambar Polygon</span>
                    </Button>

                    <Button
                        onClick={() => drawTools?.startRectangle()}
                        disabled={drawState.isDrawing && drawState.mode !== 'rectangle'}
                        type="button"
                        className={`h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                            drawState.mode === 'rectangle' 
                                ? 'bg-[#ADFA1D] text-black shadow-[0_0_15px_rgba(173,250,29,0.3)]' 
                                : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800'
                        }`}
                    >
                        <Square className="w-4 h-4 text-[#ADFA1D]" />
                        <span>Gambar Persegi</span>
                    </Button>
                </div>

                {/* Information Card for Area & Polygon Measurement */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 space-y-2 text-white">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-bold flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-[#ADFA1D]" /> Informasi Ukuran Polygon:
                        </span>
                        {customPolygon ? (
                            <span className="text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Tergambar
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full">
                                Belum Digambar
                            </span>
                        )}
                    </div>

                    <div className="flex items-baseline justify-between pt-1.5 border-t border-zinc-800/80">
                        <span className="text-xs text-slate-400">Luas Polygon:</span>
                        <div className="text-right">
                            <span className="font-mono text-base font-extrabold text-[#ADFA1D]">
                                {currentAreaM2 > 0 ? `${currentAreaM2.toFixed(2)} m²` : '0.00 m²'}
                            </span>
                            {currentAreaM2 > 0 && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                    ({(currentAreaM2 / 10000).toFixed(4)} Ha)
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Free Tier vs Premium Status Badge & Action */}
                    {currentAreaM2 > 0 && (
                        <div className="pt-2 border-t border-zinc-800">
                            {currentAreaM2 <= 50 ? (
                                <div className="bg-emerald-950/80 border border-emerald-700/60 rounded-lg p-2 flex items-center justify-between text-[11px] text-emerald-300 font-bold">
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-[#ADFA1D]" /> Gratis Free Tier (≤ 50 m²)
                                    </span>
                                    <span className="text-[10px] bg-[#ADFA1D] text-black font-extrabold px-2 py-0.5 rounded-full">FREE</span>
                                </div>
                            ) : (
                                <div className="bg-amber-950/80 border border-amber-700/60 rounded-lg p-2.5 space-y-2">
                                    <div className="flex items-center justify-between text-[11px] text-amber-200 font-bold">
                                        <span className="flex items-center gap-1.5">
                                            <Zap className="w-3.5 h-3.5 text-amber-400" /> Luas &gt; 50 m² (Akses Pro)
                                        </span>
                                        <span className="text-[10px] bg-amber-500 text-black font-extrabold px-2 py-0.5 rounded-full">PRO</span>
                                    </div>
                                    <Button
                                        onClick={() => setPaymentModalOpen(true)}
                                        type="button"
                                        size="sm"
                                        className="w-full bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-extrabold text-xs h-8 rounded-lg flex items-center justify-center gap-1.5 shadow-md"
                                    >
                                        <Zap className="w-3.5 h-3.5 fill-black" /> Buka Akses / Pakasir Pass
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Direct Download Button inside GIS Toolbar - Fully Enabled */}
                <Button
                    onClick={handleGenerate}
                    type="button"
                    className="w-full h-11 text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all uppercase bg-[#ADFA1D] hover:bg-[#9fe318] text-black shadow-[0_0_20px_rgba(173,250,29,0.35)] cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                    <Download className="w-4 h-4" />
                    <span>Download Polygon (SHP / PDF)</span>
                </Button>

                {/* Active Drawing Tool Controls */}
                {drawState.isDrawing && drawState.mode === 'polygon' && (
                    <div className="flex gap-2 pt-1 animate-in fade-in duration-200">
                        <Button
                            onClick={() => drawTools?.finishShape()}
                            type="button"
                            size="sm"
                            className="flex-1 bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-extrabold text-xs h-9 rounded-xl shadow-sm"
                        >
                            <Check className="w-3.5 h-3.5 mr-1" /> Selesai Shape
                        </Button>
                        <Button
                            onClick={() => drawTools?.deleteLastPoint()}
                            type="button"
                            size="sm"
                            className="bg-zinc-800 hover:bg-zinc-700 text-slate-200 font-medium text-xs h-9 px-3 rounded-xl border border-zinc-700"
                        >
                            <RotateCcw className="w-3 h-3 mr-1" /> Hapus Titik
                        </Button>
                        <Button
                            onClick={() => drawTools?.cancelDraw()}
                            type="button"
                            size="sm"
                            className="bg-rose-950 text-rose-300 hover:bg-rose-900 font-medium text-xs h-9 px-2.5 rounded-xl border border-rose-800"
                        >
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                )}

                {/* Reset & Delete Polygon Action Buttons */}
                {(customPolygon || currentAreaM2 > 0) && (
                    <>
                        <div className="pt-1 border-t border-zinc-800 flex items-center justify-between text-[11px] text-slate-300">
                            <span>Area Tergambar: <strong className="font-mono text-[#ADFA1D] font-bold">{currentAreaM2.toFixed(1)} m²</strong></span>
                            <Button
                                onClick={handleResetMap}
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 p-1 px-2 rounded-lg flex items-center gap-1"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span>Reset Peta</span>
                            </Button>
                        </div>
                    </>
                )}

                {/* Quick Download Action Card in Sidebar when Polygon is Drawn */}
                {(customPolygon || currentAreaM2 > 0) && !drawState.isDrawing && (
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl space-y-2 mt-2 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                            <span className="flex items-center gap-1.5 text-[#ADFA1D]">
                                <CheckCircle2 className="w-4 h-4 text-[#ADFA1D]" /> Polygon Ready
                            </span>
                            <span className="font-mono text-[#ADFA1D] text-xs font-bold bg-[#ADFA1D]/10 border border-[#ADFA1D]/30 px-2 py-0.5 rounded-full">
                                {currentAreaM2.toFixed(1)} m²
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <Button
                                onClick={handleGenerate}
                                disabled={loading || pdfLoading}
                                className="bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-extrabold text-xs h-9 rounded-xl flex items-center justify-center gap-1 shadow-md"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>SHP OSS / AMDALNET</span>
                            </Button>

                            <Button
                                onClick={handleGeneratePDF}
                                disabled={loading || pdfLoading}
                                className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs h-9 rounded-xl flex items-center justify-center gap-1 shadow-md"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>PDF Laporan</span>
                            </Button>
                        </div>

                        <Button
                            onClick={() => {
                                if (drawTools?.clear) {
                                    drawTools.clear();
                                } else {
                                    handleResetMap();
                                }
                                toast({
                                    title: "Polygon Dihapus 🗑️",
                                    description: "Polygon pada peta telah berhasil dibersihkan."
                                });
                            }}
                            type="button"
                            className="w-full bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-extrabold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer mt-1"
                        >
                            <Trash2 className="w-4 h-4 text-rose-400" />
                            <span>Hapus Polygon</span>
                        </Button>
                    </div>
                )}
            </div>

            {/* Quick Guide */}
            <div className="p-3.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-2xl text-xs leading-relaxed font-medium">
                <div className="flex items-center gap-2 font-bold mb-1 text-slate-900 uppercase text-[11px] tracking-wide">
                    <Compass className="w-4 h-4 text-emerald-600" /> Panduan GIS Workspace
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 font-normal text-[11px]">
                    <li>Gunakan <strong>Search Bar</strong> atau paste <strong>Google Maps Link</strong> untuk menemukan lokasi.</li>
                    <li>Gunakan tombol <strong>Polygon / Persegi</strong> di atas untuk mulai menggambar batas lahan.</li>
                    <li>Luas lahan <strong>≤ 50 m² (Free Tier)</strong> bebas ekspor secara gratis. Dapatkan <strong>BikinPolygon Pass</strong> untuk ekspor luas tanpa batas.</li>
                </ul>
            </div>

            {/* Search Location */}
            <div className="space-y-2 relative z-40">
                <Label className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center justify-between">
                    <span>1. Cari Lokasi Lahan</span>
                    <span className="text-[10px] text-slate-400 font-medium">Nominatim GIS</span>
                </Label>
                <div className="flex gap-2">
                    <Input
                        placeholder="Ketik nama kota, kecamatan, atau jalan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="bg-white border border-slate-200 rounded-xl h-11 text-xs focus-visible:ring-[#0F172A] font-medium shadow-sm"
                    />
                    <Button onClick={handleSearch} className="bg-[#0F172A] hover:bg-slate-800 text-[#ADFA1D] font-bold rounded-xl h-11 px-4 shadow-sm" disabled={isSearching}>
                        {isSearching ? <span className="animate-spin">⌛</span> : <Search className="w-4 h-4" />}
                    </Button>
                </div>
                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto mt-1 divide-y divide-slate-100">
                        {searchResults.map((result) => (
                            <div
                                key={result.place_id}
                                className="p-3 hover:bg-emerald-50 cursor-pointer text-xs transition-colors"
                                onClick={() => selectLocation(result)}
                            >
                                <p className="font-bold text-slate-900 line-clamp-1">{result.display_name.split(',')[0]}</p>
                                <p className="text-[10px] text-slate-500 line-clamp-1">{result.display_name}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Google Maps Link Import */}
            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    2. Import dari Google Maps
                </Label>
                <Input
                    placeholder="Paste URL Google Maps (goo.gl / @lat,lng)..."
                    value={url}
                    onChange={(e) => parseUrl(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl h-11 text-xs focus-visible:ring-[#0F172A] font-medium shadow-sm"
                />
            </div>

            {/* Latitude & Longitude Micro-Steppers */}
            <div className="space-y-2 pt-1">
                <Label className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    3. Koordinat Pusat (WGS84)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Latitude (Y)</span>
                        <div className="flex items-center shadow-sm">
                            <Button variant="outline" size="icon" onClick={() => adjustLat(-0.0001)} className="h-9 w-8 rounded-l-xl rounded-r-none border-r-0 bg-slate-100 hover:bg-slate-200" title="Geser Selatan"><ChevronDown className="h-3 w-3" /></Button>
                            <Input 
                                value={lat} 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLat(val);
                                    const parsed = parseFloat(String(val).replace(',', '.'));
                                    const parsedLng = parseFloat(String(lng).replace(',', '.'));
                                    if (!isNaN(parsed) && !isNaN(parsedLng)) setMapCenter([parsed, parsedLng]);
                                }} 
                                className="h-9 text-xs bg-white text-center rounded-none px-1 border-x-0 font-mono font-bold" 
                            />
                            <Button variant="outline" size="icon" onClick={() => adjustLat(0.0001)} className="h-9 w-8 rounded-r-xl rounded-l-none border-l-0 bg-slate-100 hover:bg-slate-200" title="Geser Utara"><ChevronUp className="h-3 w-3" /></Button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Longitude (X)</span>
                        <div className="flex items-center shadow-sm">
                            <Button variant="outline" size="icon" onClick={() => adjustLng(-0.0001)} className="h-9 w-8 rounded-l-xl rounded-r-none border-r-0 bg-slate-100 hover:bg-slate-200" title="Geser Barat"><ChevronLeft className="h-3 w-3" /></Button>
                            <Input 
                                value={lng} 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLng(val);
                                    const parsed = parseFloat(String(val).replace(',', '.'));
                                    const parsedLat = parseFloat(String(lat).replace(',', '.'));
                                    if (!isNaN(parsed) && !isNaN(parsedLat)) setMapCenter([parsedLat, parsed]);
                                }} 
                                className="h-9 text-xs bg-white text-center rounded-none px-1 border-x-0 font-mono font-bold" 
                            />
                            <Button variant="outline" size="icon" onClick={() => adjustLng(0.0001)} className="h-9 w-8 rounded-r-xl rounded-l-none border-l-0 bg-slate-100 hover:bg-slate-200" title="Geser Timur"><ChevronRight className="h-3 w-3" /></Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Area (m²) Stepper & Real-time Status Badge */}
            <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                        4. Luas Area Polygon (m²)
                    </Label>
                    {currentAreaM2 > 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-emerald-600 fill-emerald-500" /> SIAP EKSPOR
                        </span>
                    )}
                </div>
                <div className="flex items-center shadow-sm">
                    <Button variant="outline" size="icon" onClick={() => adjustArea(-10)} className="h-11 w-12 shrink-0 rounded-l-xl rounded-r-none border-r-0 bg-slate-100 hover:bg-slate-200" title="Kurangi 10m²"><Minus className="h-4 w-4 text-slate-700" /></Button>
                    <div className="relative flex-1">
                        <Input
                            type="number"
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            placeholder="0"
                            className="h-11 font-mono font-bold text-center text-base border-x-0 rounded-none w-full bg-white"
                        />
                        <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold pointer-events-none">m²</span>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => adjustArea(10)} className="h-11 w-12 shrink-0 rounded-r-xl rounded-l-none border-l-0 bg-slate-100 hover:bg-slate-200" title="Tambah 10m²"><Plus className="h-4 w-4 text-slate-700" /></Button>
                </div>
            </div>

            {/* AMDALNET & Polygon Metadata Export Panel */}
            <AmdalnetExportPanel 
                existingPolygonGeoJSON={customPolygon?.geojson} 
                onRequireAuth={() => setAuthModalOpen(true)}
                isOpen={metadataModalOpen}
                onOpenChange={setMetadataModalOpen}
            />

            {/* Done For You Banner */}
            <div className="p-4 bg-[#0F172A] rounded-2xl text-white border border-zinc-800 relative overflow-hidden group shadow-lg">
                <div className="absolute top-0 right-0 bg-[#ADFA1D] text-black text-[9px] font-black px-2.5 py-1 rounded-bl-xl uppercase tracking-wider">
                    Jasa Fast Track
                </div>
                <h4 className="font-outfit font-extrabold text-xs text-white uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#ADFA1D]" /> Jasa Pembuatan Polygon WA
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    Bantuan pemetaan lahan komersial & industri. 100% lolos verifikasi sistem OSS RBA & AMDALNET.
                </p>
                <Button asChild size="sm" className="w-full text-xs bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-extrabold h-9 rounded-xl uppercase tracking-wide">
                    <a href="https://wa.me/6288983840979?text=Halo%20Admin,%20saya%20ingin%20menggunakan%20jasa%20pembuatan%20polygon%20Done-For-You." target="_blank" rel="noreferrer">
                        Konsultasi via WA →
                    </a>
                </Button>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-full bg-slate-100 flex flex-col overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#ADFA1D] selection:text-black">
            
            {/* Top Navigation Bar - Sleek Dark Unbox Aesthetic (h-16) */}
            <header className="z-30 bg-[#0F172A] border-b border-zinc-800 text-white h-16 flex-none px-4 sm:px-6 flex justify-between items-center relative">
                <div className="flex items-center gap-3">
                    {/* Desktop Sidebar Toggle Button */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="hidden md:flex h-9 w-9 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-slate-300"
                        title={sidebarOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
                    >
                        {sidebarOpen ? <PanelLeftClose className="w-4 h-4 text-slate-300" /> : <PanelLeft className="w-4 h-4 text-slate-300" />}
                    </Button>

                    <div className="flex items-center gap-2.5 font-outfit font-extrabold text-xl tracking-tight text-white">
                        <div className="w-8 h-8 rounded-full bg-[#ADFA1D] flex items-center justify-center text-black shadow-[0_0_15px_rgba(173,250,29,0.3)]">
                            <img src="/assets/logo.svg" alt="Logo" className="w-4 h-4 filter invert" />
                        </div>
                        <span className="hidden sm:inline">Bikin<span className="text-[#ADFA1D]">Polygon</span></span>
                        <span className="text-[10px] bg-[#ADFA1D]/10 text-[#ADFA1D] font-mono font-bold px-2 py-0.5 rounded-full border border-[#ADFA1D]/20">v2.0</span>
                    </div>

                    <nav className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-400 ml-4 border-l border-zinc-800 pl-4">
                        <a href={import.meta.env.VITE_MARKETING_URL || 'http://localhost:5173'} className="hover:text-[#ADFA1D] transition-colors flex items-center gap-1">
                            <ArrowLeft className="w-3.5 h-3.5" /> Landing Page
                        </a>
                        <span className="text-white font-bold bg-zinc-800 px-3 py-1 rounded-full text-[11px]">GIS Workspace</span>
                    </nav>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3">
                    <a
                        href="https://wa.me/6288983840979?text=Halo%20Admin,%20saya%20butuh%20bantuan%20mengenai%20web%20app%20BikinPolygon."
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-outfit font-extrabold rounded-full text-xs h-8 px-3.5 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm hover:scale-105 active:scale-95"
                        title="Chat Bantuan WhatsApp Admin"
                    >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                        <span>Chat Admin</span>
                    </a>

                    <Button
                        onClick={() => setPaymentModalOpen(true)}
                        size="sm"
                        className="bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-outfit font-extrabold rounded-full text-xs h-8 px-4 shadow-[0_0_15px_rgba(173,250,29,0.3)] transition-all flex items-center gap-1.5"
                    >
                        <Zap className="w-3.5 h-3.5 fill-black text-black" /> Paket Akses
                    </Button>

                    {/* Auth Actions */}
                    {user ? (
                        <>
                            {/* Status Indicator: SUDAH LOGIN */}
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium text-slate-300">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="truncate max-w-[140px] font-mono text-[11px]">{user.email}</span>
                            </div>

                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={logout} 
                                className="text-slate-400 hover:text-white hover:bg-zinc-800 font-medium border border-zinc-800 rounded-full text-xs h-8 px-3"
                                title="Keluar dari akun"
                            >
                                <LogOut className="w-3.5 h-3.5 sm:mr-1" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            {/* Status Indicator: BELUM LOGIN */}
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[11px] font-medium text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                <span>Belum Login</span>
                            </div>

                            <Button 
                                onClick={() => setAuthModalOpen(true)} 
                                size="sm" 
                                className="bg-zinc-800 hover:bg-zinc-700 text-white font-outfit font-bold rounded-full text-xs h-8 px-4 flex items-center gap-1.5 transition-all border border-zinc-700"
                            >
                                <LogIn className="w-3.5 h-3.5 text-[#ADFA1D]" /> Masuk / Daftar
                            </Button>
                        </div>
                    )}

                    {/* Mobile Drawer Open Button */}
                    <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => setMobileDrawerOpen(true)}
                        className="md:hidden border border-zinc-800 rounded-xl h-9 w-9 bg-zinc-900 text-white"
                        title="Buka Control Panel"
                    >
                        <Menu className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            {/* Main GIS Layout Container */}
            <div className="flex-1 relative flex overflow-hidden min-h-0">

                {/* DESKTOP LEFT SIDEBAR (Control Center) */}
                <aside 
                    className={`hidden md:flex flex-col bg-white border-r border-slate-200 z-20 transition-all duration-300 ease-in-out shrink-0 ${
                        sidebarOpen ? 'w-[360px] lg:w-[400px]' : 'w-0 overflow-hidden'
                    }`}
                >
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-2 font-outfit font-bold text-xs uppercase tracking-wider text-slate-800">
                            <Layers className="w-4 h-4 text-emerald-600" /> GIS Control Panel
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ WGS84 Validated
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <ControlsPanelContent />
                    </div>
                </aside>

                {/* CENTRAL MAP WORKSPACE */}
                <main className="flex-1 relative w-full h-full min-h-0 overflow-hidden bg-slate-200">
                    <div id="map-container" className="absolute inset-0 z-0 w-full h-full">
                        <ErrorBoundary key={resetMapTrigger}>
                            <DigitasiMap
                                center={mapCenter}
                                zoom={mapCenter ? 17 : 5}
                                onPolygonChange={handlePolygonChange}
                                onDownload={handleGenerate}
                                manualLat={lat}
                                manualLng={lng}
                                manualArea={area}
                                resetTrigger={resetMapTrigger}
                                onMapReady={setMapInstance}
                                onRegisterDrawTools={setDrawTools}
                                onDrawStateChange={setDrawState}
                            />
                        </ErrorBoundary>
                    </div>

                    {/* Floating Status Bar Overlay on Top of Map */}
                    <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2 pointer-events-none">
                        <div className="bg-[#0F172A]/90 backdrop-blur-md border border-zinc-800 rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-xl pointer-events-auto flex items-center gap-2">
                            <span>📐 Luas Area:</span>
                            <span className="font-mono text-[#ADFA1D] font-extrabold">{currentAreaM2 ? `${currentAreaM2.toFixed(1)} m²` : '0 m²'}</span>
                        </div>
                    </div>

                    {/* Floating Polygon Ready Download Banner */}
                    {customPolygon && !drawState.isDrawing && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-[#0F172A]/90 backdrop-blur-md border border-[#ADFA1D]/50 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
                            <Sparkles className="w-4 h-4 text-[#ADFA1D] shrink-0" />
                            <span className="text-xs font-bold font-outfit truncate max-w-[180px] sm:max-w-xs">
                                Polygon Tergambar ({area} m²)
                            </span>
                            <Button 
                                size="sm" 
                                onClick={handleGenerate} 
                                className="bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-outfit font-extrabold text-xs h-7 px-3.5 rounded-full flex items-center gap-1 shadow-md shrink-0 transition-all hover:scale-105"
                            >
                                <Download className="w-3.5 h-3.5" /> Download SHP / PDF
                            </Button>
                        </div>
                    )}

                    {/* Floating Active Drawing Action Dock on Mobile */}
                    {drawState.isDrawing && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex md:hidden items-center gap-1.5 bg-[#0F172A] text-white p-2.5 rounded-full border border-zinc-800 shadow-2xl animate-in slide-in-from-bottom duration-300">
                            {drawState.mode === 'polygon' && (
                                <>
                                    <Button
                                        onClick={() => drawTools?.finishShape()}
                                        type="button"
                                        size="sm"
                                        className="bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-extrabold text-xs h-9 px-4 rounded-full shadow-md"
                                    >
                                        <Check className="w-4 h-4 mr-1" /> Selesai
                                    </Button>
                                    <Button
                                        onClick={() => drawTools?.deleteLastPoint()}
                                        type="button"
                                        size="sm"
                                        className="bg-zinc-800 text-white font-bold text-xs h-9 px-3 rounded-full border border-zinc-700"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 mr-1" /> Hapus Titik
                                    </Button>
                                </>
                            )}
                            <Button
                                onClick={() => drawTools?.cancelDraw()}
                                type="button"
                                size="sm"
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-3 rounded-full shadow-md"
                            >
                                <X className="w-4 h-4 mr-1" /> Batal
                            </Button>
                        </div>
                    )}
                </main>

                {/* MOBILE BOTTOM DRAWER / SLIDE-OVER SHEET */}
                {mobileDrawerOpen && (
                    <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-t-3xl border-t border-slate-200 max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
                                <div className="flex items-center gap-2 font-outfit font-extrabold text-sm uppercase text-slate-900">
                                    <Layers className="w-4 h-4 text-emerald-600" /> GIS Control Panel
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setMobileDrawerOpen(false)} className="h-8 w-8 rounded-full border border-slate-200">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <ControlsPanelContent />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* STICKY BOTTOM ACTION BAR */}
            <footer className="z-30 bg-[#0F172A] border-t border-zinc-800 px-4 py-3 sm:px-6 flex justify-between items-center text-white shadow-2xl">
                <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1.5 text-[#ADFA1D] bg-[#ADFA1D]/10 px-3 py-1 rounded-full border border-[#ADFA1D]/20 font-mono text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Format ZIP SHP Standar OSS RBA (EPSG:4326)
                    </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button 
                        onClick={handleGeneratePDF}
                        disabled={loading || pdfLoading}
                        className="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 text-white font-outfit font-extrabold rounded-full h-11 px-6 text-xs uppercase border border-zinc-700 transition-all"
                    >
                        <FileText className="w-4 h-4 mr-2 text-[#ADFA1D]" />
                        {pdfLoading ? "Mencetak..." : "Cetak Laporan PDF"}
                    </Button>
                </div>
            </footer>

            {/* Payment Modal for Pakasir Access Plans */}
            <PaymentModal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} />

            {/* Auth Modal for Unauthenticated Users */}
            <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
        </div>
    );
}
