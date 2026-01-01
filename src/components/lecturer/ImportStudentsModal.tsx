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
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Students from Excel</DialogTitle>
                    <DialogDescription>
                        Upload an Excel file to bulk import students into this class
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Download Template Button */}
                    <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet className="size-5 text-primary" />
                            <div>
                                <p className="text-sm font-medium">Need a template?</p>
                                <p className="text-xs text-muted-foreground">Download our Excel template with sample data</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={generateTemplate}
                            className="gap-2"
                        >
                            <Download className="size-4" />
                            Download Template
                        </Button>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label
                            htmlFor="file-upload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="size-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
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
                            <p className="text-sm text-muted-foreground">
                                Selected: <span className="font-medium">{file.name}</span>
                            </p>
                        )}
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="size-6 animate-spin text-primary" />
                            <span className="ml-2 text-sm text-muted-foreground">Parsing file...</span>
                        </div>
                    )}

                    {/* Errors */}
                    {hasErrors && !loading && (
                        <Alert variant="destructive">
                            <AlertCircle className="size-4" />
                            <AlertDescription>
                                <p className="font-semibold mb-2">Found {allErrors.length} error(s):</p>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                    {allErrors.slice(0, 5).map((error, index) => (
                                        <li key={index}>
                                            Row {error.row}: {error.field} - {error.message}
                                        </li>
                                    ))}
                                    {allErrors.length > 5 && (
                                        <li>...and {allErrors.length - 5} more errors</li>
                                    )}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Success Message */}
                    {parsedData.length > 0 && !hasErrors && !loading && (
                        <Alert>
                            <CheckCircle2 className="size-4 text-emerald-500" />
                            <AlertDescription>
                                Successfully parsed {parsedData.length} students. Ready to import!
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Preview Table */}
                    {parsedData.length > 0 && !loading && (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-secondary px-4 py-2 border-b">
                                <p className="text-sm font-medium">Preview ({parsedData.length} students)</p>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Register #</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Year</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.slice(0, 10).map((student, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-mono text-xs">
                                                    {student.registerNumber}
                                                </TableCell>
                                                <TableCell>{student.studentName}</TableCell>
                                                <TableCell className="text-xs">{student.email}</TableCell>
                                                <TableCell>{student.department}</TableCell>
                                                <TableCell>{student.year}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {parsedData.length > 10 && (
                                    <div className="p-2 text-center text-xs text-muted-foreground bg-secondary">
                                        ...and {parsedData.length - 10} more students
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setParsedData([]);
                            setParseErrors([]);
                            setValidationErrors([]);
                            setFile(null);
                            onOpenChange(false);
                        }}
                        disabled={importing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={parsedData.length === 0 || hasErrors || importing}
                    >
                        {importing && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Import {parsedData.length} Students
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
