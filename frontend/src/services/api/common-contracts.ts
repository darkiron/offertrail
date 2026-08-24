export interface DashboardParams {
  status?: string;
  type?: string;
  source?: string;
}

export interface CheckoutPayload {
  plan: 'pro' | 'ultimate';
  period: 'monthly' | 'yearly';
  coupon?: string;
}

export interface MeStatsApi {
  total_candidatures: number;
  pipeline_actif: number;
  taux_refus: number;
  temps_moyen_reponse: number | null;
  delai_moyen_reponse: number | null;
  taux_reponse: number;
  relances_dues: number;
}

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
