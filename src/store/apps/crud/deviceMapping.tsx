import axiosServices, { BASE_URL } from "../../../utils/axios";
import { createSlice } from "@reduxjs/toolkit";
import { AppDispatch, dispatch } from "src/store/Store";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { ensureMinLatency, retryUntilSuccess } from "src/utils/retry";
import { metaData } from "./site";

// const API_URL = "/api/controllers/";
// const API_DT_URL = "/api/controllers/filter/";
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export type GetFilter = {
    page: number;
    limit: number;
    // search: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    floorplanId: string | null;
};

export interface DeviceMappingType {
    id: string,
    floorplanId: string,
    floorplanName: string,
    areaId: string,
    areaName: string,
    deviceId: string | null,
    deviceName: string ,
    hardwareId: string,
    deviceType: string,
    deviceStatus: string,
    posPxX: number,
    posPxY: number,
    label: string,
}

interface StateType {
    deviceMappings: DeviceMappingType[];
    deviceMappingSearch: string;
    selectedDeviceMapping: DeviceMappingType | null;
    deviceMappingMeta: metaData;
    deviceMappingFilter: GetFilter;
    lastDeviceMappingFilter: GetFilter | undefined;
}

const initialState: StateType = {
    deviceMappings: [],
    deviceMappingSearch: '',
    selectedDeviceMapping: null,
    deviceMappingMeta: {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
    },
    deviceMappingFilter: {
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
        floorplanId: null,
    },
    lastDeviceMappingFilter: undefined,
};

export const DeviceMappingSlice = createSlice({
    name: 'deviceMapping',
    initialState,
    reducers: {
        GetDeviceMapping: (state, action) => {
            state.deviceMappings = action.payload;
        },
        GetDeviceMappingSearch: (state, action) => {
            state.deviceMappingSearch = action.payload;
        },
        SelectDeviceMapping: (state, action: PayloadAction<DeviceMappingType | null>) => {
            state.selectedDeviceMapping = action.payload || null;
        },
        UpdateDeviceMappingFilter: (state, action: PayloadAction<Partial<GetFilter>>) => {
            state.deviceMappingFilter = { ...state.deviceMappingFilter, ...action.payload }
        },
        UpdateDeviceMappingMeta: (state: StateType, action: PayloadAction<Partial<metaData>>) => {
            state.deviceMappingMeta = { ...state.deviceMappingMeta, ...action.payload }
        }
    }
})

export const {
    GetDeviceMapping,
    GetDeviceMappingSearch,
    SelectDeviceMapping,
    UpdateDeviceMappingFilter,
    UpdateDeviceMappingMeta,
} = DeviceMappingSlice.actions;

export default DeviceMappingSlice.reducer;