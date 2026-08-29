import { z } from "zod";

export const amdalnetSchema = z.object({
  PEMRAKARSA: z.string().min(1, "PEMOHON / PEMRAKARSA wajib diisi").max(100, "Maksimal 100 karakter"),
  KEGIATAN: z.string().min(1, "KEGIATAN / JENIS USAHA wajib diisi").max(254, "Maksimal 254 karakter"),
  NO_TELEPON: z.string().optional().or(z.literal('')),
  TAHUN: z.any().optional(),
  PROVINSI: z.string().optional().or(z.literal('')),
  KOTA: z.string().optional().or(z.literal('')),
  KECAMATAN: z.string().optional().or(z.literal('')),
  ALAMAT: z.string().optional().or(z.literal('')),
  KETERANGAN: z.string().optional().or(z.literal('')),
});
