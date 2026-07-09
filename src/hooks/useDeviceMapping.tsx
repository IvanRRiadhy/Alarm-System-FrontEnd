// src/hooks/useDeviceMapping.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { useDispatch } from 'src/store/Store';
import { metaData } from 'src/store/apps/crud/site';
import { GetFilter, DeviceMappingType, UpdateDeviceMappingMeta } from 'src/store/apps/crud/deviceMapping'

const DEVICE_MAPPING_API_URL = '/api/device-mappings/';

interface PaginatedResponse<T> {
  data: T[];
  msg: string;
  meta: metaData;
  status: number;
}

export function useDeviceMappingList(filter?: GetFilter) {
    const dispatch = useDispatch();
    return useQuery({
        queryKey: ['device-mapping-list', filter],
        queryFn: async () => {
            const response = await axiosServices.get<PaginatedResponse<DeviceMappingType>>(DEVICE_MAPPING_API_URL,{
                params: filter
            });
            dispatch(UpdateDeviceMappingMeta(response.data.meta));
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}

export function useAddDeviceMapping(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<DeviceMappingType>) => {
            const { id, ...filteredPayload } = payload;
            const response = await axiosServices.post(DEVICE_MAPPING_API_URL, filteredPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["device-mapping-list"] })
        }
    })
}

export function useEditDeviceMapping() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<DeviceMappingType>) => {
            if (!payload.id) throw new Error('Missing device mapping id');
            const { id, floorplanId, floorplanName, deviceId, deviceName, ...filteredPayload } = payload;
            const response = await axiosServices.put(`${DEVICE_MAPPING_API_URL}${id}`, filteredPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["device-mapping-list"] })
        }
    })
}


export function useDeleteDeviceMapping() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await axiosServices.delete(`${DEVICE_MAPPING_API_URL}${id}`)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["device-mapping-list"] })
        }
    })
}
