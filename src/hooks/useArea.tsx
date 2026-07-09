// src/hooks/useFloor.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { useSelector } from 'react-redux';
import { AppDispatch, RootState, useDispatch } from 'src/store/Store';
import { metaData } from 'src/store/apps/crud/site';
import { GetFilter, areaType, UpdateAreaMeta } from 'src/store/apps/crud/area'
import { safeParseAreaShape } from 'src/utils/isJsonObject';

const AREA_API_URL = '/api/areas/';

interface PaginatedResponse<T> {
  data: T[];
  msg: string;
  meta: metaData;
  status: number;
}

export function useAreaList(filter?: GetFilter) {
    const dispatch = useDispatch();
    return useQuery({
        queryKey: ['area-list', filter],
        queryFn: async () => {
            const response = await axiosServices.get<PaginatedResponse<areaType>>(AREA_API_URL,{
                params: filter
            });
            const parsedData = response.data.data.map((item) => ({
                ...item,
                areaNodes: safeParseAreaShape(item.areaShape)
            }));
            dispatch(UpdateAreaMeta(response.data.meta));
            return { ...response.data, data: parsedData };
        },
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}

export function useAddArea(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<areaType>) => {
            const { id, ...filteredPayload } = payload;
            const response = await axiosServices.post(AREA_API_URL, filteredPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["area-list"] })
        }
    })
}

export function useEditArea() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<areaType>) => {
            if (!payload.id) throw new Error('Missing area id');
            const { id, ...filteredPayload } = payload;
            const response = await axiosServices.put(`${AREA_API_URL}${id}`, filteredPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["area-list"] })
        }
    })
}


export function useDeleteArea() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await axiosServices.delete(`${AREA_API_URL}${id}`)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["area-list"] })
        }
    })
}

