import { useQuery, useMutation, useQueryClient, keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { PersonnelType, GetFilter, UpdatePersonnelMeta } from '../store/apps/crud/personnels';
import { RootState, useDispatch, useSelector } from 'src/store/Store';
import { metaData } from '../store/apps/crud/site';

const PERSONNEL_API_URL = '/api/personnel/';



interface PaginatedResponse<T> {
  data: T[];
  msg: string;
  meta: metaData;
  status: number;
}

export function usePersonnelLookup(filter?: GetFilter) {
    return useQuery({
        queryKey: ['personnel-lookup', filter],
        queryFn: async () => {
            const response = await axiosServices.get<PaginatedResponse<PersonnelType>>(`${PERSONNEL_API_URL}lookup`,{
                params: filter
            });
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}

export function usePersonnelList(filter?: GetFilter) {
    const dispatch = useDispatch();
    return useQuery({
        queryKey: ['personnel-list', filter],
        queryFn: async () => {
            const response = await axiosServices.get<PaginatedResponse<PersonnelType>>(PERSONNEL_API_URL,{
                params: filter
            });
            dispatch(UpdatePersonnelMeta(response.data.meta));
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}

export function useInfinitePersonnelList(filter: GetFilter, limit: number = 50) {
  const dispatch = useDispatch();
  return useInfiniteQuery({
    queryKey: ['personnel-list', 'infinite', filter],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axiosServices.get<PaginatedResponse<PersonnelType>>(PERSONNEL_API_URL, {
        params: { ...filter, page: pageParam, limit },
      });
      dispatch(UpdatePersonnelMeta(response.data.meta));
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length < limit) return undefined;
      return allPages.length + 1;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAddPersonnel(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<PersonnelType>) => {
            const { id,siteName, ...filteredPayload } = payload;
            const response = await axiosServices.post(PERSONNEL_API_URL, filteredPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["personnel-list"] })
        }
    })
}

export function useEditPersonnel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<PersonnelType>) => {
            if (!payload.id) throw new Error('Missing personnel id');
            const { id, siteName, ...filteredPayload } = payload;
            const response = await axiosServices.put(`${PERSONNEL_API_URL}${id}`, filteredPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["personnel-list"] })
        }
    })
}


export function useDeletePersonnel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await axiosServices.delete(`${PERSONNEL_API_URL}${id}`)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["personnel-list"] })
        }
    })
}

