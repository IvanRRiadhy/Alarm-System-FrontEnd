import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { GetFilter, investigateType, UpdateMeta } from '../store/apps/report/investigate';
import { metaData } from '../store/apps/crud/site';
import { useDispatch } from 'src/store/Store';

const API_URL = '/api/reports/alarm-reports';

interface PaginatedResponse<T> {
  data: T[];
  msg: string;
  meta: metaData;
  success: boolean;
  code: number;
}

export function useInvestigateList(filter?: GetFilter) {
  const dispatch = useDispatch();
  return useQuery({
    queryKey: ['investigate-list', filter],
    queryFn: async () => {
      const response = await axiosServices.get<PaginatedResponse<investigateType>>(API_URL, {
        params: filter,
      });
      if (response.data && response.data.meta) {
        dispatch(UpdateMeta(response.data.meta));
      }
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useInfiniteInvestigateList(filter: GetFilter, limit: number = 10) {
  const dispatch = useDispatch();
  return useInfiniteQuery({
    queryKey: ['investigate-list', 'infinite', filter],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axiosServices.get<PaginatedResponse<investigateType>>(API_URL, {
        params: { ...filter, page: pageParam, limit },
      });
      if (response.data && response.data.meta) {
        dispatch(UpdateMeta(response.data.meta));
      }
      console.log("Investigate", response.data.data)
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length < limit) return undefined;
      return allPages.length + 1;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
