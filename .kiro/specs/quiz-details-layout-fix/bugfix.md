# Bugfix Requirements Document

## Introduction

The Quiz Details page (`QuizAttemptDetails`) at `/student/quizzes/:quizId/details` was not rendering visibly to the user. The page uses `DashboardLayout` with `fullHeight={true}`, which causes the `<main>` element in `RootLayout` to receive `overflow-hidden` and no padding. In this context, the root wrapper div's `min-h-full` class does not establish a proper height — it collapses because `min-h-full` only works when the parent has an explicit height, not just `overflow-hidden`. This caused the entire page content to be invisible or collapsed.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user navigates to `/student/quizzes/:quizId/details` THEN the system renders an invisible/collapsed layout because `min-h-full` on the root div fails to establish height inside an `overflow-hidden` flex parent

1.2 WHEN the quiz data is still loading and the skeleton state is shown THEN the system also renders an invisible/collapsed skeleton layout for the same reason

### Expected Behavior (Correct)

2.1 WHEN the user navigates to `/student/quizzes/:quizId/details` THEN the system SHALL render the full-height quiz details layout visibly, with the sticky header, sidebar, and question content all properly displayed

2.2 WHEN the quiz data is still loading THEN the system SHALL render the loading skeleton layout visibly at full height, matching the structure of the loaded state

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user views the quiz details page on desktop THEN the system SHALL CONTINUE TO display the sidebar, sticky header, and question navigation correctly

3.2 WHEN the user views the quiz details page on mobile THEN the system SHALL CONTINUE TO display the mobile layout with the sheet-based navigation and scrollable question list

3.3 WHEN the quiz has no submission or an error occurs THEN the system SHALL CONTINUE TO display the error state with the "Details Unavailable" message and back navigation button

3.4 WHEN the user interacts with question navigation (prev/next buttons, sidebar grid) THEN the system SHALL CONTINUE TO scroll to and highlight the selected question correctly
