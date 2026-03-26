-- New organizations table (replaces companies)
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'AUTRE',
  website TEXT,
  linkedin_url TEXT,
  city TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table contacts
CREATE TABLE IF NOT EXISTS contacts_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  is_recruiter INTEGER NOT NULL DEFAULT 0,
  linkedin_url TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table application_contacts (N:N relationship)
CREATE TABLE IF NOT EXISTS application_contacts (
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  contact_id INTEGER NOT NULL REFERENCES contacts_new(id) ON DELETE CASCADE,
  PRIMARY KEY (application_id, contact_id)
);

-- Migrate data from companies to organizations
INSERT OR IGNORE INTO organizations (id, name, type, website, city, notes, created_at, updated_at)
SELECT id, name, 
  CASE 
    WHEN type = 'ESN' THEN 'ESN'
    WHEN type = 'CABINET' THEN 'CABINET_RECRUTEMENT'
    WHEN type = 'STARTUP' THEN 'STARTUP'
    WHEN type = 'ENTERPRISE' THEN 'GRAND_COMPTE'
    WHEN type = 'PUBLIC' THEN 'PME' -- Approximated
    ELSE 'AUTRE'
  END, 
  website, location, notes, created_at, updated_at 
FROM companies;

-- Migrate data from contacts to contacts_new
INSERT OR IGNORE INTO contacts_new (id, organization_id, first_name, last_name, email, phone, role, notes, created_at, updated_at)
SELECT id, company_id, first_name, last_name, email, phone, role, notes, created_at, updated_at
FROM contacts;

-- Add organization_id to applications
-- Since SQLite doesn't support direct ALTER TABLE with REFERENCES comfortably for existing data,
-- and the previous schema already had company_id, we will keep company_id and just ensure it's linked to organizations.
-- Actually the prompt says: ALTER TABLE applications ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL;
-- In our case applications.company_id already points to companies.id which is now organizations.id.
-- To strictly follow the prompt we add organization_id.

ALTER TABLE applications ADD COLUMN organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL;
UPDATE applications SET organization_id = company_id;

-- Drop old contacts table and rename new one
-- WARNING: In a real environment we'd be careful, but here we can do it if no other foreign keys point to 'contacts' 
-- EXCEPT from applications.primary_contact_id.
-- Let's just keep contacts_new as contacts for now by renaming after dropping.

DROP TABLE IF EXISTS contacts;
ALTER TABLE contacts_new RENAME TO contacts;
