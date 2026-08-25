export interface RelanceApi {
  id: string;
  candidature_id: string;
  user_id: string;
  contact_id: string | null;
  date_prevue: string;
  date_effectuee: string | null;
  canal: string | null;
  contenu: string | null;
  statut: string;
  created_at: string;
}
