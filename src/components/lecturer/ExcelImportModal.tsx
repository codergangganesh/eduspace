import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { generateTemplate, parseExcelFile, ValidationError } from "@/lib/excelService";
import { useClassStudents } from "@/hooks/useClassStudents";
import { toast } from "sonner";

interface ExcelImportModalProps {
    open: boolean;
    onClose: () => void;
    classId: string;
    onImportComplete: () => void;
}

export function ExcelImportModal({ open, onClose, classId, onImportComplete }: ExcelImportModalProps) {
    const { importStudentsFromExcel } = useClassStudents(classId);
    const [file, setFile] = useState<File | null>(null);
    const [parsing, setParsing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [importResult, setImportResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = () => {
        generateTemplate();
        toast.success("Template downloaded successfully");
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setParsing(true);
        setErrors([]);
        setParsedData([]);
        setImportResult(null);

        try {
            const result = await parseExcelFile(selectedFile);
            setParsedData(result.data);
            setErrors(result.errors);

            if (!result.isValid) {
                toast.error(`Found ${result.errors.length} validation errors`);
            } else {
                toast.success(`Parsed ${result.data.length} students successfully`);
            }
        } catch (error) {
            toast.error("Failed to parse Excel file");
        } finally {
            setParsing(false);
        }
    };

    const handleImport = async () => {
        if (parsedData.length === 0) {
            toast.error("No data to import");
            return;
        }

        setImporting(true);
        try {
            const result = await importStudentsFromExcel(parsedData, classId);

            if (result.success) {
                setImportResult(result);
                toast.success(`Successfully imported ${result.imported} students`);
                if (result.skipped > 0) {
                    toast.warning(`${result.skipped} students skipped (no registered accounts)`);
                }
                onImportComplete();
            } else {
                toast.error(result.error || "Failed to import students");
            }
        } catch (error) {
            toast.error("An error occurred during import");
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setParsedData([]);
        setErrors([]);
        setImportResult(null);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Students from Excel</DialogTitle>
                    <DialogDescription>
                        Download the template, fill in student details, and upload the file to import students.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Step 1: Download Template */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-1">
                                    Step 1: Download Template
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                    Download the Excel template with predefined columns and sample data.
                                </p>
                                <Button onClick={handleDownloadTemplate} variant="outline" size="sm">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Template
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Upload File */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <Upload className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-1">
                                    Step 2: Upload Filled Template
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                    Fill in the template with student details and upload it here.
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    variant="outline"
                                    size="sm"
                                    disabled={parsing}
                                >
                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                    {file ? file.name : "Choose File"}
                                </Button>
                                {parsing && (
                                    <p className="text-sm text-slate-500 mt-2">Parsing file...</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Validation Errors */}
                    {errors.length > 0 && (
                        <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                                        Validation Errors ({errors.length})
                                    </h4>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {errors.slice(0, 10).map((error, index) => (
                                            <p key={index} className="text-sm text-red-700 dark:text-red-300">
                                                Row {error.row}: {error.field} - {error.message}
                                            </p>
                                        ))}
                                        {errors.length > 10 && (
                                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                                ... and {errors.length - 10} more errors
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview Data */}
                    {parsedData.length > 0 && (
                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                            <h4 className="font-semibold text-slate-800 dark:text-white mb-3">
                                Preview ({parsedData.length} students)
                            </h4>
                            <div className="overflow-x-auto max-h-60">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                Name
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                Register No.
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                Email
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                Department
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {parsedData.slice(0, 5).map((student, index) => (
                                            <tr key={index}>
                                                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                                                    {student.studentName}
                                                </td>
                                                <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-mono">
                                                    {student.registerNumber}
                                                </td>
                                                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                                                    {student.email}
                                                </td>
                                                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                                                    {student.department}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {parsedData.length > 5 && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
                                        ... and {parsedData.length - 5} more students
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Import Result */}
                    {importResult && (
                        <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                                        Import Successful
                                    </h4>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        {importResult.imported} students imported successfully
                                        {importResult.skipped > 0 && `, ${importResult.skipped} skipped`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button variant="outline" onClick={handleClose}>
                            {importResult ? "Close" : "Cancel"}
                        </Button>
                        {!importResult && (
                            <Button
                                onClick={handleImport}
                                disabled={parsedData.length === 0 || errors.length > 0 || importing}
                            >
                                {importing ? "Importing..." : `Import ${parsedData.length} Students`}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
