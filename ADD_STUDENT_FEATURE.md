# Add Student Feature Documentation

## Overview
This feature allows lecturers to manually add individual students to their classes as an alternative to importing students via Excel. The manually added student follows the exact same workflow as Excel-imported students, including automatic join request sending and real-time notifications.

## Feature Location
**Path**: Lecturer Dashboard → All Students → Classes → [Select Class]

## User Interface

### Add Student Button
- **Location**: Header section, next to "Import Excel" button
- **Icon**: UserPlus icon
- **Label**: "Add Student"
- **Style**: Outline button variant

### Add Student Modal
The modal contains a form with the following fields:

#### Required Fields (marked with *)
1. **Student Name**: Full name of the student
2. **Email**: Student's email address (validated for correct format)
3. **Register Number**: Student's registration/roll number

#### Optional Fields
4. **Department**: Student's department (e.g., Computer Science)
5. **Year**: Academic year (e.g., 2nd Year)
6. **Section**: Class section (e.g., A, B)
7. **Phone Number**: Contact number

## Technical Implementation

### Files Created/Modified

#### New Files
1. **`src/components/lecturer/AddStudentModal.tsx`**
   - Modal component with form validation
   - Handles user input and submission
   - Displays loading states and error messages

#### Modified Files
2. **`src/pages/AllStudents.tsx`**
   - Added import for AddStudentModal
   - Added state management for modal visibility
   - Added `handleAddStudent` function
   - Added "Add Student" button in header
   - Integrated modal component

### Data Flow

```
1. Lecturer clicks "Add Student" button
   ↓
2. Modal opens with empty form
   ↓
3. Lecturer fills in student details
   ↓
4. Form validation runs (client-side)
   ↓
5. Student data sent to handleAddStudent()
   ↓
6. Student added to class_students table
   ↓
7. Access request automatically sent
   ↓
8. Student receives real-time notification
   ↓
9. Modal closes, success toast shown
   ↓
10. Student list refreshes automatically
```

### Database Integration

#### class_students Table
When a student is added manually, the following record is created:

```typescript
{
    class_id: string,              // Current class ID
    student_id: null,              // Filled when student accepts
    register_number: string,       // From form
    student_name: string,          // From form
    email: string,                 // From form (lowercase)
    department: string | null,     // From form (optional)
    course: null,                  // Not used for manual entry
    year: string | null,           // From form (optional)
    section: string | null,        // From form (optional)
    phone: string | null,          // From form (optional)
    import_source: 'manual',       // Identifies manual entry
    added_at: timestamp            // Auto-generated
}
```

#### access_requests Table
Automatically created after student addition:

```typescript
{
    class_id: string,              // Current class ID
    student_email: string,         // Student's email
    status: 'pending',             // Initial status
    created_at: timestamp,         // Auto-generated
    // ... other fields
}
```

### Validation Rules

#### Client-Side Validation
1. **Student Name**: Required, cannot be empty
2. **Email**: Required, must match email regex pattern
3. **Register Number**: Required, cannot be empty
4. **Other Fields**: Optional, no validation

#### Email Validation Pattern
```javascript
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

### Error Handling

#### Validation Errors
- Displayed via toast notifications
- Form submission prevented
- Specific error messages for each field

#### Database Errors
- Caught and logged to console
- User-friendly error message shown
- Modal remains open for correction
- Transaction rolled back if needed

### Real-Time Behavior

#### Student Side
1. **Notification Created**: Immediately after access request sent
2. **Notification Type**: `class_join_request`
3. **Popup Displayed**: Join request invitation modal
4. **Actions Available**: Accept or Reject

#### Lecturer Side
1. **Student List Updates**: Real-time via Supabase subscription
2. **Status Badge Updates**: Automatically reflects request status
3. **Access Requests Refresh**: After student addition

### Status Workflow

```
Manual Addition
    ↓
Status: "Not Sent" (brief)
    ↓
Auto-send Request
    ↓
Status: "Pending"
    ↓
Student Response
    ↓
Status: "Accepted" or "Rejected"
```

### Integration Points

#### 1. useClassStudents Hook
- **Function**: `addStudent(studentData)`
- **Returns**: `{ success: boolean, data?: any, error?: string }`
- **Updates**: Student list via real-time subscription

#### 2. useAccessRequests Hook
- **Function**: `sendAccessRequest(classId, email)`
- **Creates**: Access request record
- **Triggers**: Real-time notification to student

#### 3. Notification System
- **Type**: `class_join_request`
- **Recipient**: Student (via email match)
- **Content**: Class details, lecturer info, action buttons

### Permissions & Access Control

#### Who Can Add Students
- ✅ Lecturers (role: 'lecturer')
- ✅ Admins (role: 'admin')
- ❌ Students (role: 'student')

#### Required Conditions
- User must be authenticated
- User must have access to the class
- Class ID must be valid

### Feature Parity with Excel Import

| Feature | Excel Import | Manual Add |
|---------|-------------|------------|
| Student added to class_students | ✅ | ✅ |
| Auto-send join request | ✅ | ✅ |
| Real-time notification | ✅ | ✅ |
| Invitation popup | ✅ | ✅ |
| Accept/Reject workflow | ✅ | ✅ |
| Access to class content (when accepted) | ✅ | ✅ |
| Status tracking | ✅ | ✅ |
| Data persistence | ✅ | ✅ |
| Import source tracking | excel | manual |

### User Experience

#### Success Flow
1. Click "Add Student" button
2. Fill in required fields (name, email, register number)
3. Optionally fill additional fields
4. Click "Add Student" button in modal
5. See loading state ("Adding Student...")
6. Modal closes automatically
7. Success toast: "Student Added - [Name] has been added and a join request has been sent."
8. Student appears in list with "Pending" status

#### Error Flow
1. Click "Add Student" button
2. Fill in fields with invalid data
3. Click "Add Student" button in modal
4. See validation error toast
5. Correct the data
6. Retry submission

### Testing Checklist

#### Functional Tests
- [ ] Add Student button visible in header
- [ ] Modal opens when button clicked
- [ ] All form fields render correctly
- [ ] Required field validation works
- [ ] Email format validation works
- [ ] Student successfully added to database
- [ ] Access request automatically sent
- [ ] Student receives notification
- [ ] Student list updates in real-time
- [ ] Status badge shows "Pending"
- [ ] Modal closes on success
- [ ] Form resets after submission

#### Integration Tests
- [ ] Student can accept invitation
- [ ] Student can reject invitation
- [ ] Accepted student gains class access
- [ ] Rejected student cannot access class
- [ ] Lecturer can resend request
- [ ] Data persists after refresh
- [ ] Works alongside Excel import
- [ ] No conflicts with existing students

#### Edge Cases
- [ ] Duplicate email handling
- [ ] Invalid email format
- [ ] Empty required fields
- [ ] Very long names/emails
- [ ] Special characters in names
- [ ] Network errors during submission
- [ ] Concurrent additions
- [ ] Modal cancel behavior

### Maintenance Notes

#### Future Enhancements
1. **Bulk Manual Add**: Add multiple students via form
2. **Template Import**: Save student templates
3. **Auto-complete**: Suggest previously added students
4. **Duplicate Detection**: Warn before adding duplicate emails
5. **Import History**: Track who added which students
6. **Batch Operations**: Add and send requests in batch

#### Known Limitations
1. Cannot add students without email
2. No duplicate email check (handled by database constraints)
3. Phone number not validated for format
4. Department/Year/Section are free-text (no dropdown)

### Troubleshooting

#### Student Not Receiving Notification
**Check**:
1. Email address is correct
2. Student has an account with that email
3. Notification settings enabled
4. Real-time subscription active

#### Student Not Appearing in List
**Check**:
1. Correct class selected
2. Page refreshed
3. No filter hiding the student
4. Database record created successfully

#### Access Request Not Sent
**Check**:
1. Network connection
2. Supabase connection
3. Console for errors
4. access_requests table for record

### Code References

#### Key Functions
```typescript
// AllStudents.tsx
const handleAddStudent = async (studentData: any) => {
    // Adds student and sends request
}

// AddStudentModal.tsx
const handleSubmit = async (e: React.FormEvent) => {
    // Validates and submits form
}

// useClassStudents.ts
const addStudent = async (studentData) => {
    // Inserts into database
}

// useAccessRequests.ts
const sendAccessRequest = async (classId, email) => {
    // Creates access request
}
```

## Summary

This feature provides lecturers with a quick, convenient way to add individual students to their classes without needing to prepare an Excel file. The implementation maintains complete feature parity with Excel imports, ensuring a consistent experience for both lecturers and students. All data is properly validated, persisted, and synchronized in real-time across the application.
