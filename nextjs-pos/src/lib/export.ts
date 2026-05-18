import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Transaction, Expense } from "@/lib/types";

interface ExportData {
  storeName: string;
  period: string;
  dateRange: string;
  summary: {
    total_pemasukan: number;
    total_pengeluaran: number;
    laba_rugi: number;
    total_transaksi: number;
    tunai: number;
    qris: number;
  };
  transactions: Transaction[];
  expenses: Expense[];
}

function formatRp(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

// ============ PDF EXPORT ============
export function exportToPDF(data: ExportData) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(data.storeName, 14, 20);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Laporan Penjualan - ${data.period}`, 14, 28);
  doc.text(`Periode: ${data.dateRange}`, 14, 35);
  doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 42);

  // Summary Box
  doc.setFillColor(251, 170, 49); // #FBAA31
  doc.rect(14, 48, 182, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");

  doc.text("Total Pemasukan", 20, 56);
  doc.text(formatRp(data.summary.total_pemasukan), 20, 63);

  doc.text("Tunai", 75, 56);
  doc.text(formatRp(data.summary.tunai), 75, 63);

  doc.text("QRIS", 130, 56);
  doc.text(formatRp(data.summary.qris), 130, 63);

  doc.text("Total Pengeluaran", 20, 72);
  doc.text(formatRp(data.summary.total_pengeluaran), 20, 79);

  doc.text("Laba/Rugi", 75, 72);
  doc.text(formatRp(data.summary.laba_rugi), 75, 79);

  doc.text("Total Transaksi", 130, 72);
  doc.text(String(data.summary.total_transaksi), 130, 79);

  doc.setTextColor(0, 0, 0);

  // Transaction Table
  if (data.transactions.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Daftar Transaksi", 14, 92);

    const trxRows = data.transactions.map((t, i) => [
      i + 1,
      t.date,
      t.time,
      t.buyer_name || "Umum",
      t.items?.map((item) => `${item.quantity}x ${item.product_name}`).join(", ") || "-",
      t.method === "tunai" ? "Tunai" : "QRIS",
      t.status === "lunas" ? "Lunas" : "Pending",
      formatRp(t.total),
    ]);

    autoTable(doc, {
      startY: 96,
      head: [["#", "Tanggal", "Jam", "Pembeli", "Item", "Metode", "Status", "Total"]],
      body: trxRows,
      theme: "grid",
      headStyles: {
        fillColor: [251, 170, 49],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 8 },
        7: { halign: "right" },
      },
    });
  }

  // Expenses Table
  if (data.expenses.length > 0) {
    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 96;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Daftar Pengeluaran", 14, finalY + 12);

    const expRows = data.expenses.map((e, i) => [
      i + 1,
      e.date,
      e.description,
      formatRp(e.amount),
    ]);

    autoTable(doc, {
      startY: finalY + 16,
      head: [["#", "Tanggal", "Keterangan", "Jumlah"]],
      body: expRows,
      theme: "grid",
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 },
        3: { halign: "right" },
      },
    });
  }

  // Profit/Loss Summary
  const lastY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 140;

  if (lastY + 40 > doc.internal.pageSize.height) {
    doc.addPage();
  }

  const summaryY = lastY + 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Perhitungan Laba Rugi", 14, summaryY);

  // Green box for income
  doc.setFillColor(220, 252, 231);
  doc.rect(14, summaryY + 4, 182, 10, "F");
  doc.setTextColor(21, 128, 61);
  doc.setFontSize(10);
  doc.text("Total Pemasukan", 20, summaryY + 11);
  doc.text(`+ ${formatRp(data.summary.total_pemasukan)}`, 160, summaryY + 11, {
    align: "right",
  });

  // Red box for expense
  doc.setFillColor(254, 226, 226);
  doc.rect(14, summaryY + 16, 182, 10, "F");
  doc.setTextColor(220, 38, 38);
  doc.text("Total Pengeluaran", 20, summaryY + 23);
  doc.text(
    `- ${formatRp(data.summary.total_pengeluaran)}`,
    160,
    summaryY + 23,
    { align: "right" }
  );

  // Result box
  const isProfit = data.summary.laba_rugi >= 0;
  doc.setFillColor(isProfit ? 187 : 254, isProfit ? 247 : 202, isProfit ? 208 : 202);
  doc.rect(14, summaryY + 28, 182, 12, "F");
  doc.setTextColor(isProfit ? 21 : 185, isProfit ? 128 : 28, isProfit ? 61 : 28);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(isProfit ? "🟢 LABA" : "🔴 RUGI", 20, summaryY + 36);
  doc.text(formatRp(Math.abs(data.summary.laba_rugi)), 160, summaryY + 36, {
    align: "right",
  });

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `© ${new Date().getFullYear()} ${data.storeName} - Pos Tahu Walik`,
    14,
    doc.internal.pageSize.height - 10
  );

  // Download
  doc.save(
    `Laporan_${data.storeName}_${data.period}_${new Date().toISOString().slice(0, 10)}.pdf`
  );
}

// ============ EXCEL EXPORT ============
export function exportToExcel(data: ExportData) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    [data.storeName],
    [`Laporan Penjualan - ${data.period}`],
    [`Periode: ${data.dateRange}`],
    [`Dicetak: ${new Date().toLocaleDateString("id-ID")}`],
    [],
    ["Ringkasan"],
    ["Total Pemasukan", data.summary.total_pemasukan],
    ["Total Pengeluaran", data.summary.total_pengeluaran],
    ["Laba/Rugi", data.summary.laba_rugi],
    ["Total Transaksi", data.summary.total_transaksi],
    ["Pemasukan Tunai", data.summary.tunai],
    ["Pemasukan QRIS", data.summary.qris],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Ringkasan");

  // Sheet 2: Transactions
  if (data.transactions.length > 0) {
    const trxHeader = [
      "No",
      "Tanggal",
      "Jam",
      "Pembeli",
      "Item",
      "Metode",
      "Status",
      "Total",
    ];
    const trxRows = data.transactions.map((t, i) => [
      i + 1,
      t.date,
      t.time,
      t.buyer_name || "Umum",
      t.items?.map((item) => `${item.quantity}x ${item.product_name}`).join(", ") || "-",
      t.method === "tunai" ? "Tunai" : "QRIS",
      t.status === "lunas" ? "Lunas" : "Pending",
      t.total,
    ]);

    const trxSheet = XLSX.utils.aoa_to_sheet([trxHeader, ...trxRows]);
    trxSheet["!cols"] = [
      { wch: 5 },
      { wch: 12 },
      { wch: 8 },
      { wch: 15 },
      { wch: 30 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, trxSheet, "Transaksi");
  }

  // Sheet 3: Expenses
  if (data.expenses.length > 0) {
    const expHeader = ["No", "Tanggal", "Keterangan", "Jumlah"];
    const expRows = data.expenses.map((e, i) => [
      i + 1,
      e.date,
      e.description,
      e.amount,
    ]);

    const expSheet = XLSX.utils.aoa_to_sheet([expHeader, ...expRows]);
    expSheet["!cols"] = [
      { wch: 5 },
      { wch: 12 },
      { wch: 30 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, expSheet, "Pengeluaran");
  }

  // Download
  XLSX.writeFile(
    wb,
    `Laporan_${data.storeName}_${data.period}_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}
