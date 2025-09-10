-- Update the welcome email template to use the password variable instead of hardcoded password
UPDATE email_templates 
SET 
  body = '<p>Hello {{first_name}} {{last_name}},</p>
<p>You have been invited to join the JROTC Command and Control Center for {{school_name}}.</p>
<p>Click this link to log in:</p>
<p><a href="https://jrotc.us/app/auth">JROTC CCC</a></p>
<p>Your password is: <h3>{{password}}</h3></p>
<p>You will be asked to reset your password when you log in.</p>',
  variables_used = '["first_name", "last_name", "school_name", "password"]'::jsonb
WHERE name = 'Welcome New User' AND id = '3cc3a0ff-646e-4778-a6ef-d8906254d1c2';