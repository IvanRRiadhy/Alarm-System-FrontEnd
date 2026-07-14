import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { SiteType, GetFilter, UpdateMeta } from '../store/apps/crud/site';
import { RootState, useDispatch, useSelector } from 'src/store/Store';
import { metaData } from '../store/apps/crud/site';

const Site_API_URL = '/api/sites/';



interface PaginatedResponse<T> {
  data: T[];
  msg: string;
  meta: metaData;
  status: number;
}

export function useSiteList(filter?: GetFilter) {
    const dispatch = useDispatch();
    return useQuery({
        queryKey: ['site-list', filter],
        queryFn: async () => {
            const response = await axiosServices.get<PaginatedResponse<SiteType>>(Site_API_URL,{
                params: filter
            });
            dispatch(UpdateMeta(response.data.meta));
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}

export function useSiteById(id: string) {
    return useQuery({
        queryKey: ['site-by-id', id],
        queryFn: async() => {
            const response = await axiosServices.get<PaginatedResponse<SiteType>>(`${Site_API_URL}${id}`);
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000
    })
}

export function useSiteLookup() {
    return useQuery({
        queryKey: ['site-lookup'],
        queryFn: async () => {
            const response = await axiosServices.get<PaginatedResponse<SiteType>>(`${Site_API_URL}lookup`);
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}

export function useAddSite(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<SiteType>) => {
            const { id, ...filteredPayload } = payload;
            const response = await axiosServices.post(Site_API_URL, filteredPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["site-list"] })
        }
    })
}

export function useEditSite() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<SiteType>) => {
            if (!payload.id) throw new Error('Missing site id');
            const { id, ...filteredPayload } = payload;
            const response = await axiosServices.put(`${Site_API_URL}${id}`, filteredPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["site-list"] })
        }
    })
}


export function useDeleteSite() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await axiosServices.delete(`${Site_API_URL}${id}`)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["site-list"] })
        }
    })
}


export function useAssignUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {userId: string, siteId: string}) => {
            const { userId, siteId } = payload;
            const response = await axiosServices.post(`${Site_API_URL}${siteId}/assign-users`, { userId })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["site-list"] })
        }
    })
}
