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
    floorplanId?: string;
    deviceIO?: string; //input, output, stream, none
};

export interface deviceType {
    id: string,
    siteId: string,
    siteName: string,
    name: string,
    channelId: string | null,
    hardwareId: string,
    serialNumber: string,
    manufacturer: string,
    model: string,
    deviceType: 'Other' | 'MotionSensor' | 'DoorSensor' | 'GlassBreakSensor' | 'BeamSensor' | 'VibrationSensor' | 'CctvCamera' | 'DoorLock' | 'Siren' | 'StrobeLight' | 'PanicButton',
    alarmSeverity: 'low' | 'medium' | 'high' | 'critical',
    alarmMode: string,
    isNormalyClose: boolean,
    is24H: boolean,
    isPanic: boolean,
    isEntry: boolean,
    deviceIO: 'None' | 'Input' | 'Output' | 'Stream',
    ipAddress: string | null,
    port: string | null,
    username: string | null,
    password: string | null,
    rtspUrl: string | null,
    controllerId?: string,
    controllerName?: string,
    battery?: string,
    isOnline?: string,
    lastSeen?: string,
};

interface StateType {
    devices: deviceType[];
    deviceSearch: string;
    selectedDevice: deviceType | null;
    deviceFilter: GetFilter;
    lastFilter?: GetFilter;
    deviceMeta: metaData;
    isLoading: boolean;
    hasLoaded: boolean;
};

const initialState: StateType = {
    devices: [],
    deviceSearch: '',
    selectedDevice: null,
    deviceFilter: {
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
    },
    lastFilter: undefined,
    deviceMeta: {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
    },
    isLoading: false,
    hasLoaded: false,
};

export const deviceSlice = createSlice ({
    name: "devices",
    initialState,

    reducers: {
        GetDevice: (state, action: PayloadAction<deviceType[]>) => {
            state.devices = action.payload;
        },
        SelectDevice: (state, action: PayloadAction<string>) => {
            const selected = state.devices.find((device: deviceType) => device.id === action.payload);
            state.selectedDevice = selected || null;
        },
        SetSelectedDevice: (state, action: PayloadAction<deviceType | null>) => {
            state.selectedDevice = action.payload;
        },
        SearchDevice: (state, action: PayloadAction<string>) => {
            state.deviceSearch = action.payload;
        },
        UpdateFilter: (state: StateType, action: PayloadAction<Partial<GetFilter>>) => {
          state.deviceFilter = { ...state.deviceFilter, ...action.payload };
        },
        UpdateDeviceMeta: (state: StateType, action: PayloadAction<Partial<GetFilter>>) => {
            state.deviceMeta = {...state.deviceMeta, ...action.payload};
        }
    }
});

export const {
    GetDevice,
    SelectDevice,
    SetSelectedDevice,
    SearchDevice,
    UpdateFilter,
    UpdateDeviceMeta
} = deviceSlice.actions;

export default deviceSlice.reducer;