import React, { useState, useRef, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
window.L = L;
import 'leaflet-draw';
import { MapContainer, TileLayer, WMSTileLayer, useMap, Marker, Popup } from 'react-leaflet';
import * as turf from '@turf/turf';
import { download } from 'shp-write';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
    MapPin,
    Map as MapIcon,
    Layers,
    Square,
    CheckSquare,
    Download,
    Info // For instruction icon
} from 'lucide-react';
import DisclaimerModal from './DisclaimerModal';


// Fix Leaflet Default Icon 404
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Translation for Leaflet Draw (Indonesian) safely
try {
    if (L.drawLocal) {
        L.drawLocal.draw.toolbar.buttons.polygon = 'Gambar Polygon';
        L.drawLocal.draw.toolbar.buttons.rectangle = 'Gambar Kotak';
        L.drawLocal.draw.handlers.polygon.tooltip.start = 'Klik untuk mulai menggambar';
        L.drawLocal.draw.handlers.polygon.tooltip.cont = 'Klik untuk lanjut menggambar';
        L.drawLocal.draw.handlers.polygon.tooltip.end = 'Klik titik awal untuk selesai';
        L.drawLocal.edit.toolbar.actions.save = { title: 'Simpan perubahan', text: 'Simpan' };
        L.drawLocal.edit.toolbar.actions.cancel = { title: 'Batalkan edit', text: 'Batal' };
        L.drawLocal.edit.toolbar.buttons.edit = 'Edit Polygon';
        L.drawLocal.edit.toolbar.buttons.remove = 'Hapus Polygon';
    }
} catch (e) {
    console.warn("Leaflet Draw translation failed", e);
}

function MapController({ onReady, center, zoom }) {
    const map = useMap();
    useEffect(() => {
        onReady(map);
    }, [map, onReady]);
    useEffect(() => {
        if (center) map.flyTo(center, zoom || 18);
    }, [center, zoom, map]);
    return null;
}

export default function DigitasiMap({ center, zoom, onPolygonChange, onDownload }) {
    const [mapInstance, setMapInstance] = useState(null);
    const { toast } = useToast();

    // Basemap & BPN State
    const [isSatellite, setIsSatellite] = useState(true);
    const [isBpnActive, setIsBpnActive] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    // Draw State
    const [drawnItems] = useState(new L.FeatureGroup());
    const [areaInfo, setAreaInfo] = useState(null);

    // UseRef for callback stability
    const onPolygonChangeRef = useRef(onPolygonChange);
    useEffect(() => {
        onPolygonChangeRef.current = onPolygonChange;
    }, [onPolygonChange]);

    useEffect(() => {
        if (!mapInstance) return;

        // Ensure drawnItems are added only once
        if (!mapInstance.hasLayer(drawnItems)) {
            mapInstance.addLayer(drawnItems);
        }

        let drawControl;
        try {
            drawControl = new L.Control.Draw({
                position: 'topleft',
                draw: {
                    polygon: {
                        allowIntersection: true, // Allow intersection so user can freely draw many points
                        showArea: true,
                        shapeOptions: {
                            color: 'red',
                            weight: 3,
                            fillOpacity: 0.2
                        }
                    },
                    rectangle: {
                        shapeOptions: {
                            color: 'red',
                            weight: 3,
                            fillOpacity: 0.2
                        }
                    },
                    circle: false,
                    marker: false,
                    circlemarker: false,
                    polyline: false
                },
                edit: {
                    featureGroup: drawnItems,
                    edit: false, // Set to false to avoid the selectedPathOptions error
                    remove: true // Allows deleting polygons
                }
            });
            mapInstance.addControl(drawControl);
        } catch (e) {
            console.error("Failed to initialize Leaflet Draw", e);
            toast({ title: "Error", description: "Gagal memuat alat gambar peta.", variant: "destructive" });
        }

        // Update Logic
        const updateArea = () => {
            let totalSqMeters = 0;
            let count = 0;
            drawnItems.eachLayer((l) => {
                if (l.toGeoJSON) {
                    const geo = l.toGeoJSON();
                    totalSqMeters += turf.area(geo);
                    count++;
                }
            });

            const totalHectares = totalSqMeters / 10000;
            const info = count > 0 ? { m2: totalSqMeters, ha: totalHectares } : null;
            setAreaInfo(info);

            if (onPolygonChangeRef.current) {
                let lastGeo = null;
                const layers = drawnItems.getLayers();
                if (layers.length > 0) {
                    lastGeo = layers[layers.length - 1].toGeoJSON();
                }

                onPolygonChangeRef.current({
                    area: totalSqMeters,
                    coordinates: lastGeo ? lastGeo.geometry.coordinates[0] : null,
                    geojson: drawnItems.toGeoJSON()
                });
            }
        };

        // Event Listeners
        const onCreated = (e) => {
            const layer = e.layer;
            drawnItems.addLayer(layer);
            updateArea();

            const geo = layer.toGeoJSON();
            const area = turf.area(geo);
            const ha = area / 10000;

            layer.bindPopup(`Luas: <b>${ha.toFixed(4)} Ha</b>`).openPopup();
        };

        const onDeleted = () => {
            updateArea();
        };

        mapInstance.on(L.Draw.Event.CREATED, onCreated);
        mapInstance.on(L.Draw.Event.DELETED, onDeleted);

        return () => {
            if (drawControl) mapInstance.removeControl(drawControl);
            mapInstance.off(L.Draw.Event.CREATED, onCreated);
            mapInstance.off(L.Draw.Event.DELETED, onDeleted);
        };
    }, [mapInstance, drawnItems]); // Removed onPolygonChange from dependency

    // Button Handlers
    const handleLocateMe = () => {
        if (!mapInstance) return;
        mapInstance.locate({ setView: true, maxZoom: 18 });
        mapInstance.once('locationfound', (e) => {
            L.circle(e.latlng, e.accuracy).addTo(mapInstance);
        });
    };

    const handleDownload = () => {
        if (drawnItems.getLayers().length === 0) {
            toast({ title: "Error", description: "Belum ada polygon.", variant: "destructive" });
            return;
        }
        if (onDownload) {
            onDownload();
        } else {
            toast({ title: "Info", description: "Fitur download sedang diperbaiki." });
        }
    };

    return (
        <div className="relative w-full h-full bg-slate-100 overflow-hidden">
            <MapContainer
                center={center || [-2.5489, 118.0149]}
                zoom={zoom || 5}
                style={{ height: "100%", width: "100%" }}
                zoomControl={true} // Enable Standard Zoom Control
            >
                <MapController onReady={setMapInstance} center={center} zoom={zoom} />

                {/* Basemaps */}
                {isSatellite ? (
                    <TileLayer
                        attribution='&copy; Google Maps'
                        url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                        maxZoom={22}
                    />
                ) : (
                    <TileLayer
                        attribution='&copy; Google Maps'
                        url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                        maxZoom={22}
                    />
                )}

                {/* BPN Layer */}
                {isBpnActive && (
                    <WMSTileLayer
                        url="https://bhumi.atrbpn.go.id/arcgis/rest/services/Peta_Bidang_Tanah/MapServer/WMTS"
                        layers="0"
                        format="image/png"
                        transparent={true}
                        attribution="ATR/BPN"
                        zIndex={10}
                    />
                )}

                {center && <Marker position={center}><Popup>Lokasi</Popup></Marker>}
            </MapContainer>

            {/* Top Right Badge "Polygon Custom Aktif" */}
            <div className="absolute top-4 right-16 z-[1000]">
                <div className="bg-green-600 text-white px-3 py-1 rounded-full shadow-md text-xs font-bold flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Polygon Custom Aktif
                </div>
            </div>

            {/* Top Center Area Badge */}
            {areaInfo && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur shadow-md px-4 py-2 rounded-full z-[1000] flex items-center gap-2 border border-slate-200">
                    <span className="text-sm font-bold text-slate-800">{areaInfo.ha.toFixed(4)} Ha</span>
                    <span className="text-xs text-slate-500">({areaInfo.m2.toFixed(0)} m²)</span>
                </div>
            )}

            {/* Bottom Left Instructions Overlay */}
            <div className="absolute bottom-6 left-2 z-[1000] w-64 bg-slate-900/90 text-white p-4 rounded-lg shadow-xl backdrop-blur-sm border border-slate-700 pointer-events-none sm:pointer-events-auto opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold border-b border-slate-700 pb-2">
                    <Info className="w-4 h-4" />
                    <span className="text-sm">Petunjuk Menggambar:</span>
                </div>
                <ul className="text-xs space-y-2 text-slate-300 list-disc pl-4">
                    <li>Klik ikon <strong>Polygon</strong> atau <strong>Kotak</strong> di kiri atas.</li>
                    <li>Klik di peta untuk menambah titik sudut.</li>
                    <li>Klik titik pertama lagi untuk menutup area.</li>
                    <li>Gunakan ikon <strong>Hapus</strong> untuk menghapus bentuk.</li>
                </ul>
            </div>

            {/* Floating Action Buttons (Right Side Only - Cleaned up) */}
            <div className="absolute bottom-8 right-6 z-[1000] flex flex-col items-end gap-3">
                {/* Download Button */}
                {areaInfo && (
                    <Button
                        size="icon"
                        className="rounded-full w-12 h-12 shadow-lg bg-green-600 hover:bg-green-700 text-white transform hover:scale-105 transition-transform"
                        onClick={handleDownload}
                        title="Download SHP"
                    >
                        <Download className="h-5 w-5" />
                    </Button>
                )}

                {/* Basemap Toggle */}
                <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full w-10 h-10 shadow bg-white text-slate-700 hover:bg-slate-100"
                    onClick={() => setIsSatellite(!isSatellite)}
                    title="Ganti Basemap"
                >
                    {isSatellite ? <MapIcon className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                </Button>

                {/* BPN Toggle */}
                <Button
                    size="icon"
                    variant={isBpnActive ? "default" : "secondary"}
                    className={`rounded-full w-10 h-10 shadow transition-colors ${isBpnActive ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-white text-slate-700 hover:bg-slate-100"}`}
                    onClick={() => isBpnActive ? setIsBpnActive(false) : setShowDisclaimer(true)}
                    title="Layer BPN"
                >
                    {isBpnActive ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </Button>

                {/* Locate Me */}
                <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full w-10 h-10 shadow bg-white text-slate-700 hover:bg-slate-100"
                    onClick={handleLocateMe}
                >
                    <MapPin className="h-4 w-4" />
                </Button>
            </div>

            <DisclaimerModal
                open={showDisclaimer}
                onOpenChange={setShowDisclaimer}
                onConfirm={() => { setIsBpnActive(true); setShowDisclaimer(false); }}
            />
        </div>
    );
}
