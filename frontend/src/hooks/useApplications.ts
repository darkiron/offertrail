import { usePaginatedListing } from './useListingController';
import { applicationService } from '../services/api';
import type { WorkflowApplicationListParams } from '../services/api/application-contracts';

export function useWorkflowApplications(params: WorkflowApplicationListParams) {
  return usePaginatedListing(['workflow-applications', params], () =>
    applicationService.getWorkflowApplications(params),
  );
}
