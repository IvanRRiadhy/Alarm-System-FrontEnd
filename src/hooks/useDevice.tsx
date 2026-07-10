// src/hooks/useFloor.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { useSelector } from 'react-redux';
import { AppDispatch, RootState, useDispatch } from 'src/store/Store';
import { metaData } from 'src/store/apps/crud/site';
import { GetFilter, deviceType, UpdateDeviceMeta } from 'src/store/apps/crud/devices'

const DEVICE_API_URL = '/api/devices/';

interface PaginatedResponse<T> {
  data: T[];
  msg: string;
  meta: metaData;
  status: number;
}

export function useDeviceList(filter?: GetFilter) {
    const dispatch = useDispatch();
    return useQuery({
        queryKey: ['device-list', filter],
        queryFn: async () => {
            const response = await axiosServices.get<PaginatedResponse<deviceType>>(DEVICE_API_URL,{
                params: filter
            });
            dispatch(UpdateDeviceMeta(response.data.meta));
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}

export function useDeviceLookup(filter?: GetFilter) {
    return useQuery({
        queryKey: ['device-lookup', filter],
        queryFn: async () => {
            const response = await axiosServices.get<PaginatedResponse<deviceType>>(`${DEVICE_API_URL}lookup`,{
                params: filter
            });
            console.log("Response", response)
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}

export function useAddDevice(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<deviceType>) => {
            const { id, ...filteredPayload } = payload;
            console.log("Payload", filteredPayload)
            const response = await axiosServices.post(DEVICE_API_URL, filteredPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["device-list"] })
        }
    })
}

export function useEditDevice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<deviceType>) => {
            if (!payload.id) throw new Error('Missing device id');
            const { id, siteId, siteName, battery, isOnline, lastSeen, controllerId, controllerName, ...filteredPayload } = payload;
            const response = await axiosServices.put(`${DEVICE_API_URL}${id}`, filteredPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["device-list"] })
        }
    })
}


export function useDeleteDevice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await axiosServices.delete(`${DEVICE_API_URL}${id}`)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["device-list"] })
        }
    })
}

