// Sample email templates for competition registration

export const COMPETITION_REGISTRATION_CONFIRMATION_TEMPLATE = {
  name: "Competition Registration Confirmation",
  subject: "Registration Confirmed: {{competition_name}}",
  body: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>Competition Registration Confirmation</h2>
    
    <p>Dear {{school_name}} Team,</p>
    
    <p>We are pleased to confirm your registration for <strong>{{competition_name}}</strong>.</p>
    
    <h3>Competition Details:</h3>
    <ul>
      <li><strong>Event:</strong> {{competition_name}}</li>
      <li><strong>Host School:</strong> {{hosting_school}}</li>
      <li><strong>Date:</strong> {{competition_start_date}} - {{competition_end_date}}</li>
      <li><strong>Location:</strong> {{competition_location}}</li>
      <li><strong>Address:</strong> {{competition_address}}, {{competition_city}}, {{competition_state}} {{competition_zip}}</li>
      <li><strong>Registration Deadline:</strong> {{registration_deadline}}</li>
    </ul>
    
    <h3>Registration Information:</h3>
    <ul>
      <li><strong>School:</strong> {{school_name}} ({{school_initials}})</li>
      <li><strong>Registration Status:</strong> {{registration_status}}</li>
      <li><strong>Registration Date:</strong> {{registration_date}}</li>
      <li><strong>Registration Source:</strong> {{registration_source}}</li>
    </ul>
    
    <h3>Financial Summary:</h3>
    <ul>
      <li><strong>Base Fee:</strong> {{base_fee_formatted}}</li>
      <li><strong>Event Fees:</strong> {{event_fees_formatted}}</li>
      <li><strong>Total Cost:</strong> {{total_cost_formatted}}</li>
      <li><strong>Payment Status:</strong> {{paid_status ? "PAID" : "PENDING"}}</li>
    </ul>
    
    <h3>Registered Events:</h3>
    <p>{{registered_events_text}}</p>
    <p><strong>Total Events:</strong> {{registered_events_count}}</p>
    
    {{#if competition_description}}
    <h3>Competition Description:</h3>
    <p>{{competition_description}}</p>
    {{/if}}
    
    {{#if registration_notes}}
    <h3>Additional Notes:</h3>
    <p>{{registration_notes}}</p>
    {{/if}}
    
    <hr style="margin: 20px 0;">
    
    <p>If you have any questions about your registration, please contact the host school directly.</p>
    
    <p>Good luck in the competition!</p>
    
    <p>Best regards,<br>
    Competition Portal System</p>
  </div>`,
  source_table: "cp_comp_schools" as const,
  recipient_field: "school_email",
  variables_used: [
    "competition_name",
    "hosting_school", 
    "competition_start_date",
    "competition_end_date",
    "competition_location",
    "competition_address",
    "competition_city", 
    "competition_state",
    "competition_zip",
    "registration_deadline",
    "school_name",
    "school_initials",
    "registration_status",
    "registration_date",
    "registration_source",
    "base_fee_formatted",
    "event_fees_formatted", 
    "total_cost_formatted",
    "paid_status",
    "registered_events_text",
    "registered_events_count",
    "competition_description",
    "registration_notes"
  ]
};

export const getCompetitionEmailSamples = () => {
  return [COMPETITION_REGISTRATION_CONFIRMATION_TEMPLATE];
};