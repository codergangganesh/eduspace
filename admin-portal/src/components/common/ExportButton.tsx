import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExport } from "@/hooks/useExport";

interface ExportButtonProps {
  data: Record<string, any>[];
  columns: { header: string; key: string; width?: number }[];
  filename?: string;
  className?: string;
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  columns,
  filename = "eduspace_export",
  className = "",
  disabled = false,
}) => {
  const { exportToExcel, exportToCsv } = useExport();
  const [isExporting, setIsExporting] = useState(false);

  const handleExcel = async () => {
    setIsExporting(true);
    await exportToExcel(data, columns, filename);
    setIsExporting(false);
  };

  const handleCsv = () => {
    exportToCsv(data, columns, filename);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting || data.length === 0}
          className={`h-9 text-xs font-medium bg-card/60 border-border/80 hover:bg-accent ${className}`}
        >
          <Download className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExcel} className="text-xs cursor-pointer">
          <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Export as Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCsv} className="text-xs cursor-pointer">
          <FileText className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
          Export as CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
