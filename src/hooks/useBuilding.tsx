import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { BuildingType, GetFilter, UpdateBuildingMeta } from '../store/apps/crud/building';
import { RootState, useDispatch, useSelector } from 'src/store/Store';

const Building_API_URL = '/api/buildings/';
const Building_DT_URL = '/api/buildings/filter/';
const Config_URL = '/api/config-exchange/';

type metaData = {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean
}

interface PaginatedResponse<T> {
  data: T[];
  msg: string;
  meta: metaData;
  totalCount: number;
  
}

export function useBuildingList(filter?: GetFilter) {
    const dispatch = useDispatch();
    return useQuery({
        queryKey: ['building-list', filter],
        queryFn: async () => {
            const response = await axiosServices.get<PaginatedResponse<BuildingType>>(Building_API_URL, {
                params: filter,
            });
            // console.log('Building list fetched successfully: ', response.data);
            // const collection = response.data;
            dispatch(UpdateBuildingMeta(response.data?.meta))
            return {
                data: response.data.data as BuildingType[],
                msg: response.data.msg,
                meta: {
                    page: response.data.meta.page,
                    limit: response.data.meta.limit,
                    totalItems: response.data.meta.totalItems,
                    totalPages: response.data.meta.totalPages,
                    hasNextPage: response.data.meta.hasNextPage,
                    hasPreviousPage: response.data.meta.hasPreviousPage
                },
                totalCount: response.data.totalCount,
            } satisfies PaginatedResponse<BuildingType>;
        },
        placeholderData: keepPreviousData, // ✅ TanStack v5 way
        staleTime: 5_000, // data dianggap fresh 5 detik
        gcTime: 5 * 60_000, // cache disimpan 5 menit
    });
}

export function useAllBuilding() {
    return useQuery({
        queryKey: ['building-all'],
        queryFn: async () => {
            const response = await axiosServices.get(Building_API_URL);
            // console.log('Building list fetched successfully: ', response.data);
            return response.data.collection.data as BuildingType[];
        },
        placeholderData: [],
    });
}

export function useAddBuilding(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            formData.delete("id")
            const response = await axiosServices.post(Building_API_URL, formData);
            // console.log('Building added successfully: ', response.data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['building-list']});
            queryClient.invalidateQueries({queryKey: ['building-all']});
        },
    });
}

export function useEditBuilding(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const id = formData.get('id');
            const res = await axiosServices.put(`${Building_API_URL}${id}`, formData);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['building-list']});
            queryClient.invalidateQueries({queryKey: ['building-all']});
        },
    });
}

export function useDeleteBuilding(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await axiosServices.delete(`${Building_API_URL}${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['building-list']});
            queryClient.invalidateQueries({queryKey: ['building-all']});
        },
    }); 
}

export function useBuildingStatus(){
    const buildingFilter = useSelector((state: RootState) => state.buildingReducer.buildingFilter);
    const query = useBuildingList(buildingFilter);

    return {
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        hasLoaded: query.isFetched, // ✅ substitusi untuk redux.hasLoaded
        totalCount: query.data?.meta.totalItems || 0,
    }
}

export function useExportBuildingConfig(){
    return useMutation({
        mutationFn: async (building_id: string) => {
            const response = await axiosServices.get(`${Config_URL}export/${building_id}`, {
                responseType: 'blob',
            });
            return response.data;
        }, 
    });
}

export function useImportBuildingConfig(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await axiosServices.post(Config_URL + 'import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // console.log('Building added successfully: ', response.data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['building-list']});
            queryClient.invalidateQueries({queryKey: ['building-all']});
        },
    });
}