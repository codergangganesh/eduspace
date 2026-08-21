import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";

export function useExport() {
  const exportToExcel = async (
    data: Record<string, any>[],
    columns: { header: string; key: string; width?: number }[],
    filename: string = "eduspace_export"
  ) => {
    try {
      if (!data || data.length === 0) {
        toast.error("No data available to export.");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Eduspace Admin Portal";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Data");

      worksheet.columns = columns.map((c) => ({
        header: c.header,
        key: c.key,
        width: c.width || 20,
      }));

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1D4ED8" }, // Eduspace Primary Blue
      };
      headerRow.height = 24;

      // Add rows
      data.forEach((item) => {
        const rowData: Record<string, any> = {};
        columns.forEach((col) => {
          rowData[col.key] = item[col.key] ?? "";
        });
        worksheet.addRow(rowData);
      });

      // Generate buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Exported ${data.length} records successfully!`);
    } catch (err) {
      console.error("[useExport] Excel export failed:", err);
      toast.error("Failed to export Excel file.");
    }
  };

  const exportToCsv = (
    data: Record<string, any>[],
    columns: { header: string; key: string }[],
    filename: string = "eduspace_export"
  ) => {
    try {
      if (!data || data.length === 0) {
        toast.error("No data available to export.");
        return;
      }

      const headers = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(",");
      const rows = data.map((item) =>
        columns
          .map((c) => {
            const val = item[c.key] ?? "";
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(",")
      );

      const csvContent = [headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

      saveAs(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(`Exported ${data.length} records to CSV!`);
    } catch (err) {
      console.error("[useExport] CSV export failed:", err);
      toast.error("Failed to export CSV file.");
    }
  };

  return { exportToExcel, exportToCsv };
}
