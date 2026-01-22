# Real-Time Notifications System - Testing Walkthrough

## Overview
This document provides a comprehensive testing guide for the newly implemented bidirectional real-time notification system. All notifications now include sender tracking, action types, and instant delivery.

## Prerequisites
Before testing, ensure:
1. **Database Migration**: Run the notification enhancement migration
2. **Dev Server Running**: Start the application with `npm run dev`
3. **Two Browser Sessions**: Open two different browsers (or incognito + normal) to test real-time delivery
   - Session A: Lecturer account
   - Session B: Student account

## Database Migration

### Step 1: Apply the Migration
The migration file `supabase/migrations/20260122_enhance_notifications.sql` needs to be applied to your Supabase database.

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase/migrations/20260122_enhance_notifications.sql`
5. Click **Run** to execute the migration

**Option B: Using Supabase CLI** (if installed)
```bash
supabase db push
```

### Step 2: Verify Migration
After running the migration, verify the changes:
```sql
-- Check if action_type column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name IN ('action_type', 'sender_id', 'recipient_id');

-- Check type constraint includes 'submission'
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'notifications_type_check';
```

Expected results:
- `action_type` column should exist (type: TEXT)
- `sender_id` column should exist (type: UUID)
- `recipient_id` column should exist (type: UUID)
- Type constraint should include: 'assignment', 'grade', 'announcement', 'message', 'schedule', 'access_request', 'submission', 'general'

---

## Testing Scenarios

### 🎯 Scenario 1: Lecturer → Student (New Assignment)

**Goal**: Verify that students receive instant notifications when a lecturer creates a new assignment.

**Steps**:
1. **Lecturer (Session A)**:
   - Navigate to **Lecturer Dashboard → Assignments**
   - Click **Create New Assignment**
   - Fill in assignment details:
     - Title: "Test Assignment 1"
     - Description: "This is a test assignment"
     - Due Date: Select a future date
     - Select a class with enrolled students
   - Click **Create**

2. **Student (Session B)**:
   - Ensure the student is enrolled in the class selected above
   - Watch the **notification bell icon** in the header
   - **Expected Result**:
     - Bell icon should show unread count (badge with number)
     - A toast notification should appear: "New Assignment Posted"
     - Clicking the bell should show the notification in the popover
     - Notification should display: "New assignment: 'Test Assignment 1' - Due [date]"
     - Clicking the notification should navigate to `/assignments?id=[assignment_id]`

**Verification Checklist**:
- [ ] Notification appears instantly (within 1-2 seconds)
- [ ] Unread count badge updates in real-time
- [ ] Toast notification appears
- [ ] Notification appears in the popover list
- [ ] Clicking notification navigates to the correct assignment
- [ ] Notification is marked as read after clicking

---

### 🎯 Scenario 2: Lecturer → Student (Assignment Update)

**Goal**: Verify that students receive notifications when a lecturer updates an existing assignment.

**Steps**:
1. **Lecturer (Session A)**:
   - Navigate to **Lecturer Dashboard → Assignments**
   - Find the assignment created in Scenario 1
   - Click the **Edit** icon (pencil)
   - Modify the assignment:
     - Change title to "Test Assignment 1 - Updated"
     - Update description or due date
   - Click **Update**

2. **Student (Session B)**:
   - Watch the **notification bell icon**
   - **Expected Result**:
     - Bell icon unread count increases
     - Toast notification: "Assignment Updated"
     - Notification message: "'Test Assignment 1 - Updated' has been updated"
     - Clicking notification navigates to the updated assignment

**Verification Checklist**:
- [ ] Update notification appears instantly
- [ ] Unread count increments
- [ ] Toast notification appears
- [ ] Notification shows in popover
- [ ] Clicking notification navigates correctly
- [ ] Previous "New Assignment" notification still exists

---

### 🎯 Scenario 3: Student → Lecturer (Assignment Submission)

**Goal**: Verify that lecturers receive instant notifications when a student submits an assignment.

**Steps**:
1. **Student (Session B)**:
   - Navigate to **Dashboard → Assignments**
   - Find "Test Assignment 1 - Updated"
   - Click **Submit**
   - Enter submission text or upload a file
   - Click **Submit Assignment**

2. **Lecturer (Session A)**:
   - Watch the **notification bell icon**
   - **Expected Result**:
     - Bell icon shows unread count
     - Toast notification: "New Submission"
     - Notification message: "[Student Name] submitted Test Assignment 1 - Updated"
     - Clicking notification navigates to `/lecturer-assignments?submission=[assignment_id]`

**Verification Checklist**:
- [ ] Submission notification appears instantly
- [ ] Unread count updates
- [ ] Toast notification appears
- [ ] Notification shows student name and assignment title
- [ ] Clicking notification navigates to submissions view
- [ ] Notification is marked as read after clicking

---

### 🎯 Scenario 4: Lecturer → Student (New Message)

**Goal**: Verify bidirectional message notifications work correctly.

**Steps**:
1. **Lecturer (Session A)**:
   - Navigate to **Messages**
   - Select a student or start a new conversation
   - Type a message: "Hello, this is a test message from your lecturer"
   - Press **Send**

2. **Student (Session B)**:
   - Watch the **notification bell icon**
   - **Expected Result**:
     - Bell icon shows unread count
     - Toast notification: "New message from [Lecturer Name]"
     - Notification preview shows first 100 characters of the message
     - Clicking notification navigates to `/messages?conversation=[conversation_id]`

**Verification Checklist**:
- [ ] Message notification appears instantly
- [ ] Unread count updates
- [ ] Toast shows sender name
- [ ] Notification preview is accurate
- [ ] Clicking notification opens the correct conversation
- [ ] Message is visible in the conversation

---

### 🎯 Scenario 5: Student → Lecturer (Reply Message)

**Goal**: Verify lecturers receive message notifications from students.

**Steps**:
1. **Student (Session B)**:
   - Navigate to **Messages**
   - Open the conversation from Scenario 4
   - Type a reply: "Thank you for the message, I received it!"
   - Press **Send**

2. **Lecturer (Session A)**:
   - Watch the **notification bell icon**
   - **Expected Result**:
     - Bell icon shows unread count
     - Toast notification: "New message from [Student Name]"
     - Notification preview shows the message content
     - Clicking notification navigates to the conversation

**Verification Checklist**:
- [ ] Message notification appears instantly
- [ ] Unread count updates
- [ ] Toast shows student name
- [ ] Notification preview is accurate
- [ ] Clicking notification opens the conversation
- [ ] Reply is visible in the conversation

---

### 🎯 Scenario 6: Mark All as Read

**Goal**: Verify the "Mark all as read" functionality works correctly.

**Steps**:
1. **Either Session**:
   - Ensure you have multiple unread notifications
   - Click the **notification bell icon**
   - Click **Mark all as read** button at the bottom of the popover

2. **Expected Result**:
   - All notifications should be marked as read (no blue dot)
   - Unread count badge should disappear or show "0"
   - All notification items should appear in "read" state (lighter background)

**Verification Checklist**:
- [ ] All notifications marked as read instantly
- [ ] Unread count badge updates to 0
- [ ] Visual state of notifications changes
- [ ] No errors in console

---

### 🎯 Scenario 7: Notification Filtering (Student Enrollment)

**Goal**: Verify students only receive notifications for classes they're enrolled in.

**Steps**:
1. **Setup**:
   - Ensure Student B is enrolled in Class A
   - Ensure Student B is NOT enrolled in Class B

2. **Lecturer (Session A)**:
   - Create a new assignment for **Class A**
   - Create a new assignment for **Class B**

3. **Student (Session B)**:
   - Watch notifications
   - **Expected Result**:
     - Should receive notification for Class A assignment
     - Should NOT receive notification for Class B assignment

**Verification Checklist**:
- [ ] Student receives notification for enrolled class
- [ ] Student does NOT receive notification for non-enrolled class
- [ ] No errors in console

---

### 🎯 Scenario 8: Notification Persistence

**Goal**: Verify notifications persist across sessions and page refreshes.

**Steps**:
1. **Either Session**:
   - Ensure you have some unread notifications
   - Note the unread count
   - Refresh the page (F5)

2. **Expected Result**:
   - All notifications should still be visible
   - Unread count should remain the same
   - Read/unread states should be preserved

3. **Close and Reopen Browser**:
   - Close the browser completely
   - Reopen and log in again
   - Navigate to any page

4. **Expected Result**:
   - All notifications should still be visible
   - Unread count should remain the same
   - Read/unread states should be preserved

**Verification Checklist**:
- [ ] Notifications persist after page refresh
- [ ] Unread count persists after page refresh
- [ ] Notifications persist after browser restart
- [ ] Read/unread states are maintained

---

### 🎯 Scenario 9: No Duplicate Notifications

**Goal**: Verify that duplicate notifications are not created.

**Steps**:
1. **Lecturer (Session A)**:
   - Create a new assignment
   - Immediately update the same assignment
   - Update it again

2. **Student (Session B)**:
   - Check notifications
   - **Expected Result**:
     - Should see 1 "New Assignment" notification
     - Should see 2 separate "Assignment Updated" notifications
     - No duplicate notifications with identical content and timestamps

**Verification Checklist**:
- [ ] No duplicate notifications appear
- [ ] Each action creates exactly one notification
- [ ] Unread count is accurate

---

### 🎯 Scenario 10: Notification Navigation

**Goal**: Verify all notification types navigate to the correct pages.

**Steps**:
1. **Test Each Notification Type**:
   - **Assignment Notification**: Should navigate to `/assignments?id=[assignment_id]`
   - **Submission Notification**: Should navigate to `/lecturer-assignments?submission=[assignment_id]`
   - **Message Notification**: Should navigate to `/messages?conversation=[conversation_id]`

2. **Verification**:
   - Click each notification type
   - Verify the correct page loads
   - Verify the correct item is highlighted/selected

**Verification Checklist**:
- [ ] Assignment notifications navigate correctly
- [ ] Submission notifications navigate correctly
- [ ] Message notifications navigate correctly
- [ ] Navigation opens the correct item/conversation
- [ ] Notification is marked as read after navigation

---

## Troubleshooting

### Issue: Notifications not appearing

**Possible Causes**:
1. **Migration not applied**: Verify the `action_type` column exists in the `notifications` table
2. **Real-time not enabled**: Check Supabase dashboard → Database → Replication → ensure `notifications` table is enabled
3. **RLS policies**: Verify RLS policies allow INSERT and SELECT on notifications table
4. **Browser console errors**: Check for JavaScript errors

**Solutions**:
```sql
-- Check if real-time is enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

### Issue: Unread count not updating

**Possible Causes**:
1. **Real-time subscription not working**: Check browser console for subscription errors
2. **State management issue**: Refresh the page to see if count updates

**Solutions**:
- Check browser console for errors
- Verify the `useNotifications` hook is being called
- Check if the UPDATE event subscription is working

### Issue: Notifications appearing for wrong users

**Possible Causes**:
1. **Enrollment filtering not working**: Check `class_students` table
2. **RLS policies incorrect**: Verify policies filter by `recipient_id`

**Solutions**:
```sql
-- Check student enrollments
SELECT * FROM class_students WHERE student_id = '[student_user_id]';

-- Verify notification recipients
SELECT recipient_id, sender_id, type, message 
FROM notifications 
WHERE recipient_id = '[user_id]'
ORDER BY created_at DESC;
```

---

## Database Queries for Debugging

### View all notifications for a user
```sql
SELECT 
    n.id,
    n.type,
    n.action_type,
    n.title,
    n.message,
    n.is_read,
    n.created_at,
    sender.full_name as sender_name,
    recipient.full_name as recipient_name
FROM notifications n
LEFT JOIN profiles sender ON sender.user_id = n.sender_id
LEFT JOIN profiles recipient ON recipient.user_id = n.recipient_id
WHERE n.recipient_id = '[user_id]'
ORDER BY n.created_at DESC
LIMIT 20;
```

### Check notification counts by type
```sql
SELECT 
    type,
    action_type,
    COUNT(*) as count,
    SUM(CASE WHEN is_read THEN 0 ELSE 1 END) as unread_count
FROM notifications
WHERE recipient_id = '[user_id]'
GROUP BY type, action_type
ORDER BY count DESC;
```

### View recent notification activity
```sql
SELECT 
    n.created_at,
    n.type,
    n.action_type,
    sender.full_name as from_user,
    recipient.full_name as to_user,
    n.title,
    n.is_read
FROM notifications n
LEFT JOIN profiles sender ON sender.user_id = n.sender_id
LEFT JOIN profiles recipient ON recipient.user_id = n.recipient_id
ORDER BY n.created_at DESC
LIMIT 50;
```

---

## Success Criteria

The notification system is working correctly if:

✅ **Real-time Delivery**: Notifications appear within 1-2 seconds of the triggering action
✅ **Accurate Counts**: Unread count badge always shows the correct number
✅ **Bidirectional**: Both lecturers and students can send and receive notifications
✅ **Filtered**: Students only see notifications for enrolled classes
✅ **Persistent**: Notifications survive page refreshes and browser restarts
✅ **No Duplicates**: Each action creates exactly one notification
✅ **Correct Navigation**: Clicking notifications navigates to the correct page/item
✅ **Read States**: Marking as read updates instantly and persists
✅ **No Errors**: No console errors or database errors

---

## Next Steps (Future Enhancements)

The following notification types can be added in the future:

1. **Schedule Notifications**: Lecturer adds/updates a schedule → student notification
2. **Class Invitation**: Student accepts/rejects invitation → lecturer notification
3. **Grade Notifications**: Lecturer grades assignment → student notification
4. **Announcement Notifications**: Lecturer posts announcement → student notification
5. **Resubmission Notifications**: Student resubmits assignment → lecturer notification
6. **Comment Notifications**: User comments on assignment → notification to relevant parties

Each of these follows the same pattern established in this implementation.

---

## Support

If you encounter any issues during testing:
1. Check the browser console for errors
2. Verify the database migration was applied correctly
3. Check Supabase logs for any database errors
4. Review the RLS policies to ensure proper access control
5. Test with a fresh browser session (clear cache/cookies)

For additional help, refer to:
- Supabase Documentation: https://supabase.com/docs
- React Query Documentation: https://tanstack.com/query/latest
- Project README: `README.md`
