# Mobile Judge Event Feature - Replication Guide

This document provides all the details needed to replicate the mobile judging event functionality to another project.

---

## Overview

The mobile judge event flow is a multi-step wizard that walks judges through:
1. **Event Confirmation** - Verify the correct event
2. **School Selection** - Choose which school to judge  
3. **Judge Number Selection** - Pick judge # and audio recording mode
4. **Score Entry** - Answer all scoring questions with collapsible accordions
5. **Review & Submit** - Review answers and submit the score sheet

---

## File Structure

```
src/
├── pages/
│   └── MobileJudgeEventPage.tsx              # Main page orchestrator
│
├── components/judges-portal/mobile/
│   ├── EventConfirmationStep.tsx             # Step 1: Confirm event details
│   ├── SchoolSelectionStep.tsx               # Step 2: Select school to judge
│   ├── JudgeNumberStep.tsx                   # Step 3: Select judge # + audio mode
│   ├── AllQuestionsStep.tsx                  # Step 4: Collapsible question cards
│   ├── ReviewSubmitStep.tsx                  # Step 5: Review answers, submit
│   ├── MobileNavButtons.tsx                  # Fixed bottom nav (prev/next)
│   ├── ScoreButtonGrid.tsx                   # 0-10 button grid for scoring
│   ├── AudioRecordingControls.tsx            # Mic button with pause/resume
│   ├── AudioRecordingModeSelector.tsx        # None/Manual/Auto selector
│   └── ProgressIndicator.tsx                 # Progress dots (optional)
│
├── hooks/
│   ├── useAudioRecording.ts                  # Audio recording state machine
│   └── judges-portal/
│       ├── useJudgeEventDetails.ts           # Fetch event + registered schools
│       └── useEventScoreSheets.ts            # Check which schools already judged
│
├── hooks/attachments/
│   └── useAttachments.ts                     # Upload audio as attachment
│
├── utils/
│   └── scoreCalculations.ts                  # Total score + penalty calculations
│
└── components/competition-management/components/json-field-builder/
    └── types.ts                              # JsonField type definition
```

---

## Database Tables Required

### 1. `competition_events` - Stores submitted score sheets
```sql
id: uuid PRIMARY KEY
school_id: uuid REFERENCES schools(id)
event: uuid REFERENCES competition_event_types(id)  
competition_id: uuid (internal competition, nullable)
source_competition_id: uuid (portal competition ID)
source_type: enum ('portal', 'internal')
score_sheet: jsonb {
  template_id: string,
  judge_number: string,
  scores: { [fieldId]: value },
  calculated_at: timestamp
}
total_points: number
cadet_ids: string[]
created_by: uuid
created_at, updated_at: timestamp
```

### 2. `cp_comp_events` - Competition event configuration
```sql
id: uuid PRIMARY KEY
competition_id: uuid
event: uuid REFERENCES competition_event_types(id)
score_sheet: uuid REFERENCES competition_templates(id)
start_time, end_time: timestamp
location: text
judges_needed: number
```

### 3. `competition_templates` - Score sheet templates
```sql
id: uuid PRIMARY KEY
event: uuid REFERENCES competition_event_types(id)
template_name: text
jrotc_program: enum
judges: number (how many judges)
scores: jsonb {
  criteria: JsonField[]
}
```

### 4. `cp_event_registrations` - Schools registered for events
```sql
id: uuid PRIMARY KEY
competition_id: uuid
event_id: uuid
school_id: uuid
status: text ('registered', etc)
```

### 5. `cp_event_schedules` - Scheduled times for schools
```sql
id: uuid PRIMARY KEY
competition_id: uuid
event_id: uuid
school_id: uuid
scheduled_time: timestamp
```

### 6. `cp_comp_schools` - Schools registered for competition
```sql
school_id: uuid
school_name: text
competition_id: uuid
```

### 7. `attachments` - Audio recordings storage
```sql
id: uuid PRIMARY KEY
record_type: text ('competition_event')
record_id: uuid
file_name: text
file_path: text
file_size: number
file_type: text
school_id: uuid
uploaded_by: uuid
```

---

## Type Definitions

### JsonField (Score Sheet Field)
```typescript
export interface JsonField {
  id: string;
  name: string;
  type: 'text' | 'dropdown' | 'number' | 'section_header' | 'calculated' | 
        'label' | 'bold_gray' | 'pause' | 'penalty' | 'penalty_checkbox' | 'scoring_scale';
  fieldInfo?: string;           // Help text under field
  textType?: 'short' | 'notes'; // For text fields
  values?: string[];            // Dropdown options
  maxValue?: number;            // For number fields (0-maxValue grid)
  penalty: boolean;             // Legacy flag
  pauseField: boolean;          // Pause formatting
  penaltyValue?: number;        // Fixed penalty amount
  penaltyType?: 'points' | 'minor_major' | 'split';
  pointValue?: number;          // For points-based penalties
  splitFirstValue?: number;     // 1st occurrence penalty
  splitSubsequentValue?: number;// 2+ occurrences penalty
  scaleRanges?: {               // For scoring_scale type
    poor: { min: number; max: number };
    average: { min: number; max: number };
    exceptional: { min: number; max: number };
  };
  calculationType?: 'sum' | 'subtotal';
  calculationFields?: string[];
}
```

### AudioMode & RecordingState
```typescript
export type AudioMode = 'none' | 'manual' | 'auto';
export type RecordingState = 'idle' | 'recording' | 'paused';
```

---

## Key Features

### 1. Multi-Step Wizard Navigation
- Fixed bottom navigation bar with prev/next buttons
- Step state managed in parent component
- Transition animations between steps
- Scroll to top on step change

### 2. School Selection with Status
- Shows all registered schools
- Green checkmark for already-judged schools (filtered out)
- Displays scheduled time if available
- Search/filter functionality

### 3. Judge Number + Audio Mode
- Grid of judge buttons (1-N based on template.judges)
- Audio mode selector: None, Manual, Auto
- Settings persisted to localStorage per user

### 4. Collapsible Question Cards
- All questions on single scrollable page
- Each question is a collapsible card
- Auto-expand next question after answering
- Smart scrolling to keep context visible
- Shows answered value in badge when collapsed

### 5. Field Type Handling
- **number**: 0-10 button grid (ScoreButtonGrid)
- **dropdown**: Radio-style card list
- **text**: Input or textarea based on textType
- **scoring_scale**: 0-10 grid with Poor/Average/Exceptional labels
- **penalty/penalty_checkbox**: 
  - minor_major: None/Minor(-20)/Major(-50) cards
  - points: +/- stepper with penalty value
  - split: 1st occurrence vs 2+ calculation
  - Only shown to Judge 1

### 6. Audio Recording
- Three modes: None, Manual, Auto
- Auto mode starts recording on questions step
- Pauses automatically on review step
- Recording uploaded as attachment after submit
- Uses MediaRecorder API with WebM/Opus codec

### 7. Score Calculation
- Real-time total displayed in corner
- Handles all field types including penalties
- Shared utility function for consistency

---

## Component Details

### MobileJudgeEventPage.tsx
Main orchestrator that:
- Fetches event details and registered schools
- Manages wizard step state (0-4)
- Manages answers state
- Handles audio recording lifecycle
- Submits to database on completion
- Uploads audio attachment

### EventConfirmationStep.tsx
Simple confirmation card showing:
- Event name
- Event time (formatted)
- Event location
- Exit and Next buttons

### SchoolSelectionStep.tsx
- Search input to filter schools
- Card list with radio selection
- Shows scheduled time per school
- Filters out already-judged schools
- Next disabled until selection made

### JudgeNumberStep.tsx
- Grid of judge number buttons
- AudioRecordingModeSelector component
- Persists preferences to localStorage

### AllQuestionsStep.tsx
Core scoring component:
- Collapsible cards for each question
- Renders appropriate input based on field type
- Auto-advances to next question on answer
- Smart scroll behavior
- Audio controls if recording enabled
- Points counter in top-right corner

### ReviewSubmitStep.tsx
- Total score card at top
- List of all answers with edit buttons
- Edit navigates back to questions step
- Fixed submit button at bottom
- Audio controls if auto mode

### MobileNavButtons.tsx
Fixed bottom bar with:
- Left: Exit or Previous button
- Center: Optional step indicator
- Right: Next button
- Uses onPointerDown for mobile responsiveness

### ScoreButtonGrid.tsx
- 10-column grid of 0-10 buttons
- Configurable maxValue and startFrom
- Selected state with ring highlight

### Audio Components
- AudioRecordingModeSelector: 3-button mode selector
- AudioRecordingControls: Mic button + duration display

---

## Hooks

### useAudioRecording.ts
```typescript
const {
  recordingState,     // 'idle' | 'recording' | 'paused'
  audioBlob,          // Final Blob after stop
  duration,           // Seconds recorded
  error,              // Error message if any
  hasPermission,      // Boolean or null
  requestPermission,  // () => Promise<boolean>
  startRecording,     // () => Promise<void>
  pauseRecording,     // () => void
  resumeRecording,    // () => Promise<void>
  stopRecording,      // () => void
  deleteRecording,    // () => void
} = useAudioRecording(audioMode);
```

### useJudgeEventDetails.ts
```typescript
const { eventDetails, registeredSchools, isLoading, error } = 
  useJudgeEventDetails(eventId, competitionId);
```
Returns:
- eventDetails: { id, event_id, event_name, event_start_time, event_location, score_sheet }
- registeredSchools: [{ school_id, school_name, scheduled_time }]

### useEventScoreSheets.ts
```typescript
const { data: submittedSchoolIds } = useEventScoreSheets(eventId, competitionId, userId);
```
Returns Set<string> of school IDs that already have submissions by this user.

### useAttachments.ts
```typescript
const { uploadFile, isUploading } = useAttachments('competition_event', recordId, schoolId);
await uploadFile({ record_type, record_id, file });
```

---

## Score Calculations

### calculateTotalScore(fields, answers)
Sums all numeric field values plus penalty deductions.

### calculatePenaltyDeduction(field, value)
Returns negative number for penalty amount:
- **points**: violations × pointValue
- **minor_major**: minor=-20, major=-50
- **split**: firstValue + (count-1) × subsequentValue
- **penalty_checkbox**: count × penaltyValue

### formatPenaltyDeduction(field, value)
Returns penalty as always-negative display value.

---

## LocalStorage Keys

User preferences stored at `judgePortal_${userId}`:
```json
{
  "judgeNumber": "1",
  "audioMode": "auto"
}
```

---

## Styling Notes

- Uses Tailwind CSS with design system tokens
- Mobile-first: `h-[calc(100dvh-4rem)]` for full viewport
- Touch-friendly: `touch-manipulation` class, larger tap targets
- Safe area: `pb-safe` for bottom nav on notched devices
- Transitions: `transition-all`, `active:scale-[0.98]` for feedback

---

## Dependencies

- React 18
- React Router DOM (useParams, useSearchParams, useNavigate)
- TanStack Query (useQuery, useMutation)
- Supabase JS Client
- date-fns (format)
- lucide-react (icons)
- shadcn/ui components (Card, Button, Input, Textarea, Badge, Collapsible)

---

## Route Setup

```tsx
<Route path="m_judge_event/:eventId" element={<MobileJudgeEventPage />} />
```

Query param: `?competitionId=xxx`

Navigation: `navigate(\`/app/judges-portal/m_judge_event/${eventId}?competitionId=${competitionId}\`)`

---

## Data Flow

1. **Page Load**: Fetch event details + registered schools + submitted school IDs
2. **Step 0**: Show event info, confirm
3. **Step 1**: Filter schools (exclude submitted), select one
4. **Step 2**: Select judge #, choose audio mode, request mic permission if needed
5. **Step 3**: Render all questions, auto-start audio if auto mode, collect answers
6. **Step 4**: Review answers, pause audio if auto, can edit
7. **Submit**:
   - Stop recording if active
   - Insert to competition_events table
   - Wait for audio blob to finalize
   - Upload as attachment
   - Navigate back to portal home

---

## Replication Checklist

1. [ ] Copy all mobile components from `src/components/judges-portal/mobile/`
2. [ ] Copy `src/pages/MobileJudgeEventPage.tsx`
3. [ ] Copy hooks: `useAudioRecording.ts`, `useJudgeEventDetails.ts`, `useEventScoreSheets.ts`
4. [ ] Copy `src/hooks/attachments/useAttachments.ts`
5. [ ] Copy `src/utils/scoreCalculations.ts`
6. [ ] Copy `src/components/competition-management/components/json-field-builder/types.ts`
7. [ ] Create required database tables (see schema above)
8. [ ] Create storage bucket for attachments
9. [ ] Add route to your router configuration
10. [ ] Install dependencies (shadcn/ui, lucide-react, date-fns, TanStack Query)
11. [ ] Configure Supabase client
12. [ ] Adapt school_id/user_id context to your auth system

---

## Full File Contents

The complete source code for each file is available in the codebase at the paths listed in the File Structure section above.
