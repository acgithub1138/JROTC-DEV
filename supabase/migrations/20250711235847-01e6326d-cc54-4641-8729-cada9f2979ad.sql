-- Fix misspelled "canceled" status option
UPDATE incident_status_options 
SET value = 'canceled', label = 'Canceled'
WHERE value = 'cancled';