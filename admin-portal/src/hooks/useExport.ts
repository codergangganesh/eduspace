import ExcelJS from "exceljs";
import { toast } from "sonner";

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 200);
}

export function useExport() {
  const exportToExcel = async (
    data: Record<string, any>[],
    columns: { header: string; key: string; width?: number }[],
    filename: string = "eduspace-export"
  ) => {
    try {
      if (!data || data.length === 0) {
        toast.error("No data available to export.");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Eduspace Admin Portal";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Sheet1");

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

      // Generate buffer and trigger download into Downloads folder
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const baseName = filename.replace(/\.(xlsx|csv|json)$/i, "");
      const fullFileName = `${baseName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      downloadBlob(blob, fullFileName);
      toast.success(`Downloaded ${data.length} records as Excel (${fullFileName})`);
    } catch (err) {
      console.error("[useExport] Excel export failed:", err);
      toast.error("Failed to export Excel file.");
    }
  };

  const exportToCsv = (
    data: Record<string, any>[],
    columns: { header: string; key: string }[],
    filename: string = "eduspace-export"
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

      const csvContent = "\uFEFF" + [headers, ...rows].join("\n"); // UTF-8 BOM for Excel compatibility
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

      const baseName = filename.replace(/\.(xlsx|csv|json)$/i, "");
      const fullFileName = `${baseName}_${new Date().toISOString().slice(0, 10)}.csv`;

      downloadBlob(blob, fullFileName);
      toast.success(`Downloaded ${data.length} records as CSV (${fullFileName})`);
    } catch (err) {
      console.error("[useExport] CSV export failed:", err);
      toast.error("Failed to export CSV file.");
    }
  };

  const exportToJson = (
    data: Record<string, any>[],
    filename: string = "eduspace-export"
  ) => {
    try {
      if (!data || data.length === 0) {
        toast.error("No data available to export.");
        return;
      }

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });

      const baseName = filename.replace(/\.(xlsx|csv|json)$/i, "");
      const fullFileName = `${baseName}_${new Date().toISOString().slice(0, 10)}.json`;

      downloadBlob(blob, fullFileName);
      toast.success(`Downloaded ${data.length} records as JSON (${fullFileName})`);
    } catch (err) {
      console.error("[useExport] JSON export failed:", err);
      toast.error("Failed to export JSON file.");
    }
  };

  return { exportToExcel, exportToCsv, exportToJson };
}
