import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useExcelImport, StudentData, ValidationError } from "@/hooks/useExcelImport";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ImportStudentsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classId: string;
    onImport: (students: any[]) => Promise<{ success: number; failed: number; errors: string[] }>;
}

export function ImportStudentsModal({ open, onOpenChange, classId, onImport }: ImportStudentsModalProps) {
    const { toast } = useToast();
    const { parseExcelFile, validateStudentData, generateTemplate } = useExcelImport();
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [parsedData, setParsedData] = useState<StudentData[]>([]);
    const [parseErrors, setParseErrors] = useState<ValidationError[]>([]);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type
        const validTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];

        if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
            toast({
                title: "Invalid File Type",
                description: "Please upload an Excel (.xlsx, .xls) or CSV file",
                variant: "destructive",
            });
            return;
        }

        setFile(selectedFile);
        setLoading(true);

        try {
            const { data, errors } = await parseExcelFile(selectedFile);
            setParsedData(data);
            setParseErrors(errors);

            // Validate parsed data
            const validationErrs = validateStudentData(data);
            setValidationErrors(validationErrs);

            if (data.length === 0) {
                toast({
                    title: "No Data Found",
                    description: "The file appears to be empty or improperly formatted",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "File Parsed",
                    description: `Found ${data.length} students. Review the data below before importing.`,
                });
            }
        } catch (error) {
            console.error("Error parsing file:", error);
            toast({
                title: "Parse Error",
                description: "Failed to parse the file. Please check the format and try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (parsedData.length === 0) {
            toast({
                title: "No Data",
                description: "Please upload a file first",
                variant: "destructive",
            });
            return;
        }

        if (parseErrors.length > 0 || validationErrors.length > 0) {
            toast({
                title: "Validation Errors",
                description: "Please fix all errors before importing",
                variant: "destructive",
            });
            return;
        }

        try {
            setImporting(true);
            const result = await onImport(parsedData);

            toast({
                title: "Import Complete",
                description: `Successfully imported ${result.success} students. ${result.failed} failed.`,
                variant: result.failed > 0 ? "destructive" : "default",
            });

            if (result.failed === 0) {
                // Reset and close on success
                setParsedData([]);
                setParseErrors([]);
                setValidationErrors([]);
                setFile(null);
                onOpenChange(false);
            }
        } catch (error) {
            console.error("Error importing students:", error);
            toast({
                title: "Import Error",
                description: "Failed to import students. Please try again.",
                variant: "destructive",
            });
        } finally {
            setImporting(false);
        }
    };

    const allErrors = [...parseErrors, ...validationErrors];
    const hasErrors = allErrors.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-none shadow-2xl">
                <DialogHeader className="mb-4 sm:mb-6">
                    <DialogTitle className="text-xl sm:text-2xl font-bold">Import Students</DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">
                        Upload an Excel file to bulk import students into this class
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 sm:space-y-6">
                    {/* Download Template Button */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/50 rounded-2xl gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <FileSpreadsheet className="size-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Need a template?</p>
                                <p className="text-xs text-muted-foreground">Download our Excel template with sample data</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={generateTemplate}
                            className="w-full sm:w-auto gap-2 rounded-xl font-bold h-10 border-slate-200 dark:border-slate-800"
                        >
                            <Download className="size-4" />
                            Download Template
                        </Button>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-3">
                        <label
                            htmlFor="file-upload"
                            className="flex flex-col items-center justify-center w-full h-32 sm:h-40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-primary/50 transition-all bg-slate-50/50 dark:bg-slate-900/50"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-3">
                                    <Upload className="size-6 text-primary" />
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    <span className="font-bold text-primary">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                    Excel (.xlsx, .xls) or CSV files
                                </p>
                            </div>
                            <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                            />
                        </label>
                        {file && (
                            <div className="flex items-center gap-2 px-1">
                                <FileSpreadsheet className="size-4 text-emerald-500" />
                                <p className="text-xs sm:text-sm font-medium truncate">
                                    Selected: <span className="text-primary">{file.name}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                            <Loader2 className="size-6 animate-spin text-primary" />
                            <span className="ml-3 text-sm font-medium text-muted-foreground">Parsing file...</span>
                        </div>
                    )}

                    {/* Errors */}
                    {hasErrors && !loading && (
                        <Alert variant="destructive" className="rounded-2xl border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20">
                            <AlertCircle className="size-4" />
                            <AlertDescription>
                                <p className="font-bold mb-2">Found {allErrors.length} error(s):</p>
                                <ul className="list-disc list-inside space-y-1 text-[11px] sm:text-xs opacity-90">
                                    {allErrors.slice(0, 5).map((error, index) => (
                                        <li key={index}>
                                            Row {error.row}: {error.field} - {error.message}
                                        </li>
                                    ))}
                                    {allErrors.length > 5 && (
                                        <li className="font-bold">...and {allErrors.length - 5} more errors</li>
                                    )}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Success Message */}
                    {parsedData.length > 0 && !hasErrors && !loading && (
                        <Alert className="rounded-2xl border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/20">
                            <CheckCircle2 className="size-4 text-emerald-500" />
                            <AlertDescription className="text-emerald-700 dark:text-emerald-400 font-medium">
                                Successfully parsed {parsedData.length} students. Ready to import!
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Preview Table */}
                    {parsedData.length > 0 && !loading && (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                                <p className="text-xs sm:text-sm font-bold">Preview ({parsedData.length} students)</p>
                            </div>
                            <div className="max-h-[250px] sm:max-h-[350px] overflow-auto">
                                <div className="min-w-[600px] sm:min-w-0">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                                            <TableRow>
                                                <TableHead className="text-[11px] uppercase tracking-wider font-bold">ID</TableHead>
                                                <TableHead className="text-[11px] uppercase tracking-wider font-bold">Name</TableHead>
                                                <TableHead className="text-[11px] uppercase tracking-wider font-bold">Email</TableHead>
                                                <TableHead className="text-[11px] uppercase tracking-wider font-bold">Dept</TableHead>
                                                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-right pr-4">Year</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {parsedData.slice(0, 10).map((student, index) => (
                                                <TableRow key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                                    <TableCell className="font-mono text-[10px] sm:text-xs">
                                                        {student.registerNumber}
                                                    </TableCell>
                                                    <TableCell className="text-[11px] sm:text-sm font-medium">{student.studentName}</TableCell>
                                                    <TableCell className="text-[11px] sm:text-xs text-muted-foreground">{student.email}</TableCell>
                                                    <TableCell className="text-[11px] sm:text-xs">{student.department}</TableCell>
                                                    <TableCell className="text-[11px] sm:text-xs text-right pr-4">{student.year}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {parsedData.length > 10 && (
                                    <div className="p-3 text-center text-[10px] sm:text-xs text-muted-foreground bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                                        ...and {parsedData.length - 10} more students
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setParsedData([]);
                            setParseErrors([]);
                            setValidationErrors([]);
                            setFile(null);
                            onOpenChange(false);
                        }}
                        disabled={importing}
                        className="w-full sm:w-auto rounded-xl font-bold h-11"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={parsedData.length === 0 || hasErrors || importing}
                        className="w-full sm:w-auto rounded-xl font-black h-11 shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        {importing ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="mr-2 size-4" />
                        )}
                        Import {parsedData.length} Students
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
