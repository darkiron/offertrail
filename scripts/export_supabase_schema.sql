-- OfferTrail - Export de schema pour Supabase/PostgreSQL
-- Source: modeles SQLAlchemy courants
-- Hypothese: l'application continue d'utiliser `public.users`
-- et non `auth.users` de Supabase.

begin;

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  hashed_password text not null,
  nom text,
  prenom text,
  plan text not null default 'starter' check (plan in ('starter', 'pro')),
  role text not null default 'user' check (role in ('user', 'admin')),
  plan_started_at timestamptz,
  plan_expires_at timestamptz,
  stripe_customer_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.etablissements (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  secteur text,
  siret text unique,
  site_web text,
  logo_url text,
  description text,
  siege_id uuid references public.etablissements(id) on delete set null,
  type text not null default 'independant',
  verified boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.succursales (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references public.etablissements(id) on delete cascade,
  nom text,
  adresse text,
  ville text not null,
  code_postal text,
  pays text not null default 'FR',
  latitude double precision,
  longitude double precision,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid references public.etablissements(id) on delete set null,
  succursale_id uuid references public.succursales(id) on delete set null,
  prenom text not null,
  nom text not null,
  poste text,
  linkedin_url text,
  email_pro text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_rattache check (
    etablissement_id is not null or succursale_id is not null
  )
);

create table if not exists public.candidatures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  etablissement_id uuid not null references public.etablissements(id) on delete restrict,
  client_final_id uuid references public.etablissements(id) on delete set null,
  succursale_id uuid references public.succursales(id) on delete set null,
  poste text not null,
  url_offre text,
  description text,
  statut text not null default 'brouillon' check (
    statut in (
      'brouillon',
      'envoyee',
      'en_attente',
      'relancee',
      'entretien',
      'test_technique',
      'offre_recue',
      'acceptee',
      'refusee',
      'ghosting',
      'abandonnee'
    )
  ),
  date_candidature timestamptz,
  date_reponse timestamptz,
  salaire_vise integer,
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidature_events (
  id uuid primary key default gen_random_uuid(),
  candidature_id uuid not null references public.candidatures(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (
    type in (
      'creation',
      'statut_change',
      'contact_ajout',
      'relance_envoyee',
      'note_ajout',
      'entretien_planifie',
      'offre_recue',
      'document_joint'
    )
  ),
  ancien_statut text,
  nouveau_statut text,
  contenu text,
  created_at timestamptz not null default now()
);

create table if not exists public.relances (
  id uuid primary key default gen_random_uuid(),
  candidature_id uuid not null references public.candidatures(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  date_prevue timestamptz not null,
  date_effectuee timestamptz,
  canal text,
  contenu text,
  statut text not null default 'a_faire' check (statut in ('a_faire', 'faite', 'ignoree')),
  created_at timestamptz not null default now()
);

create table if not exists public.contact_interactions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  appreciation text,
  notes text,
  email_perso text,
  telephone text,
  derniere_interaction timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_interaction_contact_user unique (contact_id, user_id)
);

create table if not exists public.probite_scores (
  etablissement_id uuid primary key references public.etablissements(id) on delete cascade,
  score_global double precision,
  taux_reponse double precision,
  delai_moyen_reponse double precision,
  ghosting_rate double precision,
  nb_candidatures integer not null default 0,
  nb_users_uniques integer not null default 0,
  last_computed_at timestamptz not null default now()
);

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_etablissements_created_by on public.etablissements(created_by);
create index if not exists idx_etablissements_siege_id on public.etablissements(siege_id);
create index if not exists idx_succursales_etablissement_id on public.succursales(etablissement_id);
create index if not exists idx_succursales_created_by on public.succursales(created_by);
create index if not exists idx_contacts_etablissement_id on public.contacts(etablissement_id);
create index if not exists idx_contacts_succursale_id on public.contacts(succursale_id);
create index if not exists idx_contacts_created_by on public.contacts(created_by);
create index if not exists idx_candidatures_user_id on public.candidatures(user_id);
create index if not exists idx_candidatures_etablissement_id on public.candidatures(etablissement_id);
create index if not exists idx_candidatures_client_final_id on public.candidatures(client_final_id);
create index if not exists idx_candidatures_succursale_id on public.candidatures(succursale_id);
create index if not exists idx_candidatures_statut on public.candidatures(statut);
create index if not exists idx_candidature_events_candidature_id on public.candidature_events(candidature_id);
create index if not exists idx_candidature_events_user_id on public.candidature_events(user_id);
create index if not exists idx_relances_candidature_id on public.relances(candidature_id);
create index if not exists idx_relances_user_id on public.relances(user_id);
create index if not exists idx_relances_contact_id on public.relances(contact_id);
create index if not exists idx_contact_interactions_contact_id on public.contact_interactions(contact_id);
create index if not exists idx_contact_interactions_user_id on public.contact_interactions(user_id);
create index if not exists idx_password_reset_tokens_user_id on public.password_reset_tokens(user_id);
create index if not exists idx_password_reset_tokens_token on public.password_reset_tokens(token);

commit;
