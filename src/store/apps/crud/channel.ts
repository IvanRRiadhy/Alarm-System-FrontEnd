import axiosServices, { BASE_URL } from "../../../utils/axios";
import { createSlice } from "@reduxjs/toolkit";
import { AppDispatch, dispatch } from "src/store/Store";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { ensureMinLatency, retryUntilSuccess } from "src/utils/retry";
import { metaData } from "./site";
import { defaultChannelFilter } from "../defaultForm";
// import { defaultControllerFilter } from "../defaultForm";

// const API_URL = "/api/channels/";
// const API_DT_URL = "/api/channels/filter/";
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export type GetFilter = {
    page: number;
    limit: number;
    // search: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    controllerId:string | null;
};

export interface channelType {
    id: string,
    siteId: string,
    siteName: string,
    name: string,
    controllerId: string,
    controllerName: string,
    channelNo: number,
    isEnabled: boolean,
    isUsed?: boolean,

    // createdBy: string,
    // createdAt: string,
    // updatedBy: string,
    // updatedAt: string,
        // building?: BuildingType,
};

interface StateType {
    channels: channelType[];
    channelSearch: string;
    selectedChannel: channelType | null;
    controllerFilter: GetFilter;
    lastFilter?: GetFilter;
    channelMeta: metaData;
    isLoading: boolean;
    hasLoaded: boolean;
};

const initialState: StateType = {
    channels: [],
    channelSearch: '',
    selectedChannel: null,
    controllerFilter: defaultChannelFilter,
    lastFilter: undefined,
    channelMeta: {
        page: 1,
        limit: 100,
        totalItems: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
    },
    isLoading: false,
    hasLoaded: false,
};

export const controllerSlice = createSlice ({
    name: "channels",
    initialState,

    reducers: {
        GetChannel: (state, action: PayloadAction<channelType[]>) => {
            state.channels = action.payload;
        },
        SelectChannel: (state, action: PayloadAction<string>) => {
            const selected = state.channels.find((controller: channelType) => controller.id === action.payload);
            state.selectedChannel = selected || null;
        },
        SetSelectedChannel: (state, action: PayloadAction<channelType | null>) => {
            state.selectedChannel = action.payload;
        },
        SearchChannel: (state, action: PayloadAction<string>) => {
            state.channelSearch = action.payload;
        },
        UpdateChannelFilter: (state, action: PayloadAction<Partial<GetFilter>>) => {
            state.controllerFilter = {...state.controllerFilter, ...action.payload};
        },
        UpdateChannelMeta: (state: StateType, action: PayloadAction<Partial<GetFilter>>) => {
            state.channelMeta = {...state.channelMeta, ...action.payload};
        }
    }
});

export const {
    GetChannel,
    SelectChannel,
    SetSelectedChannel,
    SearchChannel,
    UpdateChannelFilter,
    UpdateChannelMeta
} = controllerSlice.actions;

export default controllerSlice.reducer;