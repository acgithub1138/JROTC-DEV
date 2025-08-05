-- Remove the 6-parameter queue_email function (keeping the 5-parameter version for manual email sending)
DROP FUNCTION IF EXISTS queue_email(text, text, text, text, text, text);