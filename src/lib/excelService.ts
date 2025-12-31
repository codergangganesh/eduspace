import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface StudentData {
    studentName: string;
    registerNumber: string;
    email: string;
    department?: string;
    course?: string;
    year?: string;
    section?: string;
    phone?: string;
}

export interface ValidationError {
    row: number;
    field: string;
    message: string;
}

export interface ParseResult {
    data: StudentData[];
    errors: ValidationError[];
    isValid: boolean;
}

/**
 * Generate and download Excel template for student import
 */
export function generateTemplate(): void {
    const headers = [
        'Student Name*',
        'Register Number*',
        'Email*',
        'Department',
        'Course',
        'Year',
        'Section',
        'Phone'
    ];

    const sampleData = [
        ['John Doe', '2024001', 'john.doe@example.com', 'Computer Science', 'B.Tech CS', '2', 'A', '+1234567890'],
        ['Jane Smith', '2024002', 'jane.smith@example.com', 'Electronics', 'B.Tech ECE', '3', 'B', '+1234567891']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

    // Set column widths
    worksheet['!cols'] = [
        { wch: 20 }, // Student Name
        { wch: 18 }, // Register Number
        { wch: 30 }, // Email
        { wch: 20 }, // Department
        { wch: 15 }, // Course
        { wch: 8 },  // Year
        { wch: 10 }, // Section
        { wch: 15 }  // Phone
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveAs(data, 'student_import_template.xlsx');
}

/**
 * Parse uploaded Excel file and validate data
 */
export function parseExcelFile(file: File): Promise<ParseResult> {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                if (jsonData.length < 2) {
                    resolve({
                        data: [],
                        errors: [{ row: 0, field: 'file', message: 'File is empty or has no data rows' }],
                        isValid: false
                    });
                    return;
                }

                // Parse and validate
                const result = validateStudentData(jsonData);
                resolve(result);
            } catch (error) {
                resolve({
                    data: [],
                    errors: [{ row: 0, field: 'file', message: 'Failed to parse Excel file' }],
                    isValid: false
                });
            }
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Validate parsed student data
 */
function validateStudentData(jsonData: any[][]): ParseResult {
    const errors: ValidationError[] = [];
    const students: StudentData[] = [];
    const registerNumbers = new Set<string>();
    const emails = new Set<string>();

    // Skip header row
    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 1;

        // Skip empty rows
        if (!row || row.every(cell => !cell)) continue;

        const studentName = row[0]?.toString().trim();
        const registerNumber = row[1]?.toString().trim();
        const email = row[2]?.toString().trim();
        const department = row[3]?.toString().trim();
        const course = row[4]?.toString().trim();
        const year = row[5]?.toString().trim();
        const section = row[6]?.toString().trim();
        const phone = row[7]?.toString().trim();

        // Validate required fields
        if (!studentName) {
            errors.push({ row: rowNumber, field: 'Student Name', message: 'Student Name is required' });
        }

        if (!registerNumber) {
            errors.push({ row: rowNumber, field: 'Register Number', message: 'Register Number is required' });
        } else if (registerNumbers.has(registerNumber)) {
            errors.push({ row: rowNumber, field: 'Register Number', message: `Duplicate Register Number: ${registerNumber}` });
        } else {
            registerNumbers.add(registerNumber);
        }

        if (!email) {
            errors.push({ row: rowNumber, field: 'Email', message: 'Email is required' });
        } else if (!isValidEmail(email)) {
            errors.push({ row: rowNumber, field: 'Email', message: 'Invalid email format' });
        } else if (emails.has(email)) {
            errors.push({ row: rowNumber, field: 'Email', message: `Duplicate Email: ${email}` });
        } else {
            emails.add(email);
        }

        // If row has critical errors, skip adding to data
        if (!studentName || !registerNumber || !email) {
            continue;
        }

        students.push({
            studentName,
            registerNumber,
            email,
            department: department || '',
            course: course || '',
            year: year || '',
            section: section || '',
            phone: phone || ''
        });
    }

    return {
        data: students,
        errors,
        isValid: errors.length === 0
    };
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Export students data to Excel
 */
export function exportStudentsToExcel(students: StudentData[], filename: string = 'students_export.xlsx'): void {
    const headers = [
        'Student Name',
        'Register Number',
        'Email',
        'Department',
        'Course',
        'Year',
        'Section',
        'Phone'
    ];

    const data = students.map(s => [
        s.studentName,
        s.registerNumber,
        s.email,
        s.department || '',
        s.course || '',
        s.year || '',
        s.section || '',
        s.phone || ''
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    worksheet['!cols'] = [
        { wch: 20 }, { wch: 18 }, { wch: 30 }, { wch: 20 },
        { wch: 15 }, { wch: 8 }, { wch: 10 }, { wch: 15 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveAs(blob, filename);
}
