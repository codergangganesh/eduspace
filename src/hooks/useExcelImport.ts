import * as XLSX from 'xlsx';

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
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    const students: StudentData[] = [];
                    const errors: ValidationError[] = [];

                    jsonData.forEach((row: any, index: number) => {
                        const rowNumber = index + 2; // +2 because Excel is 1-indexed and has header row

                        // Validate required fields
                        if (!row['Register Number'] && !row['registerNumber']) {
                            errors.push({
                                row: rowNumber,
                                field: 'Register Number',
                                message: 'Register Number is required',
                            });
                        }

                        if (!row['Student Name'] && !row['studentName']) {
                            errors.push({
                                row: rowNumber,
                                field: 'Student Name',
                                message: 'Student Name is required',
                            });
                        }

                        if (!row['Email'] && !row['email']) {
                            errors.push({
                                row: rowNumber,
                                field: 'Email',
                                message: 'Email is required',
                            });
                        } else {
                            const email = row['Email'] || row['email'];
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            if (!emailRegex.test(email)) {
                                errors.push({
                                    row: rowNumber,
                                    field: 'Email',
                                    message: 'Invalid email format',
                                });
                            }
                        }

                        // If no critical errors, add student
                        if (
                            (row['Register Number'] || row['registerNumber']) &&
                            (row['Student Name'] || row['studentName']) &&
                            (row['Email'] || row['email'])
                        ) {
                            students.push({
                                registerNumber: row['Register Number'] || row['registerNumber'],
                                studentName: row['Student Name'] || row['studentName'],
                                email: row['Email'] || row['email'],
                                department: row['Department'] || row['department'] || '',
                                course: row['Course'] || row['course'] || '',
                                year: row['Year'] || row['year'] || '',
                                section: row['Section'] || row['section'] || '',
                                phone: row['Phone'] || row['phone'] || '',
                            });
                        }
                    });

                    resolve({ data: students, errors });
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsBinaryString(file);
        });
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

    const generateTemplate = () => {
        const template = [
            {
                'Register Number': '2024001',
                'Student Name': 'John Doe',
                'Email': 'john.doe@example.com',
                'Department': 'Computer Science',
                'Course': 'B.Tech',
                'Year': '2024',
                'Section': 'A',
                'Phone': '+1234567890',
            },
        ];

        const worksheet = XLSX.utils.json_to_sheet(template);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

        // Add instructions sheet
        const instructions = [
            { Instruction: 'Fill in student details in the Students sheet' },
            { Instruction: 'Register Number, Student Name, and Email are required fields' },
            { Instruction: 'Other fields are optional' },
            { Instruction: 'Do not modify the column headers' },
            { Instruction: 'Save the file and upload it to import students' },
        ];

        const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
        XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

        // Download file
        XLSX.writeFile(workbook, 'student_import_template.xlsx');
    };

    return {
        parseExcelFile,
        validateStudentData,
        generateTemplate,
    };
}
