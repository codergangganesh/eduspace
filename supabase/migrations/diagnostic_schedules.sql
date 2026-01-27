-- =====================================================
-- Diagnostic: Check Schedule Data
-- =====================================================

-- Check if there are any schedules
SELECT 
    id,
    title,
    class_id,
    subject_id,
    course_id,
    lecturer_id,
    day_of_week,
    start_time,
    end_time
FROM public.schedules
LIMIT 10;

-- Check if schedules have class_id populated
SELECT 
    COUNT(*) as total_schedules,
    COUNT(class_id) as schedules_with_class_id,
    COUNT(*) - COUNT(class_id) as schedules_without_class_id
FROM public.schedules;

-- If you have old schedules without class_id, they won't show up
-- because the new filtering requires class_id

-- To fix old schedules, you need to assign them to classes
-- This is a manual process based on your data
