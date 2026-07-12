import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { metaData } from '../store/apps/crud/site';
import {AlarmInvestigationType, AttachmentsType, GetFilter, SetAlarmInvestigations, UpdateAlarmInvestigationMeta} from '../store/apps/crud/alarmInvestigation';
// export type { AlarmEvent, GetFilter };
import { useDispatch } from 'src/store/Store';

const API_URL = "/api/alarm-investigations";

interface PaginatedResponse<T> {
    data: T[];
    msg: string;
    meta: metaData;
    success: boolean;
    code: number;
}

export interface AlarmInvestigationCreatePayload {
    alarmEventId: string;
    personnelId: string;
    note: string;
}

export interface AlarmInvestigationUpdatePayload {
    personnelId: string;
    note: string;
    status: string;
    result: string;
    postponedUntil: string;
    attachments: AttachmentsType[];
}

export function useAlarmInvestigationList(filter?: GetFilter) {
    const dispatch = useDispatch();
    return useQuery({
        queryKey: ['alarm-investigation-list', filter],
        queryFn: async () => {
            const response = await axiosServices.get<PaginatedResponse<AlarmInvestigationType>>(API_URL, {
                params: filter,
            });
            console.log("Rsepose", response)
            dispatch(SetAlarmInvestigations(response.data.data));
            dispatch(UpdateAlarmInvestigationMeta(response.data.meta));
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
}

export function useCreateAlarmInvestigation(body: AlarmInvestigationCreatePayload) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await axiosServices.post(API_URL, body);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alarm-investigation-list"] });
        },
    });
}

export function useUpdateAlarmInvestigation(id: string, body: AlarmInvestigationUpdatePayload) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await axiosServices.put(`${API_URL}/${id}`, body);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alarm-investigation-list"] });
        },
    });
}