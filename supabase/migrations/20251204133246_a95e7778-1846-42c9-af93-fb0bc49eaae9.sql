-- Rename school flag columns for clearer naming
ALTER TABLE schools RENAME COLUMN competition_module TO comp_analytics;
ALTER TABLE schools RENAME COLUMN competition_portal TO comp_hosting;
ALTER TABLE schools RENAME COLUMN comp_register_only TO comp_basic;