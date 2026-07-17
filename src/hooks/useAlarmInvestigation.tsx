import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { metaData } from '../store/apps/crud/site';
import {AlarmInvestigationType, AttachmentsType, GetFilter, SetAlarmInvestigations, UpdateAlarmInvestigationMeta} from '../store/apps/report/alarmInvestigation';
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
    AlarmCaseId?: string;
    alarmEventId?: string;
    personnelId?: string;
    note: string;
}

export interface AlarmInvestigationResolvePayload {
    // personnelId: string;
    note?: string;
    // status: string;
    result?: string;
    isNoAction: boolean;
    // postponedUntil: string;
    attachments: AttachmentsType[];
}

export interface AlarmInvestigationPostponePayload {
    postponedUntil: string;
    note?: string;
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
            queryClient.invalidateQueries({ queryKey: ["alarm-case-list"] });
        },
    });
}

export function useUpdateAlarmInvestigation(id: string, body: AlarmInvestigationResolvePayload) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await axiosServices.put(`${API_URL}/${id}`, body);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alarm-investigation-list"] });
            queryClient.invalidateQueries({ queryKey: ["alarm-case-list"] });
        },
    });
}

export function useAcknowledgeInvestigation(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await axiosServices.put(`${API_URL}/${id}/acknowledge`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alarm-investigation-list"] });
            queryClient.invalidateQueries({ queryKey: ["alarm-case-list"] });
        },
    });
}

export function useDispatchInvestigation(id: string, personnelIds: string[]) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await axiosServices.put(`${API_URL}/${id}/dispatch`, {personnelIds});
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alarm-investigation-list"] });
            queryClient.invalidateQueries({ queryKey: ["alarm-case-list"] });
        },
    });
}

export function useResolveInvestigation(id: string, body: AlarmInvestigationResolvePayload) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await axiosServices.put(`${API_URL}/${id}/resolve`, body);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alarm-investigation-list"] });
            queryClient.invalidateQueries({ queryKey: ["alarm-case-list"] });
        },
    });  
}

export function usePostponeInvestigation(id: string, body: AlarmInvestigationPostponePayload) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await axiosServices.put(`${API_URL}/${id}/postpone`, body);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alarm-investigation-list"] });
            queryClient.invalidateQueries({ queryKey: ["alarm-case-list"] });
        },
    });
}