import { useQuery, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { metaData } from '../store/apps/crud/site';
import {AlarmEvent, GetFilter, SetAlarmEvents, UpdateAlarmEventMeta} from '../store/apps/crud/alarmEvent';
// export type { AlarmEvent, GetFilter };
import { useDispatch } from 'src/store/Store';

const API_URL = '/api/alarm-events/';


interface PaginatedResponse<T> {
  data: T[];
  msg: string;
  meta: metaData;
  success: boolean;
  code: number;
}

export function useAlarmEventList(filter?: GetFilter) {
  const dispatch = useDispatch();
  return useQuery({
    queryKey: ['alarm-event-list', filter],
    queryFn: async () => {
      const response = await axiosServices.get<PaginatedResponse<AlarmEvent>>(API_URL, {
        params: filter,
      });
      console.log("Rsepose", response)
      dispatch(SetAlarmEvents(response.data.data));
      dispatch(UpdateAlarmEventMeta(response.data.meta));
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
