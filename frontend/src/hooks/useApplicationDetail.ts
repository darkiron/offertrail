import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService, organizationService } from '../services/api';
import type { ApplicationPayload, EventUpdatePayload } from '../services/api';

export function useApplicationDetail(id: number | undefined) {
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationService.getApplication(id!),
    enabled: !!id,
  });

  const orgsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['application', id] });

  const updateStatus = useMutation({
    mutationFn: (status: string) => applicationService.updateApplication(id!, { status }),
    onSuccess: invalidate,
  });

  const addNote = useMutation({
    mutationFn: (text: string) => applicationService.addNote(id!, text),
    onSuccess: invalidate,
  });

  const markFollowup = useMutation({
    mutationFn: () => applicationService.markFollowup(id!),
    onSuccess: invalidate,
  });

  const addEvent = useMutation({
    mutationFn: (type: string) => applicationService.addEvent(id!, type),
    onSuccess: invalidate,
  });

  const linkContact = useMutation({
    mutationFn: (contactId: number) => applicationService.linkContact(id!, contactId),
    onSuccess: invalidate,
  });

  const createContact = useMutation({
    mutationFn: (payload: Parameters<typeof applicationService.createContact>[1]) =>
      applicationService.createContact(id!, payload),
    onSuccess: invalidate,
  });

  const setFinalCustomer = useMutation({
    mutationFn: (organizationId: number | null) =>
      applicationService.updateApplication(id!, { final_customer_organization_id: organizationId }),
    onSuccess: invalidate,
  });

  const updateApplication = useMutation({
    mutationFn: (payload: ApplicationPayload) => applicationService.updateApplication(id!, payload),
    onSuccess: invalidate,
  });

  const updateEvent = useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: EventUpdatePayload }) =>
      applicationService.updateEvent(eventId, data),
    onSuccess: invalidate,
  });

  const deleteEvent = useMutation({
    mutationFn: (eventId: string) => applicationService.deleteEvent(eventId),
    onSuccess: invalidate,
  });

  return {
    data: detailQuery.data ?? null,
    organizations: orgsQuery.data ?? [],
    loading: detailQuery.isLoading,
    error: detailQuery.error,
    refetch: detailQuery.refetch,
    isUpdatingStatus: updateStatus.isPending,
    updateStatus: updateStatus.mutateAsync,
    updateApplication: updateApplication.mutateAsync,
    addNote: addNote.mutateAsync,
    markFollowup: markFollowup.mutateAsync,
    addEvent: addEvent.mutateAsync,
    linkContact: linkContact.mutateAsync,
    createContact: createContact.mutateAsync,
    setFinalCustomer: setFinalCustomer.mutateAsync,
    updateEvent: updateEvent.mutateAsync,
    deleteEvent: deleteEvent.mutateAsync,
  };
}
