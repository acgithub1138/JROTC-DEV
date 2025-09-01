# Lessons Learned: Modal to Page Conversion

## Key Lessons from Converting Modals to Full Pages

### 1. Form Data Loading and Initialization
**Issue**: When loading existing data in forms, initial state may be empty while async data loads.
**Solution**: Use `useEffect` to reinitialize form state when async data becomes available, and show loading states while data is being fetched.

**Implementation**:
```typescript
// Reinitialize form data when competition data becomes available
useEffect(() => {
  if (existingCompetition && (isEditMode || isViewMode)) {
    const updatedData: FormData = {
      // Map all fields from existing data
    };
    setFormData(updatedData);
  }
}, [existingCompetition, isEditMode, isViewMode]);

// Show loading state while waiting for data
if ((isEditMode || isViewMode) && competitionId && !existingCompetition) {
  return <LoadingComponent />;
}
```

### 2. Unsaved Changes Detection
**Issue**: Need to track changes between initial and current form state across page navigation.
**Solution**: Implement `useUnsavedChanges` hook with proper initial data reference.

**Key Points**:
- Use current form data as initial when editing existing records
- Disable tracking in view mode
- Handle dialog confirmation before navigation

### 3. URL Parameter Management
**Issue**: Pages need to handle different modes (create, edit, view) via URL parameters.
**Solution**: Use `useSearchParams` to extract mode and ID parameters.

**Implementation**:
```typescript
const [searchParams] = useSearchParams();
const competitionId = searchParams.get('id');
const mode = searchParams.get('mode') as 'create' | 'edit' | 'view';
```

### 4. Navigation and Routing
**Issue**: Converting from modal popup to full page requires proper routing setup.
**Solution**: 
- Add route configuration in router
- Implement proper navigation with back buttons
- Handle breadcrumb navigation

### 5. Form State Management
**Issue**: Complex forms need proper state management across different modes.
**Solution**: 
- Single form data state with comprehensive type definition
- Mode-specific form initialization
- Proper validation and submission handling

### 6. Loading States and User Experience
**Issue**: Users need feedback while async operations are in progress.
**Solution**: 
- Implement loading states for data fetching
- Show loading indicators during form submission
- Provide clear success/error feedback

### 7. Permission Handling
**Issue**: Different users may have different permissions for view/edit operations.
**Solution**: 
- Check permissions early in component lifecycle
- Conditionally render form elements based on permissions
- Disable form interactions in view mode

### 8. Component Architecture
**Issue**: Large forms can become unwieldy in a single component.
**Solution**: 
- Break down into focused, reusable components
- Use composition over monolithic components
- Separate concerns (data fetching, form logic, UI rendering)

### 9. Error Handling
**Issue**: Network errors and validation errors need proper handling in full page context.
**Solution**: 
- Implement comprehensive error boundaries
- Show user-friendly error messages
- Provide retry mechanisms for failed operations

### 10. Mobile Responsiveness
**Issue**: Full pages need to work across all device sizes.
**Solution**: 
- Use responsive design patterns
- Test on mobile devices
- Ensure proper touch interactions

## Best Practices Summary

1. **Always show loading states** when fetching data for edit/view modes
2. **Reinitialize form data** when async data loads
3. **Track unsaved changes** properly with correct initial data reference
4. **Handle all navigation scenarios** including back navigation and browser refresh
5. **Implement proper error handling** at all levels
6. **Use URL parameters** for mode and entity identification
7. **Test across devices** and screen sizes
8. **Provide clear user feedback** for all operations
9. **Structure components** for reusability and maintainability
10. **Handle permissions** consistently across all modes