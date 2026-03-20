"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { InvoiceUploadZone } from "./InvoiceUploadZone";
import { showToast } from "@/components/ui/Toaster";
import type { ProjectLink } from "@/lib/types";

interface InvoiceModalProps {
  projectId: string;
  projectName: string;
  customerName: string;
  links: ProjectLink[];
  isOpen: boolean;
  onClose: () => void;
}

function formatNOK(n: number): string {
  return n.toLocaleString("no-NO");
}

function daysBetween(dateOut: string, dateIn: string): number {
  if (!dateOut || !dateIn) return 0;
  const d1 = new Date(dateOut);
  const d2 = new Date(dateIn);
  const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

export function InvoiceModal({
  projectName,
  customerName,
  links,
  isOpen,
  onClose,
}: InvoiceModalProps) {
  const [kabalFile, setKabalFile] = useState<File | null>(null);
  const [fraktbrevFile, setFraktbrevFile] = useState<File | null>(null);
  const [mottaksbrevFile, setMottaksbrevFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKabalFile(null);
      setFraktbrevFile(null);
      setMottaksbrevFile(null);
    }
  }, [isOpen]);

  // Parse price from modemUrl field (stored as "15000|daily" or just a number)
  function parsePrice(modemUrl: string): { price: number; priceType: string } {
    if (!modemUrl) return { price: 0, priceType: "daily" };
    const parts = modemUrl.split("|");
    return {
      price: Number(parts[0]) || 0,
      priceType: parts[1] || "daily",
    };
  }

  // Calculate invoice lines from project links
  const invoiceLines = links
    .filter((l) => l.utstyr)
    .map((link) => {
      const { price, priceType } = parsePrice(link.modemUrl);
      const days = daysBetween(link.date, link.returnDate);
      const total = priceType === "daily" ? price * days : price;
      return {
        utstyr: link.utstyr,
        dateOut: link.date,
        dateIn: link.returnDate,
        days,
        price,
        priceType,
        total,
      };
    });

  const grandTotal = invoiceLines.reduce((sum, l) => sum + l.total, 0);

  async function generateInvoicePdf() {
    setGenerating(true);
    try {
      // Build HTML for PDF
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #1E293B;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
            <div>
              <h1 style="font-size: 24px; font-weight: 800; margin: 0;">Faktura</h1>
              <p style="color: #64748B; margin: 4px 0 0;">${projectName}</p>
            </div>
            <div style="text-align: right; font-size: 13px; color: #64748B;">
              <p style="margin: 0;">Dato: ${new Date().toLocaleDateString("no-NO")}</p>
              <p style="margin: 4px 0 0;">Kunde: <strong style="color: #1E293B;">${customerName || "Ikke valgt"}</strong></p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
            <thead>
              <tr style="background: #F1F5F9; border-bottom: 2px solid #E2E8F0;">
                <th style="text-align: left; padding: 10px 12px; font-weight: 600;">Utstyr</th>
                <th style="text-align: left; padding: 10px 12px; font-weight: 600;">Dato ut</th>
                <th style="text-align: left; padding: 10px 12px; font-weight: 600;">Dato inn</th>
                <th style="text-align: right; padding: 10px 12px; font-weight: 600;">Dager</th>
                <th style="text-align: right; padding: 10px 12px; font-weight: 600;">Pris</th>
                <th style="text-align: right; padding: 10px 12px; font-weight: 600;">Totalt</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceLines
                .map(
                  (line) => `
                <tr style="border-bottom: 1px solid #F1F5F9;">
                  <td style="padding: 10px 12px; font-weight: 500;">${line.utstyr}</td>
                  <td style="padding: 10px 12px; color: #64748B;">${line.dateOut || "—"}</td>
                  <td style="padding: 10px 12px; color: #64748B;">${line.dateIn || "—"}</td>
                  <td style="padding: 10px 12px; text-align: right;">${line.priceType === "daily" ? line.days : "—"}</td>
                  <td style="padding: 10px 12px; text-align: right;">${formatNOK(line.price)} kr${line.priceType === "daily" ? "/dag" : " fast"}</td>
                  <td style="padding: 10px 12px; text-align: right; font-weight: 600;">${formatNOK(line.total)} kr</td>
                </tr>`
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr style="border-top: 2px solid #1E40AF;">
                <td colspan="5" style="padding: 12px; text-align: right; font-weight: 700; font-size: 14px;">Sum totalt:</td>
                <td style="padding: 12px; text-align: right; font-weight: 800; font-size: 14px; color: #1E40AF;">${formatNOK(grandTotal)} kr</td>
              </tr>
            </tfoot>
          </table>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; font-size: 12px; color: #64748B;">
            <p style="margin: 0; font-weight: 600; color: #1E293B;">Kontraktgrunnlag</p>
            <p style="margin: 4px 0 0;">Kunde: ${customerName || "—"} | Prosjekt: ${projectName} | Generert: ${new Date().toLocaleDateString("no-NO")}</p>
          </div>
        </div>
      `;

      // Use browser print to generate PDF
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        showToast("Popup ble blokkert — tillat popups for denne siden");
        return;
      }
      printWindow.document.write(`<!DOCTYPE html><html><head><title>Faktura - ${projectName}</title></head><body>${html}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);

      showToast("Faktura-PDF åpnet for nedlasting");
    } catch (err) {
      console.error("PDF generation error:", err);
      showToast("Feil ved generering av faktura");
    } finally {
      setGenerating(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-text">Fakturering</h2>
            <p className="mt-0.5 text-sm text-text-light">
              {projectName} {customerName ? `— ${customerName}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-text transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Invoice preview */}
        {invoiceLines.length > 0 && (
          <div className="mb-6 rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-light">
              Fakturaoversikt
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-text-light">
                  <th className="px-4 py-2 text-left font-medium">Utstyr</th>
                  <th className="px-4 py-2 text-left font-medium">Dato ut</th>
                  <th className="px-4 py-2 text-left font-medium">Dato inn</th>
                  <th className="px-4 py-2 text-right font-medium">Dager</th>
                  <th className="px-4 py-2 text-right font-medium">Pris</th>
                  <th className="px-4 py-2 text-right font-medium">Totalt</th>
                </tr>
              </thead>
              <tbody>
                {invoiceLines.map((line, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-4 py-2 font-medium">{line.utstyr}</td>
                    <td className="px-4 py-2 text-text-light">{line.dateOut || "—"}</td>
                    <td className="px-4 py-2 text-text-light">{line.dateIn || "—"}</td>
                    <td className="px-4 py-2 text-right">{line.priceType === "daily" ? line.days : "—"}</td>
                    <td className="px-4 py-2 text-right">{formatNOK(line.price)} kr{line.priceType === "daily" ? "/dag" : ""}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatNOK(line.total)} kr</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary">
                  <td colSpan={5} className="px-4 py-3 text-right font-bold">Sum totalt:</td>
                  <td className="px-4 py-3 text-right font-extrabold text-primary">{formatNOK(grandTotal)} kr</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {invoiceLines.length === 0 && (
          <div className="mb-6 rounded-xl border border-gray-100 px-6 py-8 text-center text-sm text-text-light">
            Ingen utstyrslinjer med priser funnet. Legg til utstyr og velg kunde først.
          </div>
        )}

        {/* File uploads */}
        <div className="space-y-4">
          <InvoiceUploadZone label="Kabal Screenshot" type="image" onFile={setKabalFile} file={kabalFile} onRemove={() => setKabalFile(null)} />
          <InvoiceUploadZone label="Fraktbrev" type="pdf" onFile={setFraktbrevFile} file={fraktbrevFile} onRemove={() => setFraktbrevFile(null)} />
          <InvoiceUploadZone label="Mottaksbrev" type="pdf" onFile={setMottaksbrevFile} file={mottaksbrevFile} onRemove={() => setMottaksbrevFile(null)} />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            variant="purple"
            disabled={invoiceLines.length === 0 || generating}
            onClick={generateInvoicePdf}
          >
            {generating ? "Genererer..." : "Last ned Faktura PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}
