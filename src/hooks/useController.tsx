// src/hooks/useFloor.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { useSelector } from 'react-redux';
import { AppDispatch, RootState, useDispatch } from 'src/store/Store';
import { metaData } from 'src/store/apps/crud/site';
import { GetFilter, controllerType, UpdateControllerMeta } from 'src/store/apps/crud/controller';

const CONTROLLER_API_URL = '/api/controllers/';

interface PaginatedResponse<T> {
  data: T[];
  msg: string;
  meta: metaData;
  status: number;
}

export function useControllerList(filter?: GetFilter) {
    const dispatch = useDispatch();
    return useQuery({
        queryKey: ['controller-list', filter],
        queryFn: async () => {
            const response = await axiosServices.get<PaginatedResponse<controllerType>>(CONTROLLER_API_URL,{
                params: filter
            });
            dispatch(UpdateControllerMeta(response.data.meta));
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}

export function useAddController(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<controllerType>) => {
            const { id, ...filteredPayload } = payload;
            const response = await axiosServices.post(CONTROLLER_API_URL, filteredPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["controller-list"] })
        }
    })
}

export function useEditController() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<controllerType>) => {
            if (!payload.id) throw new Error('Missing controller id');
            const { id, siteId, ...filteredPayload } = payload;
            const response = await axiosServices.put(`${CONTROLLER_API_URL}${id}`, filteredPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["controller-list"] })
        }
    })
}


export function useDeleteController() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await axiosServices.delete(`${CONTROLLER_API_URL}${id}`)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["controller-list"] })
        }
    })
}

export function useChangeStatusController() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { id: string; alarmMode: string }) => {
            const response = await axiosServices.put(`${CONTROLLER_API_URL}${payload.id}/alarm-mode`, { alarmMode: payload.alarmMode })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["controller-list"] })
        }
    })
}