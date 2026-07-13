import axiosServices, { BASE_URL } from "../../../utils/axios";
import { createSlice } from "@reduxjs/toolkit";
import { AppDispatch, dispatch } from "src/store/Store";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { ensureMinLatency, retryUntilSuccess } from "src/utils/retry";
import { metaData } from "./site";
import { defaultControllerFilter } from "../defaultForm";

// const API_URL = "/api/controllers/";
// const API_DT_URL = "/api/controllers/filter/";
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export type GetFilter = {
    page: number;
    limit: number;
    // search: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
};

export interface controllerType {
    id: string,
    siteId: string,
    siteName: string,
    hardwareId:string,
    name: string,
    ipAddress: string,
    port: number,
    // channelCount: number,
    inputCount: number,
    outputCount: number,
    macAddress: string,
    firmwareVersion: string,
    alarmMode: string,
    status: string,
    lastSeen: string,

    // createdBy: string,
    // createdAt: string,
    // updatedBy: string,
    // updatedAt: string,
        // building?: BuildingType,
};

interface StateType {
    controllers: controllerType[];
    controllerSearch: string;
    selectedController: controllerType | null;
    controllerFilter: GetFilter;
    lastFilter?: GetFilter;
    controllerMeta: metaData;
    isLoading: boolean;
    hasLoaded: boolean;
};

const initialState: StateType = {
    controllers: [],
    controllerSearch: '',
    selectedController: null,
    controllerFilter: defaultControllerFilter,
    lastFilter: undefined,
    controllerMeta: {
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

export const controllerSlice = createSlice ({
    name: "controllers",
    initialState,

    reducers: {
        GetController: (state, action: PayloadAction<controllerType[]>) => {
            state.controllers = action.payload;
        },
        SelectController: (state, action: PayloadAction<string>) => {
            const selected = state.controllers.find((controller: controllerType) => controller.id === action.payload);
            state.selectedController = selected || null;
        },
        SetSelectedController: (state, action: PayloadAction<controllerType | null>) => {
            state.selectedController = action.payload;
        },
        SearchController: (state, action: PayloadAction<string>) => {
            state.controllerSearch = action.payload;
        },
        UpdateFilter: (state: StateType, action: PayloadAction<Partial<GetFilter>>) => {
          state.controllerFilter = { ...state.controllerFilter, ...action.payload };
        },
        UpdateControllerMeta: (state: StateType, action: PayloadAction<Partial<GetFilter>>) => {
            state.controllerMeta = {...state.controllerMeta, ...action.payload};
        }
    }
});

export const {
    GetController,
    SelectController,
    SetSelectedController,
    SearchController,
    UpdateFilter,
    UpdateControllerMeta
} = controllerSlice.actions;

export default controllerSlice.reducer;