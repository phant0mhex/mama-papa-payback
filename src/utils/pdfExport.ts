import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface Debt {
  id: string;
  total_amount: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface Payment {
  amount: number;
  payment_date: string;
  note: string | null;
}

export const exportToPDF = (
  debt: Debt,
  payments: Payment[],
  totalPaid: number,
  remaining: number
) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("Suivi de Remboursement", 14, 22);

  // Date
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Généré le ${format(new Date(), "dd MMMM yyyy", { locale: fr })}`, 14, 30);

  // Description if exists
  if (debt.description) {
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(debt.description, 14, 38);
  }

  // Summary box
  const startY = debt.description ? 48 : 40;
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(14, startY, 182, 35, 3, 3, "F");

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text("Dette totale:", 20, startY + 10);
  doc.text("Déjà remboursé:", 20, startY + 20);
  doc.text("Reste à payer:", 20, startY + 30);

  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text(`${debt.total_amount.toFixed(2)} €`, 160, startY + 10, { align: "right" });
  
  doc.setTextColor(46, 125, 50); // Success green
  doc.text(`${totalPaid.toFixed(2)} €`, 160, startY + 20, { align: "right" });
  
  doc.setTextColor(60, 60, 60);
  doc.text(`${remaining.toFixed(2)} €`, 160, startY + 30, { align: "right" });

  // Progress bar
  const progressY = startY + 40;
  const progressWidth = 182;
  const progressHeight = 8;
  const progressPercentage = (totalPaid / debt.total_amount) * 100;

  // Background
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(14, progressY, progressWidth, progressHeight, 4, 4, "F");

  // Fill
  if (progressPercentage > 0) {
    doc.setFillColor(46, 125, 50); // Success green
    const fillWidth = (progressWidth * progressPercentage) / 100;
    doc.roundedRect(14, progressY, fillWidth, progressHeight, 4, 4, "F");
  }

  // Percentage text
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`${progressPercentage.toFixed(1)}%`, 105, progressY + 5.5, { align: "center" });

  // Payments table
  const tableStartY = progressY + 18;
  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.setTextColor(40, 40, 40);
  doc.text("Historique des versements", 14, tableStartY);

  if (payments.length === 0) {
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Aucun versement enregistré", 14, tableStartY + 10);
  } else {
    const tableData = payments.map((payment) => [
      format(parseISO(payment.payment_date), "dd/MM/yyyy", { locale: fr }),
      `${parseFloat(payment.amount.toString()).toFixed(2)} €`,
      payment.note || "-",
    ]);

    autoTable(doc, {
      startY: tableStartY + 5,
      head: [["Date", "Montant", "Note"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [46, 125, 50],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [60, 60, 60],
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 35, halign: "right" },
        2: { cellWidth: "auto" },
      },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  // Save
  const fileName = `remboursements-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
};
