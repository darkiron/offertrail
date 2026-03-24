-- SQL Migration to introduce organizations and update contacts
-- v5 - Organisations / Contacts / Probité

-- 1. Create organizations table (replacing or extending companies)
CREATE TABLE IF NOT EXISTS organizations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL UNIQUE,
  type            TEXT NOT NULL DEFAULT 'AUTRE',
  -- CLIENT_FINAL | ESN | CABINET_RECRUTEMENT | STARTUP | PME | GRAND_COMPTE | PORTAGE | AUTRE
  website         TEXT,
  linkedin_url    TEXT,
  city            TEXT,
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Migrate existing companies to organizations (if companies table exists)
INSERT OR IGNORE INTO organizations (id, name, created_at, updated_at)
SELECT id, name, created_at, updated_at FROM companies;

-- 3. Update applications table to add organization_id
ALTER TABLE applications ADD COLUMN organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL;
UPDATE applications SET organization_id = company_id;

-- 4. Recreate contacts table with new fields
-- First, rename old contacts table to backup
ALTER TABLE contacts RENAME TO contacts_old;

CREATE TABLE IF NOT EXISTS contacts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  role            TEXT,
  is_recruiter    INTEGER NOT NULL DEFAULT 0,
  linkedin_url    TEXT,
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. Migrate data from old contacts to new contacts
-- Attempt to split name into first_name and last_name (simplified)
INSERT INTO contacts (id, organization_id, first_name, last_name, email, phone, created_at, updated_at)
SELECT 
    id, 
    company_id, 
    CASE 
        WHEN instr(name, ' ') > 0 THEN substr(name, 1, instr(name, ' ') - 1)
        ELSE name 
    END as first_name,
    CASE 
        WHEN instr(name, ' ') > 0 THEN substr(name, instr(name, ' ') + 1)
        ELSE '' 
    END as last_name,
    email, 
    phone, 
    created_at, 
    updated_at 
FROM contacts_old;

-- 6. Recreate application_contacts (N:N relationship)
-- If it already exists, ensure it points to the new contacts table
-- Dropping and recreating is safest to ensure constraints are correct.
CREATE TABLE IF NOT EXISTS application_contacts_new (
  application_id  INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  contact_id      INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  PRIMARY KEY (application_id, contact_id)
);

-- Migrate existing links if application_contacts exists
INSERT OR IGNORE INTO application_contacts_new (application_id, contact_id)
SELECT application_id, contact_id FROM application_contacts;

DROP TABLE IF EXISTS application_contacts;
ALTER TABLE application_contacts_new RENAME TO application_contacts;

-- Clean up
DROP TABLE IF EXISTS contacts_old;
DROP TABLE IF EXISTS companies;
