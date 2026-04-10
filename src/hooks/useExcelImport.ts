import ExcelJS from 'exceljs';

export interface StudentData {
    registerNumber: string;
    studentName: string;
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

export function useExcelImport() {
    const parseExcelFile = async (file: File): Promise<{ data: StudentData[]; errors: ValidationError[] }> => {
        try {
            const buffer = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);

            const worksheet = workbook.worksheets[0];
            const students: StudentData[] = [];
            const errors: ValidationError[] = [];

            // Build header map from first row
            const headerRow = worksheet.getRow(1);
            const headers: Record<number, string> = {};
            headerRow.eachCell((cell, colNumber) => {
                headers[colNumber] = String(cell.value ?? '');
            });

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // skip header

                const rowData: Record<string, any> = {};
                row.eachCell((cell, colNumber) => {
                    rowData[headers[colNumber]] = cell.value;
                });

                // Validate required fields
                if (!rowData['Register Number'] && !rowData['registerNumber']) {
                    errors.push({ row: rowNumber, field: 'Register Number', message: 'Register Number is required' });
                }
                if (!rowData['Student Name'] && !rowData['studentName']) {
                    errors.push({ row: rowNumber, field: 'Student Name', message: 'Student Name is required' });
                }

                const email = rowData['Email'] || rowData['email'];
                if (!email) {
                    errors.push({ row: rowNumber, field: 'Email', message: 'Email is required' });
                } else {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                        errors.push({ row: rowNumber, field: 'Email', message: 'Invalid email format' });
                    }
                }

                if (
                    (rowData['Register Number'] || rowData['registerNumber']) &&
                    (rowData['Student Name'] || rowData['studentName']) &&
                    email
                ) {
                    students.push({
                        registerNumber: String(rowData['Register Number'] || rowData['registerNumber']),
                        studentName: String(rowData['Student Name'] || rowData['studentName']),
                        email: String(email),
                        department: String(rowData['Department'] || rowData['department'] || ''),
                        course: String(rowData['Course'] || rowData['course'] || ''),
                        year: String(rowData['Year'] || rowData['year'] || ''),
                        section: String(rowData['Section'] || rowData['section'] || ''),
                        phone: String(rowData['Phone'] || rowData['phone'] || ''),
                    });
                }
            });

            return { data: students, errors };
        } catch (error) {
            throw error;
        }
    };

    const validateStudentData = (students: StudentData[]): ValidationError[] => {
        const errors: ValidationError[] = [];
        const registerNumbers = new Set<string>();
        const emails = new Set<string>();

        students.forEach((student, index) => {
            const rowNumber = index + 2;

            // Check for duplicate register numbers
            if (registerNumbers.has(student.registerNumber)) {
                errors.push({
                    row: rowNumber,
                    field: 'Register Number',
                    message: `Duplicate register number: ${student.registerNumber}`,
                });
            } else {
                registerNumbers.add(student.registerNumber);
            }

            // Check for duplicate emails
            if (emails.has(student.email)) {
                errors.push({
                    row: rowNumber,
                    field: 'Email',
                    message: `Duplicate email: ${student.email}`,
                });
            } else {
                emails.add(student.email);
            }
        });

        return errors;
    };

    const generateTemplate = async () => {
        const workbook = new ExcelJS.Workbook();

        // Students sheet
        const studentSheet = workbook.addWorksheet('Students');
        studentSheet.columns = [
            { header: 'Register Number', key: 'registerNumber', width: 18 },
            { header: 'Student Name',    key: 'studentName',    width: 22 },
            { header: 'Email',           key: 'email',          width: 28 },
            { header: 'Department',      key: 'department',     width: 20 },
            { header: 'Course',          key: 'course',         width: 15 },
            { header: 'Year',            key: 'year',           width: 10 },
            { header: 'Section',         key: 'section',        width: 10 },
            { header: 'Phone',           key: 'phone',          width: 16 },
        ];
        studentSheet.addRow({
            registerNumber: '2024001',
            studentName: 'John Doe',
            email: 'john.doe@example.com',
            department: 'Computer Science',
            course: 'B.Tech',
            year: '2024',
            section: 'A',
            phone: '+1234567890',
        });

        // Instructions sheet
        const instructionsSheet = workbook.addWorksheet('Instructions');
        instructionsSheet.columns = [{ header: 'Instruction', key: 'instruction', width: 60 }];
        [
            'Fill in student details in the Students sheet',
            'Register Number, Student Name, and Email are required fields',
            'Other fields are optional',
            'Do not modify the column headers',
            'Save the file and upload it to import students',
        ].forEach(text => instructionsSheet.addRow({ instruction: text }));

        // Trigger download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_import_template.xlsx';
        a.click();
        URL.revokeObjectURL(url);
    };

    return {
        parseExcelFile,
        validateStudentData,
        generateTemplate,
    };
}
