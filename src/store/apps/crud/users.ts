import axiosServices from "../../../utils/axios";
import { createSlice } from "@reduxjs/toolkit";
import { AppDispatch, dispatch } from "src/store/Store";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { defaultUserFilter } from "../defaultForm";

const API_URL = "/api/users";
const REGIST_URL = '/api/Auth/register/';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export type GetFilter = {
    page: number,
    limit: number,
    // search: string,
    sortBy: string,
    sortOrder: 'asc' | "desc",
}

export type userType = {
    id: string,
    username: string,
    email: string,
    fullName: string,
    role: string,
    isActive: number,
    profilePicture: string,
};
export type userRegistrationType = {
    username: string,
    email: string,
    password: string,
    fullName: string,
    profilePicture?: string,
};

interface StateType {
    users : userType[];
    selectedUser : userType;
    userTotalCount: number;
    userFilteredCount: number;
    userFilter: GetFilter;
    lastFilter?: GetFilter;
isLoading: boolean;
hasLoaded: boolean;
}

const initialState: StateType = {
    users: [],
    selectedUser: {} as userType,
    userTotalCount: 0,
    userFilteredCount: 0,
    userFilter: defaultUserFilter,

    isLoading: false,
    hasLoaded: false,
};

export const UserSlice = createSlice({
    name: "users",
    initialState,
    reducers: {
        GetUsers: (state, action: PayloadAction<userType[]>) => {
            state.users = action.payload;
        },
        setSelectedUser: (state, action: PayloadAction<userType>) => {
            state.selectedUser = action.payload;
        },
        UpdateFilter: (state, action: PayloadAction<Partial<GetFilter>>) => {
            state.userFilter = {...state.userFilter, ...action.payload};
        },
    }
});

export const { GetUsers, setSelectedUser, UpdateFilter } = UserSlice.actions;


export default UserSlice.reducer;