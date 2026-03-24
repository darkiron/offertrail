export interface CompanySummaryModel {
  id: number;
  name: string;
}

export interface CompanyModel extends CompanySummaryModel {
  slug: string;
  type: string;
  website: string | null;
  location: string | null;
  description: string | null;
  notes: string | null;
  metrics: CompanyMetricsModel;
  flags: string[];
  globalFlagLevel: 'green' | 'orange' | 'red' | string;
  applications?: any[];
  offers?: any[];
  contacts?: any[];
}

export interface CompanyMetricsModel {
  totalApplications: number;
  totalOffers: number;
  rejections: number;
  noResponses: number;
  interviews: number;
  rejectionRate: number;
  ghostingRate: number;
  responseRate: number;
  interviewRate: number;
  lastInteraction: string | null;
}

export const mapCompanyDtoToModel = (dto: any): CompanyModel => {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug || '',
    type: dto.type || 'other',
    website: dto.website,
    location: dto.location,
    description: dto.description,
    notes: dto.notes,
    metrics: {
      totalApplications: dto.metrics?.total_apps || 0,
      totalOffers: dto.metrics?.total_offers || 0,
      rejections: dto.metrics?.rejections || 0,
      noResponses: dto.metrics?.no_responses || 0,
      interviews: dto.metrics?.interviews || 0,
      rejectionRate: dto.metrics?.rejection_rate || 0,
      ghostingRate: dto.metrics?.ghosting_rate || 0,
      responseRate: dto.metrics?.response_rate || 0,
      interviewRate: dto.metrics?.interview_rate || 0,
      lastInteraction: dto.metrics?.last_interaction || null,
    },
    flags: dto.flags || [],
    globalFlagLevel: dto.global_flag_level || 'green',
    applications: dto.applications,
    offers: dto.offers,
    contacts: dto.contacts,
  };
};
