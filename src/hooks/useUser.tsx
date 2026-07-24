import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { RootState, useSelector } from 'src/store/Store';
import { userType, GetFilter, userRegistrationType, userProfileType, userUpdateProfilePayload } from 'src/store/apps/crud/users';

// -----------------------------------------------------------------------------
// ✅ API URLs
// -----------------------------------------------------------------------------
const API_URL = '/api/users';


// ✅ Shared paginated response interface
export interface PaginatedResponse<T> {
  data: T[];
  msg: string;
  status: number;
}

export interface SingleResponse<T> {
  data: T;
  msg: string;
  status: number;
}


// -----------------------------------------------------------------------------
// ✅ FETCH ALL USERS (for dropdowns, etc.)
// -----------------------------------------------------------------------------
export function useAllUsers(filter?: GetFilter) {
  return useQuery({
    queryKey: ['user-all', filter],
    queryFn: async () => {
      const res = await axiosServices.get(API_URL, {
        params: filter,
      });
      console.log('Users: ', res.data);
      return res.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}


// -----------------------------------------------------------------------------
// ✅ REGISTER NEW USER
// -----------------------------------------------------------------------------
export function useRegisterUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: userRegistrationType) => {
      const res = await axiosServices.post(`${API_URL}/create-admin`, payload);
      console.log('Adding Result', res);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-all'] });
    },
  });
}

// -----------------------------------------------------------------------------
// ✅ EDIT USER
// -----------------------------------------------------------------------------
export function useEditUser() {
  const queryClient = useQueryClient();
  return useMutation({ 
    mutationFn: async ({payload, id} : {payload: userRegistrationType, id: string})  => {
      const res = await axiosServices.put(`${API_URL}/${id}`, payload);
      console.log('Editing Result', res);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-all'] });
    },
  });
}
// -----------------------------------------------------------------------------
// ✅ DELETE USER
// -----------------------------------------------------------------------------
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({ 
    mutationFn: async ({id} : {id: string})  => {
      const res = await axiosServices.delete(`${API_URL}/${id}`);
      console.log('Deleting Result', res);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-all'] });
    },
  });
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await axiosServices.get<SingleResponse<userProfileType>>(`${API_URL}/profile`);
      console.log('User Profile: ', res.data.data);
      return res.data.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({ 
    mutationFn: async (payload: userUpdateProfilePayload)  => {
      const res = await axiosServices.put(`${API_URL}/profile`, payload);
      console.log('Editing Result', res);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}