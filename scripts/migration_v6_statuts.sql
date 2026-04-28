-- Migration v6 : normalisation des statuts candidature (11 → 5 valeurs canoniques)
-- À appliquer via Supabase SQL editor ou CLI avant déploiement du backend refactorisé.

UPDATE candidatures SET statut = 'en_attente'  WHERE statut IN ('brouillon');
UPDATE candidatures SET statut = 'envoyee'     WHERE statut IN ('relancee');
UPDATE candidatures SET statut = 'entretien'   WHERE statut IN ('test_technique');
UPDATE candidatures SET statut = 'offre_recue' WHERE statut IN ('acceptee');
UPDATE candidatures SET statut = 'refusee'     WHERE statut IN ('ghosting', 'abandonnee');
