import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { ScheduleDataType, GetFilter, UpdateScheduleMeta } from '../store/apps/crud/schedule';
import { RootState, useDispatch, useSelector } from 'src/store/Store';
import { metaData } from '../store/apps/crud/site';

const SCHEDULE_API_URL = '/api/schedule-templates/';



interface PaginatedResponse<T> {
  data: T[];
  msg: string;
  meta: metaData;
  status: number;
}

export function useScheduleList(filter?: GetFilter) {
    const dispatch = useDispatch();
    return useQuery({
        queryKey: ['schedule-list', filter],
        queryFn: async () => {
            const response = await axiosServices.get<PaginatedResponse<ScheduleDataType>>(SCHEDULE_API_URL,{
                params: filter
            });
            dispatch(UpdateScheduleMeta(response.data.meta));
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}

export function useAddSchedule(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<ScheduleDataType>) => {
            const { id, ...filteredPayload } = payload;
            const response = await axiosServices.post(SCHEDULE_API_URL, filteredPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schedule-list"] })
        }
    })
}

export function useEditSchedule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<ScheduleDataType>) => {
            if (!payload.id) throw new Error('Missing schedule id');
            const { id, ...filteredPayload } = payload;
            const response = await axiosServices.put(`${SCHEDULE_API_URL}${id}`, filteredPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schedule-list"] })
        }
    })
}


export function useDeleteSchedule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await axiosServices.delete(`${SCHEDULE_API_URL}${id}`)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schedule-list"] })
        }
    })
}

