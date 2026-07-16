import { useQuery, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { metaData } from '../store/apps/crud/site';
import { AlarmCaseType, AlarmCaseTimelineType, GetFilter, SetAlarmCases, UpdateAlarmCaseMeta } from '../store/apps/crud/alarmCase';
import { useDispatch } from 'src/store/Store';

const API_URL = '/api/alarm-cases';

interface PaginatedResponse<T> {
  data: T[];
  msg: string;
  meta: metaData;
  success: boolean;
  code: number;
}

export function useAlarmCaseList(filter?: GetFilter) {
  const dispatch = useDispatch();
  return useQuery({
    queryKey: ['alarm-case-list', filter],
    queryFn: async () => {
      const response = await axiosServices.get<PaginatedResponse<AlarmCaseType>>(API_URL, {
        params: filter,
      });
      if (response.data && response.data.data) {
        dispatch(SetAlarmCases(response.data.data));
      }
      if (response.data && response.data.meta) {
        dispatch(UpdateAlarmCaseMeta(response.data.meta));
      }
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAlarmCaseByID(id: string) {
  return useQuery({
    queryKey: ['alarm-case', id],
    queryFn: async () => {
      const response = await axiosServices.get<{ data: AlarmCaseType } | AlarmCaseType>(`${API_URL}/${id}`);
      // Return response.data.data if wrapped, otherwise response.data
      if (response.data && 'data' in response.data) {
        return response.data.data;
      }
      return response.data as AlarmCaseType;
    },
    enabled: !!id,
  });
}
export function useAlarmCaseTimeline(id: string) {
    return useQuery({
    queryKey: ['alarm-timeline', id],
    queryFn: async () => {
      const response = await axiosServices.get<{ data: AlarmCaseTimelineType } | AlarmCaseTimelineType>(`${API_URL}/${id}/timeline`);
      // Return response.data.data if wrapped, otherwise response.data
      if (response.data && 'data' in response.data) {
        return response.data.data;
      }
      return response.data as AlarmCaseTimelineType;
    },
    enabled: !!id,
  });
}
