import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function DisclaimerModal({ open, onOpenChange, onConfirm }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden">
                <DialogHeader className="bg-amber-500 p-4 text-white flex flex-row items-center gap-3 space-y-0">
                    <AlertTriangle className="h-6 w-6 text-white" />
                    <DialogTitle className="text-white text-lg font-bold">Pernyataan Tanggung Jawab</DialogTitle>
                </DialogHeader>
                <div className="p-6">
                    <p className="text-gray-700 mb-4 font-medium">
                        Fitur ini menampilkan layer Peta Bidang Tanah dari layanan WMTS Kementerian ATR/BPN.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900 text-sm">
                        <ul className="list-disc pl-4 space-y-2">
                            <li>Situs ini tidak menjamin ketersediaan, akurasi, atau kelengkapan data.</li>
                            <li>Penggunaan data sepenuhnya menjadi tanggung jawab pengguna.</li>
                            <li>Seluruh penggunaan harus mematuhi kebijakan yang berlaku di <strong>bhumi.atrbpn.go.id</strong>.</li>
                        </ul>
                    </div>
                </div>
                <DialogFooter className="bg-gray-50 p-4 border-t flex flex-row justify-end gap-2 sm:gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-white hover:bg-gray-100">
                        Batal
                    </Button>
                    <Button
                        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                        onClick={() => {
                            onConfirm();
                        }}
                    >
                        Setuju & Aktifkan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
