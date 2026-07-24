import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { defaultSiteFilter } from "../defaultForm";

export type metaData = {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean
}
export type GetFilter = {
    page?: number,
    limit?: number,
    search?: string,
    sortBy?: string,
    sortOrder?: 'asc' | "desc",
    region?: string,
    timezone?: string,
}

export type SiteType = {
    id: string;
    code: string;
    name: string;   
    address: string;
    phone: string;
    email: string;
    timezone: string;
    region: string;
    latitude: number;
    longitude: number;
    enableEmailNotification?: boolean;
    enableWaNotification?: boolean;
}

export type GetSiteResponse = {
    success: boolean;
    msg: string;
    data: SiteType[];
    code: number;
}

interface StateType {
    sites: SiteType[];
    siteAll: SiteType[];
    siteSearch: string;
    selectedSite: SiteType | null;
    siteTotalCount: number;
    siteFilteredCount: number;
    siteFilter: GetFilter;
    lastFilter?: GetFilter;
    siteMeta: metaData;
    isLoading: boolean;
    hasLoaded: boolean;
};

const initialState: StateType = {
    sites: [],
    siteAll: [],
    siteSearch: '',
    selectedSite: null,
    siteTotalCount: 0,
    siteFilteredCount: 0,
    siteFilter: { ...defaultSiteFilter },
    siteMeta: {
        page: 0,
        limit: 0,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
    },
    isLoading: false,
    hasLoaded: false,
}

export const SiteSlice = createSlice({
    name: 'site',
    initialState,
    reducers: {
        GetSites: (state, action: PayloadAction<GetSiteResponse>)=>{
            state.sites = action.payload.data;
        },
        SelectSite: (state, action: PayloadAction<string>)=>{
            const site = state.sites.find(b => b.id === action.payload);
            state.selectedSite = site || null;
        },
        UpdateFilter: (state, action: PayloadAction<Partial<GetFilter>>) => {
            state.siteFilter = { ...state.siteFilter, ...action.payload };
        },
        UpdateMeta: (state, action: PayloadAction<Partial<metaData>>) => {
            state.siteMeta = { ...state.siteMeta, ...action.payload};
        }
    }
})

export const {
    GetSites,
    SelectSite,
    UpdateFilter,
    UpdateMeta,
} = SiteSlice.actions;
export default SiteSlice.reducer;