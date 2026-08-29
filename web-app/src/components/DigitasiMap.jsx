import React, { useState, useRef, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
window.L = L;
import 'leaflet-draw';
import { MapContainer, TileLayer, WMSTileLayer, useMap, Marker, Popup, Polygon as LeafletPolygon } from 'react-leaflet';
import * as turf from '@turf/turf';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { BASEMAPS, DEFAULT_BASEMAP_ID } from '@/config/basemaps';
import {
    MapPin,
    Map as MapIcon,
    Layers,
    Square,
    CheckSquare,
    Download,
    Info,
    CheckCircle2,
    Zap,
    ChevronUp,
    ChevronDown,
    Trash2
} from 'lucide-react';
import DisclaimerModal from './DisclaimerModal';

// Fix Leaflet Default Icon 404
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController({ onReady, center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (map) {
            onReady(map);
            const t1 = setTimeout(() => {
                try { if (map && map.invalidateSize) map.invalidateSize(); } catch (e) {}
            }, 150);
            const t2 = setTimeout(() => {
                try { if (map && map.invalidateSize) map.invalidateSize(); } catch (e) {}
            }, 500);
            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
            };
        }
    }, [map, onReady]);

    useEffect(() => {
        if (center && map) {
            try {
                map.flyTo(center, zoom || 18);
                setTimeout(() => {
                    if (map && map.invalidateSize) map.invalidateSize();
                }, 250);
            } catch (e) {
                console.warn("flyTo error:", e);
            }
        }
    }, [center, zoom, map]);

    return null;
}

export default function DigitasiMap({ 
    center, 
    zoom, 
    onPolygonChange, 
    onDownload, 
    manualLat, 
    manualLng, 
    manualArea, 
    resetTrigger, 
    onMapReady,
    onRegisterDrawTools,
    onDrawStateChange
}) {
    const [mapInstance, setMapInstance] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        if (mapInstance && onMapReady) {
            onMapReady(mapInstance);
        }
    }, [mapInstance, onMapReady]);

    // Multi-Basemap & BPN State
    const [activeBasemapId, setActiveBasemapId] = useState(DEFAULT_BASEMAP_ID);
    const [showBasemapSelector, setShowBasemapSelector] = useState(false);
    const [isBpnActive, setIsBpnActive] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    // Active Draw Handler Ref & State
    const activeHandlerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [activeDrawMode, setActiveDrawMode] = useState(null); // 'polygon' | 'rectangle' | null

    // Get active basemap config
    const activeBasemap = BASEMAPS.find(b => b.id === activeBasemapId) || BASEMAPS[0];

    // Draw State
    const [drawnItems] = useState(() => new L.FeatureGroup());
    const [areaInfo, setAreaInfo] = useState(null);
    const [hasDrawnPolygon, setHasDrawnPolygon] = useState(false);
    const [previewPoints, setPreviewPoints] = useState(null);

    const onDrawStateChangeRef = useRef(onDrawStateChange);
    useEffect(() => {
        onDrawStateChangeRef.current = onDrawStateChange;
    }, [onDrawStateChange]);

    const stopCurrentDraw = () => {
        const handler = activeHandlerRef.current;
        activeHandlerRef.current = null;
        if (handler) {
            setTimeout(() => {
                try {
                    if (handler._enabled && typeof handler.disable === 'function') {
                        handler.disable();
                    }
                } catch (e) {
                    console.warn("Error disabling draw handler:", e);
                }
            }, 0);
        }
        setIsDrawing(false);
        setActiveDrawMode(null);
        if (onDrawStateChangeRef.current) {
            onDrawStateChangeRef.current({ isDrawing: false, mode: null });
        }
    };

    // Register external draw trigger methods for Sidebar & Mobile Drawer
    useEffect(() => {
        if (mapInstance && onRegisterDrawTools) {
            onRegisterDrawTools({
                startPolygon: () => {
                    if (!mapInstance) return;
                    stopCurrentDraw();
                    if (drawnItems) {
                        try { drawnItems.clearLayers(); } catch (e) {}
                    }
                    try {
                        const handler = new L.Draw.Polygon(mapInstance, {
                            allowIntersection: true,
                            showArea: true,
                            shapeOptions: { color: 'red', weight: 3, fillOpacity: 0.2 }
                        });
                        activeHandlerRef.current = handler;
                        handler.enable();
                        setIsDrawing(true);
                        setActiveDrawMode('polygon');
                        if (onDrawStateChangeRef.current) {
                            onDrawStateChangeRef.current({ isDrawing: true, mode: 'polygon' });
                        }
                    } catch (err) {
                        console.error("Start Polygon Error", err);
                    }
                },
                startRectangle: () => {
                    if (!mapInstance) return;
                    stopCurrentDraw();
                    if (drawnItems) {
                        try { drawnItems.clearLayers(); } catch (e) {}
                    }
                    try {
                        const handler = new L.Draw.Rectangle(mapInstance, {
                            shapeOptions: { color: 'red', weight: 3, fillOpacity: 0.2 }
                        });
                        activeHandlerRef.current = handler;
                        handler.enable();
                        setIsDrawing(true);
                        setActiveDrawMode('rectangle');
                        if (onDrawStateChangeRef.current) {
                            onDrawStateChangeRef.current({ isDrawing: true, mode: 'rectangle' });
                        }
                    } catch (err) {
                        console.error("Start Rectangle Error", err);
                    }
                },
                finishShape: () => {
                    if (activeHandlerRef.current) {
                        const h = activeHandlerRef.current;
                        try {
                            if (typeof h.completeShape === 'function') {
                                h.completeShape();
                            } else if (typeof h._completeShape === 'function') {
                                h._completeShape();
                            } else if (typeof h._finishShape === 'function') {
                                h._finishShape();
                            } else if (typeof h.finishShape === 'function') {
                                h.finishShape();
                            }
                        } catch (e) {
                            console.error("Error completing shape", e);
                        }
                    }
                },
                deleteLastPoint: () => {
                    if (activeHandlerRef.current) {
                        const h = activeHandlerRef.current;
                        try {
                            if (typeof h.deleteLastVertex === 'function') {
                                h.deleteLastVertex();
                            } else if (typeof h._deleteLastVertex === 'function') {
                                h._deleteLastVertex();
                            }
                        } catch (e) {
                            console.error("Error deleting vertex", e);
                        }
                    }
                },
                cancelDraw: () => {
                    stopCurrentDraw();
                },
                clear: () => {
                    stopCurrentDraw();
                    if (drawnItems) {
                        try {
                            drawnItems.clearLayers();
                        } catch (e) {}
                        setAreaInfo(null);
                        setHasDrawnPolygon(false);
                        if (onPolygonChangeRef.current) {
                            onPolygonChangeRef.current(null);
                        }
                    }
                }
            });
        }
    }, [mapInstance, drawnItems, onRegisterDrawTools]);

    // Effect to generate live preview of the square based on manual inputs
    useEffect(() => {
        if (hasDrawnPolygon) {
            setPreviewPoints(null);
            return;
        }

        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);
        const area = parseFloat(manualArea);

        if (!isNaN(lat) && !isNaN(lng) && !isNaN(area) && area > 0) {
            try {
                const sideMeters = Math.sqrt(area);
                const halfSide = sideMeters / 2;
                const DEG_TO_RAD = Math.PI / 180;
                
                const dLat = halfSide / 111320;
                const dLng = halfSide / (111320 * Math.cos(lat * DEG_TO_RAD));

                const mX = lng - dLng;
                const MX = lng + dLng;
                const mY = lat - dLat;
                const MY = lat + dLat;

                const points = [
                    [MY, mX], // Top-Left
                    [MY, MX], // Top-Right
                    [mY, MX], // Bottom-Right
                    [mY, mX]  // Bottom-Left
                ];
                
                setPreviewPoints(points);
            } catch (e) {
                setPreviewPoints(null);
            }
        } else {
            setPreviewPoints(null);
        }
    }, [manualLat, manualLng, manualArea, hasDrawnPolygon]);

    // Effect to handle map reset
    useEffect(() => {
        if (resetTrigger > 0 && drawnItems) {
            stopCurrentDraw();
            try {
                drawnItems.clearLayers();
            } catch (e) {}
            setAreaInfo(null);
            setHasDrawnPolygon(false);
            if (onPolygonChangeRef.current) {
                onPolygonChangeRef.current(null);
            }
        }
    }, [resetTrigger, drawnItems]);

    // UseRef for callback stability
    const onPolygonChangeRef = useRef(onPolygonChange);
    useEffect(() => {
        onPolygonChangeRef.current = onPolygonChange;
    }, [onPolygonChange]);

    useEffect(() => {
        if (!mapInstance) return;

        try {
            if (!mapInstance.hasLayer(drawnItems)) {
                mapInstance.addLayer(drawnItems);
            }
        } catch (e) {
            console.warn("Add layer error:", e);
        }

const FREE_TIER_LIMIT_M2 = 50;

        const updateArea = () => {
            let totalSqMeters = 0;
            let count = 0;
            let lastGeo = null;

            try {
                drawnItems.eachLayer((l) => {
                    if (l && l.toGeoJSON) {
                        try {
                            const geo = l.toGeoJSON();
                            if (geo && geo.geometry && (geo.geometry.type === 'Polygon' || geo.geometry.type === 'MultiPolygon')) {
                                const a = turf.area(geo);
                                if (!isNaN(a) && a > 0) {
                                    totalSqMeters += a;
                                    count++;
                                    lastGeo = geo;
                                }
                            }
                        } catch (err) {
                            console.warn("Turf area calculation warning:", err);
                        }
                    }
                });
            } catch (err) {
                console.warn("eachLayer iteration warning:", err);
            }

            const totalHectares = totalSqMeters / 10000;
            const isSmall = totalSqMeters <= FREE_TIER_LIMIT_M2;
            const info = count > 0 ? { m2: totalSqMeters, ha: totalHectares, isFree: isSmall } : null;
            setAreaInfo(info);
            setHasDrawnPolygon(count > 0);

            if (onPolygonChangeRef.current) {
                try {
                    let coords = null;
                    if (lastGeo && lastGeo.geometry && lastGeo.geometry.coordinates) {
                        coords = lastGeo.geometry.coordinates[0];
                    }

                    onPolygonChangeRef.current({
                        area: totalSqMeters,
                        coordinates: coords,
                        geojson: drawnItems.toGeoJSON(),
                        isFree: isSmall
                    });
                } catch (err) {
                    console.error("Error calling onPolygonChange:", err);
                }
            }
        };

        const onCreated = (e) => {
            try {
                const layer = e.layer;
                if (!layer) return;
                drawnItems.clearLayers(); // Enforce single polygon mode
                drawnItems.addLayer(layer);
                updateArea();

                stopCurrentDraw();

                let area = 0;
                try {
                    const geo = layer.toGeoJSON();
                    if (geo && geo.geometry && (geo.geometry.type === 'Polygon' || geo.geometry.type === 'MultiPolygon')) {
                        area = turf.area(geo);
                    }
                } catch (err) {
                    console.warn("onCreated area calculation warning:", err);
                }

                try {
                    layer.bindPopup(`
                        <div style="font-size: 12px; font-family: sans-serif; padding: 4px; text-align: center;">
                            <div style="font-weight: bold; color: #0F172A; font-size: 13px;">Luas Area: ${area.toFixed(2)} m²</div>
                            <div style="color: #16a34a; font-weight: bold; margin-top: 2px; font-size: 11px;">✓ Polygon Siap Ekspor</div>
                            <div style="display: flex; gap: 6px; margin-top: 8px;">
                                <button onclick="if(window.handleOpenExportModal) window.handleOpenExportModal();" style="flex: 1; background: #ADFA1D; color: #000; border: none; padding: 7px 8px; border-radius: 8px; font-weight: 800; font-size: 11px; cursor: pointer; text-transform: uppercase; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                                    ⚡ Download
                                </button>
                                <button onclick="if(window.handleClearPolygon) window.handleClearPolygon();" style="background: #ef4444; color: #fff; border: none; padding: 7px 10px; border-radius: 8px; font-weight: 700; font-size: 11px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                                    🗑️ Hapus
                                </button>
                            </div>
                        </div>
                    `);
                    setTimeout(() => {
                        try { layer.openPopup(); } catch (e) {}
                    }, 100);
                } catch (e) {
                    console.warn("bindPopup warning:", e);
                }
            } catch (err) {
                console.error("Error in onCreated handler:", err);
            }
        };

        const onDeleted = () => {
            try {
                updateArea();
            } catch (e) {}
        };

        const onDrawStop = () => {
            setIsDrawing(false);
            setActiveDrawMode(null);
            if (onDrawStateChangeRef.current) {
                onDrawStateChangeRef.current({ isDrawing: false, mode: null });
            }
        };

        mapInstance.on('draw:created', onCreated);
        mapInstance.on('draw:edited', updateArea);
        mapInstance.on('draw:deleted', onDeleted);
        mapInstance.on('draw:drawstop', onDrawStop);

        if (L.Draw && L.Draw.Event) {
            mapInstance.on(L.Draw.Event.CREATED, onCreated);
            mapInstance.on(L.Draw.Event.EDITED, updateArea);
            mapInstance.on(L.Draw.Event.DELETED, onDeleted);
            mapInstance.on(L.Draw.Event.DRAWSTOP, onDrawStop);
        }

        return () => {
            try {
                mapInstance.off('draw:created', onCreated);
                mapInstance.off('draw:edited', updateArea);
                mapInstance.off('draw:deleted', onDeleted);
                mapInstance.off('draw:drawstop', onDrawStop);

                if (L.Draw && L.Draw.Event) {
                    mapInstance.off(L.Draw.Event.CREATED, onCreated);
                    mapInstance.off(L.Draw.Event.EDITED, updateArea);
                    mapInstance.off(L.Draw.Event.DELETED, onDeleted);
                    mapInstance.off(L.Draw.Event.DRAWSTOP, onDrawStop);
                }
            } catch (e) {}
        };
    }, [mapInstance, drawnItems]);

    // Button Handlers
    const handleLocateMe = () => {
        if (!mapInstance) return;
        try {
            mapInstance.locate({ setView: true, maxZoom: 18 });
            mapInstance.once('locationfound', (e) => {
                try {
                    L.circle(e.latlng, e.accuracy).addTo(mapInstance);
                } catch (err) {}
            });
        } catch (err) {
            console.warn("locate error:", err);
        }
    };

    return (
        <div className="relative w-full h-full min-h-[300px]">
            {/* CSS override to hide default floating Leaflet Draw toolbar and action submenus */}
            <style>{`
                .leaflet-draw, 
                .leaflet-draw-toolbar, 
                .leaflet-draw-actions {
                    display: none !important;
                }
            `}</style>

            <MapContainer
                center={[-2.548926, 118.014863]}
                zoom={5}
                zoomControl={false}
                style={{ width: '100%', height: '100%' }}
            >
                <MapController onReady={setMapInstance} center={center} zoom={zoom} />

                {/* Base Map Layer */}
                <TileLayer
                    key={activeBasemap.id}
                    url={activeBasemap.url}
                    attribution={activeBasemap.attribution}
                    maxZoom={activeBasemap.maxZoom || 19}
                    subdomains={activeBasemap.subdomains || []}
                />

                {/* BPN Overlay Layer */}
                {isBpnActive && (
                    <WMSTileLayer
                        url="https://bhumi.atrbpn.go.id/geoserver/gwc/service/wms"
                        layers="persil"
                        format="image/png"
                        transparent={true}
                        version="1.1.1"
                    />
                )}

                {/* Manual Input Preview Polygon */}
                {previewPoints && !hasDrawnPolygon && (
                    <LeafletPolygon
                        positions={previewPoints}
                        pathOptions={{
                            color: '#3b82f6',
                            dashArray: '5, 10',
                            weight: 2,
                            fillOpacity: 0.15
                        }}
                    />
                )}
            </MapContainer>

            {/* Custom Control Buttons (Top-Right) */}
            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 pointer-events-auto">
                {/* Multi-Basemap Selector Trigger */}
                <div className="relative">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="bg-white hover:bg-slate-100 text-slate-800 shadow-md border-2 border-black rounded-xl h-10 w-10"
                        onClick={() => setShowBasemapSelector(!showBasemapSelector)}
                        title="Ganti Basemap"
                    >
                        <Layers className="w-5 h-5 text-[#1D4ED8]" />
                    </Button>

                    {/* Basemap Options Dropdown */}
                    {showBasemapSelector && (
                        <div className="absolute top-12 right-0 bg-white border-2 border-black rounded-2xl shadow-2xl p-3 w-64 space-y-2 z-50">
                            <div className="text-xs font-black uppercase text-slate-800 border-b pb-1 flex justify-between items-center">
                                <span>Pilih Basemap Peta</span>
                                <span className="text-[10px] text-slate-400 font-mono">10+ Basemap</span>
                            </div>
                            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                                {BASEMAPS.map((bm) => (
                                    <button
                                        key={bm.id}
                                        onClick={() => {
                                            setActiveBasemapId(bm.id);
                                            setShowBasemapSelector(false);
                                            toast({ title: `Basemap Aktif: ${bm.name}` });
                                        }}
                                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                                            activeBasemapId === bm.id
                                                ? 'bg-[#1D4ED8] text-white shadow-sm'
                                                : 'text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <span className="truncate">{bm.name}</span>
                                        {bm.badge && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                                                activeBasemapId === bm.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                            }`}>
                                                {bm.badge}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* BPN Layer Toggle */}
                            <div className="border-t pt-2 mt-2">
                                <button
                                    onClick={() => {
                                        setIsBpnActive(!isBpnActive);
                                        setShowDisclaimer(true);
                                    }}
                                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border-2 ${
                                        isBpnActive 
                                            ? 'bg-amber-500 text-black border-black shadow-sm' 
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" /> Overlay Persil BPN
                                    </span>
                                    <span className="text-[10px] uppercase font-black">{isBpnActive ? 'ON' : 'OFF'}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* My Location Button */}
                <Button
                    variant="secondary"
                    size="icon"
                    className="bg-white hover:bg-slate-100 text-slate-800 shadow-md border-2 border-black rounded-xl h-10 w-10"
                    onClick={handleLocateMe}
                    title="Lokasi Saya"
                >
                    <MapPin className="w-5 h-5 text-red-600" />
                </Button>

                {/* Delete Polygon Floating Button */}
                {hasDrawnPolygon && (
                    <Button
                        variant="destructive"
                        size="icon"
                        className="bg-rose-600 hover:bg-rose-700 text-white shadow-md border-2 border-black rounded-xl h-10 w-10 animate-in zoom-in duration-200 cursor-pointer"
                        onClick={() => {
                            if (window.handleClearPolygon) window.handleClearPolygon();
                        }}
                        title="Hapus Polygon"
                    >
                        <Trash2 className="w-5 h-5 text-white" />
                    </Button>
                )}
            </div>

            {/* Disclaimer Modal for BPN */}
            <DisclaimerModal open={showDisclaimer} onOpenChange={setShowDisclaimer} />
        </div>
    );
}
