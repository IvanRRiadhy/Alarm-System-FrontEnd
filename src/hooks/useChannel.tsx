// src/hooks/useFloor.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { AppDispatch, useDispatch } from 'src/store/Store';
import { metaData } from 'src/store/apps/crud/site';
import { GetFilter, channelType, UpdateChannelMeta } from 'src/store/apps/crud/channel';

const CONTROLLER_API_URL = '/api/channels/';

interface PaginatedResponse<T> {
  data: T[];
  msg: string;
  meta: metaData;
  status: number;
}

export function useChannel(filter: GetFilter) {
    const dispatch: AppDispatch = useDispatch();

    return useQuery<PaginatedResponse<channelType>, Error>({
        queryKey: ["channels", filter],
        queryFn: async () => {
            const response = await axiosServices.get<PaginatedResponse<channelType>>(`${CONTROLLER_API_URL}`, { params: filter });
            dispatch(UpdateChannelMeta(response.data.meta));
            return response.data;
        },
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
    })
}

export function useUpdateChannel() {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: async (payload: Partial<channelType>) => {
                if (!payload.id) throw new Error('Missing channel id');
                const { id, siteId, ...filteredPayload } = payload;
                const response = await axiosServices.put(`${CONTROLLER_API_URL}${id}`, filteredPayload)
                return response.data
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["channels"] })
            }
        })
}
