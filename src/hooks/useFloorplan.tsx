import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { FloorplanType, GetFilter } from '../store/apps/crud/floorplan';
import { RootState, useSelector } from 'src/store/Store';

const FLOORPLAN_API_URL = '/api/floorplans/';
const FLOORPLAN_DT_URL = '/api/floorplans/filter/';

interface PaginatedResponse<T> {
  data: T[];
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
}

// Fetch list with caching
export function useFloorplanList(filter?: GetFilter) {
  return useQuery({
    queryKey: ['floorplan-list', filter],
    queryFn: async () => {
      const response = await axiosServices.get(FLOORPLAN_DT_URL, {params: filter});
      const collection = response.data.collection;

      // shape it into a typed object
      return {
        data: collection.data as FloorplanType[],
        draw: collection.draw,
        recordsTotal: collection.recordsTotal,
        recordsFiltered: collection.recordsFiltered,
      } satisfies PaginatedResponse<FloorplanType>;
    },
    placeholderData: keepPreviousData,
    staleTime: 5_000, // data dianggap fresh 1 menit
    gcTime: 5 * 60_000, // cache disimpan 5 menit
  });
}

// Get All Floorplans
export function useAllFloorplans() {
  return useQuery({
    queryKey: ['floorplan-all'],
    queryFn: async () => {
      const res = await axiosServices.get(FLOORPLAN_API_URL);
      return res.data.collection.data as FloorplanType[];
    },
    placeholderData: [],
  });
}

// Add floorplan
export function useAddFloorplan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<FloorplanType>) => {
      const { id, ...filteredPayload } = payload;
      const res = await axiosServices.post(FLOORPLAN_API_URL, filteredPayload);
      return res.data;
    },
    onSuccess: () => {
      // invalidate cached list to refetch
      queryClient.invalidateQueries({ queryKey: ['floorplan-list'] });
      queryClient.invalidateQueries({ queryKey: ['floorplan-all'] });
    },
  });
} 

// Edit floorplan
export function useEditFloorplan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<FloorplanType>) => {
      if (!payload.id) throw new Error('Missing floorplan id');
      const { id, ...filteredPayload } = payload;
      const res = await axiosServices.put(`${FLOORPLAN_API_URL}${id}`, filteredPayload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorplan-list'] });
      queryClient.invalidateQueries({ queryKey: ['floorplan-all'] });
    },
  });
}

// Delete floorplan
export function useDeleteFloorplan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosServices.delete(`${FLOORPLAN_API_URL}${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorplan-list'] });
      queryClient.invalidateQueries({ queryKey: ['floorplan-all'] });
    },
  });
}

// Status
export function useFloorplanStatus() {
  const floorplanFilter = useSelector((state: RootState) => state.floorplanReducer.floorplanFilter);
  const query = useFloorplanList(floorplanFilter);

  return {
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    hasLoaded: query.isFetched, // ✅ substitusi untuk redux.hasLoaded
    totalCount: query.data?.recordsTotal || 0,
    filteredCount: query.data?.recordsFiltered || 0,
  };
}
