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
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    floorplanId?: string;
};

type Nodes = {
    id: string;
    x: number;
    y: number;
    x_px: number;
    y_px: number;
};


export interface areaType {
    id: string,
    siteId: string,
    siteName: string,
    name: string,
    floorplanId: string,
    floorplanName: string,
    areaShape: string,
    colorArea: string,
    areaNodes?: Nodes[];
};

interface StateType {
    areas: areaType[];
    areaSearch: string;
    selectedArea: areaType | null;
    areaFilter: GetFilter;
    lastFilter?: GetFilter;
    areaMeta: metaData;
    isLoading: boolean;
    hasLoaded: boolean;
};

const initialState: StateType = {
    areas: [],
    areaSearch: '',
    selectedArea: null,
    areaFilter: {
        page: 1,
        limit: 10,
        search: '',
        sortBy: 'name',
        sortOrder: 'asc',
    },
    lastFilter: undefined,
    areaMeta: {
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

export const areaSlice = createSlice ({
    name: "areas",
    initialState,

    reducers: {
        GetAreas: (state, action: PayloadAction<areaType[]>) => {
            state.areas = action.payload;
        },
        SelectArea: (state, action: PayloadAction<string>) => {
            const selected = state.areas.find((area: areaType) => area.id === action.payload);
            state.selectedArea = selected || null;
        },
        SetSelectedArea: (state, action: PayloadAction<areaType | null>) => {
            state.selectedArea = action.payload;
        },
        SearchAreas: (state, action: PayloadAction<string>) => {
            state.areaSearch = action.payload;
        },
        UpdateFilter: (state: StateType, action: PayloadAction<Partial<GetFilter>>) => {
          state.areaFilter = { ...state.areaFilter, ...action.payload };
        },
        UpdateAreaMeta: (state: StateType, action: PayloadAction<Partial<GetFilter>>) => {
            state.areaMeta = {...state.areaMeta, ...action.payload};
        }
    }
});

export const {
    GetAreas,
    SelectArea,
    SetSelectedArea,
    SearchAreas,
    UpdateFilter,
    UpdateAreaMeta
} = areaSlice.actions;

export default areaSlice.reducer;