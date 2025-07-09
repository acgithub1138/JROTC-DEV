
export const getColumnLabel = (columnName: string, tableName: string): string => {
  const labelMap: Record<string, Record<string, string>> = {
    tasks: {
      id: 'Task ID',
      task_number: 'Task Number',
      title: 'Title',
      description: 'Description',
      status: 'Status',
      priority: 'Priority',
      assigned_to: 'Assigned To',
      assigned_by: 'Assigned By',
      team_id: 'Team',
      due_date: 'Due Date',
      completed_at: 'Completed At',
      created_at: 'Created Date',
      updated_at: 'Updated Date',
      school_id: 'School'
    },
    cadets: {
      id: 'Cadet ID',
      cadet_id: 'Cadet Number',
      profile_id: 'Profile',
      school_id: 'School',
      grade_level: 'Grade Level',
      gpa: 'GPA',
      attendance_percentage: 'Attendance %',
      graduation_date: 'Graduation Date',
      date_of_birth: 'Date of Birth',
      enlistment_date: 'Enlistment Date',
      parent_name: 'Parent Name',
      parent_phone: 'Parent Phone',
      parent_email: 'Parent Email',
      emergency_contact_name: 'Emergency Contact Name',
      emergency_contact_phone: 'Emergency Contact Phone',
      medical_conditions: 'Medical Conditions',
      uniform_size: 'Uniform Size',
      created_at: 'Created Date',
      updated_at: 'Updated Date'
    },
    profiles: {
      id: 'Profile ID',
      first_name: 'First Name',
      last_name: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      role: 'Role',
      rank: 'Rank',
      school_id: 'School',
      created_at: 'Created Date',
      updated_at: 'Updated Date'
    },
    teams: {
      id: 'Team ID',
      name: 'Team Name',
      description: 'Description',
      team_lead_id: 'Team Leader',
      school_id: 'School',
      created_at: 'Created Date',
      updated_at: 'Updated Date'
    },
    competitions: {
      id: 'Competition ID',
      name: 'Competition Name',
      description: 'Description',
      type: 'Type',
      competition_date: 'Competition Date',
      location: 'Location',
      registration_deadline: 'Registration Deadline',
      created_at: 'Created Date',
      updated_at: 'Updated Date'
    },
    inventory_items: {
      id: 'Item ID',
      name: 'Item Name',
      description: 'Description',
      category: 'Category',
      serial_number: 'Serial Number',
      status: 'Status',
      condition: 'Condition',
      location: 'Location',
      purchase_date: 'Purchase Date',
      purchase_price: 'Purchase Price',
      notes: 'Notes',
      school_id: 'School',
      created_at: 'Created Date',
      updated_at: 'Updated Date'
    },
    expenses: {
      id: 'Expense ID',
      description: 'Description',
      amount: 'Amount',
      expense_date: 'Expense Date',
      vendor: 'Vendor',
      budget_id: 'Budget',
      receipt_url: 'Receipt URL',
      created_by: 'Created By',
      approved_by: 'Approved By',
      approved_at: 'Approved At',
      school_id: 'School',
      created_at: 'Created Date'
    },
    incidents: {
      id: 'Incident ID',
      incident_number: 'Incident Number',
      title: 'Title',
      description: 'Description',
      category: 'Category',
      priority: 'Priority',
      status: 'Status',
      submitted_by: 'Submitted By',
      assigned_to: 'Assigned To',
      active: 'Active',
      resolved_at: 'Resolved At',
      school_id: 'School',
      created_at: 'Created Date',
      updated_at: 'Updated Date'
    }
  };

  return labelMap[tableName]?.[columnName] || columnName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const getProfileReferenceFields = (tableName: string): string[] => {
  const profileFields: Record<string, string[]> = {
    tasks: ['assigned_to', 'assigned_by'],
    cadets: ['profile_id'],
    teams: ['team_lead_id'],
    expenses: ['created_by', 'approved_by'],
    incidents: ['submitted_by', 'assigned_to']
  };

  return profileFields[tableName] || [];
};

export const getEnhancedVariables = (tableName: string): Array<{ variable: string; label: string }> => {
  const profileFields = getProfileReferenceFields(tableName);
  
  return profileFields.map(field => ({
    variable: `${field}_name`,
    label: `${getColumnLabel(field, tableName)} Name`
  }));
};
