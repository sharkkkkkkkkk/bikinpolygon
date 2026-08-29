import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { amdalnetSchema } from '../modules/amdalnet/validation';
import { exportAmdalnetSHP, exportBasicSHP } from '../modules/amdalnet/exporter';
import { exportAmdalnetPDF, exportBasicPDF } from '../modules/amdalnet/pdf-exporter';
import { calculateAreas } from '../modules/amdalnet/mapper';
import { fetchProvinces, fetchRegencies, fetchDistricts, STATIC_PROVINCES } from '../modules/amdalnet/wilayahApi';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { CheckCircle2, ShieldCheck, Building2, Briefcase, X, FileSpreadsheet, Phone, Tag, FileCheck, Info, Loader2, Download, FileText, Lock, Zap } from 'lucide-react';
import PakasirPaymentModal from './PakasirPaymentModal';
import { checkAccessStatus, hasUsedFreeTrial, markFreeTrialUsed } from '../lib/deviceAccess';

export function AmdalnetExportPanel({ existingPolygonGeoJSON, onRequireAuth, isOpen, onOpenChange }) {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isModalOpen = isOpen !== undefined ? isOpen : internalModalOpen;
  const setIsModalOpen = (val) => { if (onOpenChange) onOpenChange(val); setInternalModalOpen(val); };

  const [pakasirModalOpen, setPakasirModalOpen] = useState(false);
  const [polygonEnabled, setPolygonEnabled] = useState(false);
  const isAmdalMode = polygonEnabled;
  const [loading, setLoading] = useState(false);
  const [correctedArea, setCorrectedArea] = useState('0.00');

  useEffect(() => {
    const a = calculateAreas(existingPolygonGeoJSON);
    if (a.sqMeters > 0) setCorrectedArea(a.sqMeters.toFixed(2));
  }, [existingPolygonGeoJSON]);

  const [provinces, setProvinces] = useState(STATIC_PROVINCES);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedProvId, setSelectedProvId] = useState('');
  const [selectedKotaId, setSelectedKotaId] = useState('');
  const [selectedKecId, setSelectedKecId] = useState('');
  const [loadingProv, setLoadingProv] = useState(false);
  const [loadingKota, setLoadingKota] = useState(false);
  const [loadingKec, setLoadingKec] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  const { register, handleSubmit, setValue, watch, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(amdalnetSchema),
    defaultValues: { PEMRAKARSA: '', KEGIATAN: '', NO_TELEPON: '', TAHUN: new Date().getFullYear(), PROVINSI: '', KOTA: '', KECAMATAN: '', ALAMAT: '', KETERANGAN: '' }
  });

  const watchAlamat = watch('ALAMAT') || '';
  const watchKecamatan = watch('KECAMATAN') || '';
  const watchKota = watch('KOTA') || '';

  useEffect(() => {
    (async () => {
      setLoadingProv(true);
      const data = await fetchProvinces();
      if (data?.length) setProvinces(data);
      setLoadingProv(false);
    })();
  }, []);

  const handleToggleAmdalMode = (enabled) => {
    const nextState = typeof enabled === 'boolean' ? enabled : !polygonEnabled;
    console.log('[AMDALNET_CHECKBOX] State Toggled:', { previous: polygonEnabled, next: nextState });
    setPolygonEnabled(nextState);
  };

  const handleProvChange = async (e) => {
    const id = String(e.target.value || '').trim();
    setSelectedProvId(id);
    setSelectedKotaId('');
    setSelectedKecId('');
    setRegencies([]);
    setDistricts([]);
    
    if (id) {
      const selectedProv = provinces.find(p => String(p.id) === id);
      if (selectedProv) setValue('PROVINSI', selectedProv.name, { shouldValidate: true, shouldDirty: true });
      setLoadingKota(true);
      const data = await fetchRegencies(id);
      setRegencies(data || []);
      setLoadingKota(false);
    } else {
      setValue('PROVINSI', '', { shouldValidate: true });
      setValue('KOTA', '', { shouldValidate: true });
      setValue('KECAMATAN', '', { shouldValidate: true });
    }
  };

  const handleKotaChange = async (e) => {
    const id = String(e.target.value || '').trim();
    setSelectedKotaId(id);
    setSelectedKecId('');
    setDistricts([]);
    
    if (id) {
      const selectedReg = regencies.find(r => String(r.id) === id);
      if (selectedReg) setValue('KOTA', selectedReg.name, { shouldValidate: true, shouldDirty: true });
      setLoadingKec(true);
      const data = await fetchDistricts(id);
      setDistricts(data || []);
      setLoadingKec(false);
    } else {
      setValue('KOTA', '', { shouldValidate: true });
      setValue('KECAMATAN', '', { shouldValidate: true });
    }
  };

  const handleKecChange = (e) => {
    const id = String(e.target.value || '').trim();
    setSelectedKecId(id);
    if (id) {
      const selectedDist = districts.find(d => String(d.id) === id);
      if (selectedDist) setValue('KECAMATAN', selectedDist.name, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue('KECAMATAN', '', { shouldValidate: true });
    }
  };

  const getPoints = () => {
    const g = existingPolygonGeoJSON;
    if (!g) return null;
    if (g.type === 'FeatureCollection' && g.features?.length) return g.features[g.features.length - 1].geometry?.coordinates[0] || null;
    if (g.type === 'Feature' && g.geometry) return g.geometry.coordinates[0] || null;
    return null;
  };

  const openCard = () => {
    setIsModalOpen(true);
  };

  const saveSubmissionToSpreadsheet = (data, exportType) => {
    const payload = {
      ...data,
      isAmdalMode,
      exportType,
      timestamp: new Date().toISOString()
    };

    // 1. Save via Express Server (Local CSV + Google Sheets Sync if env configured)
    try {
      api.post('/generator/save-submission', payload).catch(err => console.warn("Background server spreadsheet save error:", err));
    } catch (e) {
      console.warn("Background save submission error:", e);
    }

    // 2. Direct Frontend fetch to Google Apps Script Webhook (no-cors)
    const appsScriptUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL || window.GOOGLE_SHEET_WEBHOOK_URL;
    if (appsScriptUrl) {
      try {
        fetch(appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.warn("Direct Google Apps Script fetch error:", err));
      } catch (err) {
        console.warn("Direct Google Apps Script error:", err);
      }
    }
  };

  const doExportSHP = async (data) => {
    const pts = getPoints();
    if (!pts) {
      toast({
        title: "Polygon Belum Digambar",
        description: "Silakan gambar polygon pada peta terlebih dahulu sebelum men-download Shapefile.",
        variant: "destructive"
      });
      return;
    }

    // 1. Device Trial / Paid Duration Access Check (Free Tier <= 50m2 bypasses paywall)
    const numericArea = parseFloat(String(correctedArea).replace(',', '.')) || 0;
    const isFreeTier = numericArea > 0 && numericArea <= 50;

    if (!isFreeTier) {
      const access = await checkAccessStatus();
      if (!access.isActive) {
        if (!hasUsedFreeTrial()) {
          markFreeTrialUsed();
          toast({
            title: "Ekspor Gratis 1x Berhasil Digunakan! 🎁",
            description: "Untuk ekspor selanjutnya, silakan pilih durasi akses."
          });
        } else {
          toast({
            title: "Akses Diperlukan (Luas > 50 m²) 🔒",
            description: `Luas polygon Anda (${numericArea.toFixed(2)} m²) di atas batas Free Tier (50 m²). Silakan pilih Paket Akses untuk mengunduh.`,
            variant: "destructive"
          });
          setPakasirModalOpen(true);
          return;
        }
      }
    }

    // Save metadata to spreadsheet di balik layar
    saveSubmissionToSpreadsheet(data, isAmdalMode ? 'AMDALNET_SHP' : 'BIASA_SHP');

    try {
      setLoading(true);
      if (user) {
        try {
          await api.post('/generator/authorize-export', { exportType: isAmdalMode ? 'AMDALNET_SHP' : 'OSS_SHP', customPoints: pts });
        } catch (e) {
          console.warn("Authorize export backend check skipped:", e);
        }
      }

      if (isAmdalMode) {
        await exportAmdalnetSHP(existingPolygonGeoJSON, data);
        toast({
          title: "Export SHP AMDALNET Berhasil! 🚀",
          description: "File Tapak_proyek.zip (Web Mercator EPSG:3857 & 8 Kolom DBF KLHK) telah diunduh."
        });
      } else {
        await exportBasicSHP(existingPolygonGeoJSON, data);
        toast({
          title: "Export SHP Polygon Biasa Berhasil! 📦",
          description: "File Polygon_Lahan.zip (WGS84 EPSG:4326) telah diunduh."
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Export SHP Error:", err);
      toast({
        title: "Gagal Mengunduh SHP",
        description: err.message || "Terjadi kesalahan saat membuat file Shapefile.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const doExportPDF = async (data) => {
    const pts = getPoints();
    if (!pts) {
      toast({
        title: "Polygon Belum Digambar",
        description: "Silakan gambar polygon pada peta terlebih dahulu sebelum men-download Laporan PDF.",
        variant: "destructive"
      });
      return;
    }

    // 1. Device Trial / Paid Duration Access Check (Free Tier <= 50m2 bypasses paywall)
    const numericArea = parseFloat(String(correctedArea).replace(',', '.')) || 0;
    const isFreeTier = numericArea > 0 && numericArea <= 50;

    if (!isFreeTier) {
      const access = await checkAccessStatus();
      if (!access.isActive) {
        if (!hasUsedFreeTrial()) {
          markFreeTrialUsed();
          toast({
            title: "Ekspor Gratis 1x Berhasil Digunakan! 🎁",
            description: "Untuk ekspor selanjutnya, silakan pilih durasi akses."
          });
        } else {
          toast({
            title: "Akses Diperlukan (Luas > 50 m²) 🔒",
            description: `Luas polygon Anda (${numericArea.toFixed(2)} m²) di atas batas Free Tier (50 m²). Silakan pilih Paket Akses untuk mengunduh.`,
            variant: "destructive"
          });
          setPakasirModalOpen(true);
          return;
        }
      }
    }

    // Save metadata to spreadsheet di balik layar
    saveSubmissionToSpreadsheet(data, isAmdalMode ? 'AMDALNET_PDF' : 'BIASA_PDF');

    try {
      setLoading(true);
      if (user) {
        try {
          await api.post('/generator/authorize-export', { exportType: isAmdalMode ? 'AMDALNET_PDF' : 'OSS_PDF', customPoints: pts });
        } catch (e) {
          console.warn("Authorize export backend check skipped:", e);
        }
      }

      if (isAmdalMode) {
        await exportAmdalnetPDF(existingPolygonGeoJSON, data, 'map-container');
        toast({
          title: "Export PDF AMDALNET Berhasil! 📄",
          description: "Laporan PDF Peta Tapak Proyek AMDALNET (Standar KLHK) telah diunduh."
        });
      } else {
        await exportBasicPDF(existingPolygonGeoJSON, data, 'map-container');
        toast({
          title: "Export PDF Polygon Biasa Berhasil! 📄",
          description: "Laporan PDF Polygon Lahan telah diunduh."
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Export PDF Error:", err);
      toast({
        title: "Gagal Mengunduh PDF",
        description: err.message || "Terjadi kesalahan saat membuat file PDF.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportClick = async (exportFn) => {
    const numericArea = parseFloat(String(correctedArea).replace(',', '.')) || 0;
    const isFreeTier = numericArea > 0 && numericArea <= 50;

    if (!isFreeTier) {
      const access = await checkAccessStatus();
      if (!access.isActive) {
        toast({
          title: "Akses Diperlukan (Luas > 50 m²) 🔒",
          description: `Luas polygon Anda (${numericArea.toFixed(2)} m²) di atas batas Free Tier (50 m²). Silakan pilih Paket Akses untuk mengunduh.`,
          variant: "destructive"
        });
        setPakasirModalOpen(true);
        return;
      }
    }

    handleSubmit(exportFn)();
  };

  const inputCls = "w-full text-xs rounded-xl border-zinc-700 shadow-sm p-3 border focus:border-[#ADFA1D] bg-zinc-900 text-white placeholder-slate-500 font-medium";
  const selectCls = "w-full text-xs rounded-xl border-zinc-700 shadow-sm p-3 border focus:border-[#ADFA1D] bg-zinc-900 text-white cursor-pointer";

  return (
    <>
      {/* Modal — rendered via Portal to escape sidebar stacking context */}
      {isModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200" style={{ zIndex: 99999 }} onClick={() => setIsModalOpen(false)}>
          <div className="relative w-full max-w-2xl bg-[#0F172A] border border-zinc-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl text-white my-auto max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-start justify-between border-b border-zinc-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ADFA1D]/10 border border-[#ADFA1D]/30 flex items-center justify-center text-[#ADFA1D]"><Building2 className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-base sm:text-lg font-outfit font-extrabold text-white tracking-tight">Form Metadata Polygon</h2>
                  <p className="text-xs text-slate-400">Lengkapi data Pemohon & Jenis Kegiatan proyek.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <form className="space-y-4">
              {/* PEMOHON */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#ADFA1D]" /> PEMOHON / PEMRAKARSA <span className="text-rose-400">*</span>
                </label>
                <input {...register("PEMRAKARSA")} placeholder="Contoh: PT Sumber Alam Perdana" className={inputCls} />
                <p className="text-[10px] text-slate-400 mt-1">Misal: <span className="text-[#ADFA1D] font-medium">PT Sumber Alam Perdana</span></p>
                {errors.PEMRAKARSA && <span className="text-rose-400 text-[10px] mt-0.5 block">{errors.PEMRAKARSA.message}</span>}
              </div>

              {/* KEGIATAN */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#ADFA1D]" /> KEGIATAN / JENIS USAHA <span className="text-rose-400">*</span>
                </label>
                <input {...register("KEGIATAN")} placeholder="Contoh: Perdagangan Besar dan Eceran" className={inputCls} />
                <p className="text-[10px] text-slate-400 mt-1">Misal: <span className="text-[#ADFA1D] font-medium">Perdagangan Besar</span></p>
                {errors.KEGIATAN && <span className="text-rose-400 text-[10px] mt-0.5 block">{errors.KEGIATAN.message}</span>}
              </div>

              {/* NO TELEPON */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#ADFA1D]" /> NO. TELEPON / WHATSAPP
                </label>
                <input {...register("NO_TELEPON")} placeholder="Contoh: 081234567890" className={inputCls} />
                <p className="text-[10px] text-slate-400 mt-1">Misal: <span className="text-[#ADFA1D] font-medium">081234567890</span></p>
              </div>

              {/* AMDALNET Controlled Checkbox Card Component */}
              <div className="pt-2">
                <div
                  role="checkbox"
                  tabIndex={0}
                  aria-checked={polygonEnabled}
                  onClick={() => handleToggleAmdalMode(!polygonEnabled)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleToggleAmdalMode(!polygonEnabled);
                    }
                  }}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border transition-all text-left cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#ADFA1D] ${
                    polygonEnabled
                      ? 'bg-[#ADFA1D]/10 border-[#ADFA1D] shadow-[0_0_15px_rgba(173,250,29,0.15)]'
                      : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    id="amdalnet-polygon-checkbox"
                    checked={polygonEnabled}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleAmdalMode(e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 mt-0.5 rounded border-2 border-zinc-600 bg-zinc-800 text-[#ADFA1D] focus:ring-[#ADFA1D] accent-[#ADFA1D] cursor-pointer shrink-0"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-extrabold flex items-center gap-1.5 text-white">
                      <ShieldCheck className={`w-4 h-4 ${polygonEnabled ? 'text-[#ADFA1D]' : 'text-slate-400'}`} /> Polygon untuk Peta Tapak Proyek AMDALNET
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Centang untuk melengkapi data lokasi standar KLHK (Tahun, Provinsi, Kab/Kota, Kecamatan, Alamat).</p>
                  </div>
                </div>
              </div>

              {/* AMDALNET Fields */}
              {isAmdalMode && (
                <div className="space-y-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">TAHUN <span className="text-rose-400">*</span></label>
                      <input type="number" {...register("TAHUN", { valueAsNumber: true })} className={inputCls + " font-mono font-bold"} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center justify-between">
                        <span>PROVINSI <span className="text-rose-400">*</span></span>
                        {loadingProv && <Loader2 className="w-3 h-3 animate-spin text-[#ADFA1D]" />}
                      </label>
                      <select value={selectedProvId} onChange={handleProvChange} className={selectCls}>
                        <option value="">-- Pilih Provinsi --</option>
                        {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center justify-between">
                        <span>KOTA / KABUPATEN <span className="text-rose-400">*</span></span>
                        {loadingKota && <Loader2 className="w-3 h-3 animate-spin text-[#ADFA1D]" />}
                      </label>
                      <select
                        value={selectedKotaId}
                        onChange={handleKotaChange}
                        disabled={!selectedProvId || loadingKota}
                        className={selectCls + " disabled:opacity-50"}
                      >
                        <option value="">
                          {!selectedProvId
                            ? "-- Pilih Provinsi Terlebih Dahulu --"
                            : loadingKota
                            ? "Memuat Data Kota/Kabupaten..."
                            : "-- Pilih Kota/Kabupaten --"}
                        </option>
                        {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center justify-between">
                        <span>KECAMATAN <span className="text-rose-400">*</span></span>
                        {loadingKec && <Loader2 className="w-3 h-3 animate-spin text-[#ADFA1D]" />}
                      </label>
                      <select
                        value={selectedKecId}
                        onChange={handleKecChange}
                        disabled={!selectedKotaId || loadingKec}
                        className={selectCls + " disabled:opacity-50"}
                      >
                        <option value="">
                          {!selectedKotaId
                            ? "-- Pilih Kota/Kabupaten Terlebih Dahulu --"
                            : loadingKec
                            ? "Memuat Data Kecamatan..."
                            : "-- Pilih Kecamatan --"}
                        </option>
                        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">ALAMAT <span className="text-rose-400">*</span></label>
                    <textarea {...register("ALAMAT")} rows="2" placeholder="Alamat lengkap hingga desa..." className={inputCls} />
                    <p className="text-[10px] text-slate-400 mt-1">Gabungan: <span className="text-[#ADFA1D] font-medium">{watchAlamat || '[Alamat]'}, {watchKecamatan ? `Kec. ${watchKecamatan}` : '[Kecamatan]'}, {watchKota || '[Kota/Kab]'}</span></p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">KETERANGAN <span className="text-slate-500 font-normal">(OPSIONAL)</span></label>
                    <textarea {...register("KETERANGAN")} rows="2" placeholder="Catatan tambahan..." className={inputCls} />
                  </div>
                </div>
              )}

              {/* Area Card */}
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 space-y-3 text-amber-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5"><Tag className="w-4 h-4 text-amber-400" /> LUAS AREA</span>
                  <span className="font-mono text-base font-black text-white">{correctedArea} <span className="text-xs font-normal text-amber-300">m²</span></span>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-amber-200 uppercase tracking-wide">KOREKSI LUAS (OPSIONAL)</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input type="text" value={correctedArea} onChange={(e) => setCorrectedArea(e.target.value)} className="w-full text-xs rounded-xl border-amber-500/40 bg-zinc-900/90 text-white p-2.5 pr-8 border font-mono font-bold focus:border-amber-400" />
                      <span className="absolute right-3 top-2.5 text-xs text-amber-400 font-mono">m²</span>
                    </div>
                    <button type="button" onClick={() => toast({ title: "Koreksi Diterapkan", description: `Luas: ${correctedArea} m²` })} className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shrink-0">Koreksi</button>
                  </div>
                </div>

                {/* Free Tier Status & Access Trigger */}
                <div className="pt-2 border-t border-amber-500/20">
                  {parseFloat(String(correctedArea).replace(',', '.')) <= 50 ? (
                    <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-2.5 text-[11px] text-emerald-300 font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        🎁 Free Tier Gratis (Ukuran ≤ 50 m² — Bebas Ekspor)
                      </span>
                      <span className="bg-[#ADFA1D] text-black font-extrabold px-2 py-0.5 rounded-full text-[10px]">FREE</span>
                    </div>
                  ) : (
                    <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-2.5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-amber-200 font-bold">
                        <span>🔒 Ukuran &gt; 50 m² (Membutuhkan Akses Aktif)</span>
                        <span className="bg-amber-500 text-black font-extrabold px-2 py-0.5 rounded-full text-[10px]">PRO</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPakasirModalOpen(true)}
                        className="w-full bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-extrabold text-xs px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md"
                      >
                        ⚡ Buka Paket Akses Durasi
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-1 flex items-start gap-2 text-[11px] text-amber-200/90 leading-relaxed border-t border-amber-500/20">
                  <FileCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p><strong>Penting:</strong> Pastikan letak, bentuk, dan luas area sesuai dengan <strong>Sertifikat Alas Hak</strong> atau <strong>Dokumen Teknis Lainnya</strong>.</p>
                </div>
              </div>

              {/* Info */}
              <div className="bg-sky-950/40 border border-sky-500/30 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-sky-200">
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
                <p>Free Tier (≤ 50 m²) gratis untuk semua pengguna. Dapatkan BikinPolygon Pass untuk ekspor tanpa batas.</p>
              </div>

              {/* Prominent Card Buka Akses Warning for > 50 m² */}
              {parseFloat(String(correctedArea).replace(',', '.')) > 50 && (
                <div className="bg-gradient-to-r from-amber-950/80 via-zinc-900 to-amber-950/80 border border-amber-500/50 rounded-2xl p-4 space-y-2.5 text-amber-100 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-outfit font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-400" /> PERLU PAKET AKSES (LUAS &gt; 50 m²)
                    </span>
                    <span className="bg-amber-500 text-black font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">PRO</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Luas polygon Anda (<strong>{correctedArea} m²</strong>) melebihi batas Free Tier (≤ 50 m²). Silakan buka Paket Akses untuk men-download file Shapefile & PDF.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPakasirModalOpen(true)}
                    className="w-full bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-outfit font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(173,250,29,0.3)] cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-black" /> BUKA PAKET AKSES SEKARANG
                  </button>
                </div>
              )}

              {/* Mode Badge */}
              <div className={`text-center text-[11px] font-bold py-2 rounded-xl border ${isAmdalMode ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-zinc-900 border-zinc-800 text-slate-400'}`}>
                {isAmdalMode ? '🛡️ Mode: AMDALNET KLHK (8 Kolom DBF, EPSG:3857, Tapak_proyek.zip)' : '📦 Mode: Polygon Biasa (Pemohon + Kegiatan, WGS84, Polygon_Lahan.zip)'}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-zinc-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-bold text-xs px-5 py-3 rounded-xl border border-zinc-700 transition-colors">Batal</button>
                <div className="flex-1 flex gap-2">
                  <button type="button" onClick={() => handleExportClick(doExportSHP)} disabled={loading} className="flex-1 bg-[#ADFA1D] hover:bg-[#9fe318] text-black text-xs font-outfit font-extrabold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-[0_0_20px_rgba(173,250,29,0.25)]">
                    <Download className="w-4 h-4" /> {loading ? 'Memproses...' : 'Download SHP'}
                  </button>
                  <button type="button" onClick={() => handleExportClick(doExportPDF)} disabled={loading} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 border border-zinc-700">
                    <FileText className="w-4 h-4 text-[#ADFA1D]" /> {loading ? 'Memproses...' : 'Download PDF'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <PakasirPaymentModal 
        isOpen={pakasirModalOpen} 
        onClose={() => setPakasirModalOpen(false)} 
      />
    </>
  );
}
