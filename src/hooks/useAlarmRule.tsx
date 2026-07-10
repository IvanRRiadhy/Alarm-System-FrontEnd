import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { AlarmRuleDataType, GetFilter, UpdateAlarmRuleMeta } from '../store/apps/crud/alarmRule';
import { RootState, useDispatch, useSelector } from 'src/store/Store';
import { metaData } from '../store/apps/crud/site';

const ALARMRULE_API_URL = '/api/alarm-rules/';



interface PaginatedResponse<T> {
  data: T[];
  msg: string;
  meta: metaData;
  status: number;
}

export function useAlarmRuleList(filter?: GetFilter) {
    const dispatch = useDispatch();
    return useQuery({
        queryKey: ['alarm-rule-list', filter],
        queryFn: async () => {
            const response = await axiosServices.get<PaginatedResponse<AlarmRuleDataType>>(ALARMRULE_API_URL,{
                params: filter
            });
            dispatch(UpdateAlarmRuleMeta(response.data.meta));
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}

export function useAddAlarmRule(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<AlarmRuleDataType>) => {
            const { id, siteName, scheduleTemplateName, ...filteredPayload } = payload;
            const response = await axiosServices.post(ALARMRULE_API_URL, filteredPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alarm-rule-list"] })
        }
    })
}

export function useEditAlarmRule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<AlarmRuleDataType>) => {
            if (!payload.id) throw new Error('Missing alarm rule id');
            const { id, siteId, siteName, scheduleTemplateName, ...filteredPayload } = payload;
            const response = await axiosServices.put(`${ALARMRULE_API_URL}${id}`, filteredPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alarm-rule-list"] })
        }
    })
}


export function useDeleteAlarmRule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await axiosServices.delete(`${ALARMRULE_API_URL}${id}`)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alarm-rule-list"] })
        }
    })
}

