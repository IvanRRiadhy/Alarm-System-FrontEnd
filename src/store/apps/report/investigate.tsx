import axiosServices from '../../../utils/axios';
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { metaData } from '../crud/site';

export type InvestigateAttachmentType = {
    id: string;
    alarmInvestigationId: string;
    stage: string;
    fileUrl: string;
    fileType: string;
}

export type GetFilter = {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    siteId?: string;
    buildingId?: string;
    floorId?: string;
    floorplanId?: string;
    areaId?: string;
    controllerId?: string;
    deviceId?: string;
    deviceType?: string;
    startDate?: string;
    endDate?: string;
    timeRange?: "daily" | "today" | "yesterday" | "weekly" | "last_week" | "monthly" | "last_monthly" | "yearly" | "last_yearly" | "last_7_days" | "last_30_days" | "last_90_days";
    severity?: "low" | "medium" | "high" | "critical";
    isCleared?: boolean;
    personnelId?: string;
    investigationStatus?: string;
    HasInvestigation?: boolean;
}

export type investigateType = {
    caseId: string;
    caseNumber: string;
    siteId: string;
    siteName: string;
    siteRegion: string;
    buildingId: string;
    buildingName: string;
    floorId: string;
    floorName: string;
    floorplanId: string;
    floorplanName: string;
    areaId: string;
    areaName: string;
    controllerId: string;
    controllerName: string;
    deviceId: string;
    deviceName: string;
    deviceType: string;
    severity: string;
    triggeredAt: string;
    clearedAt: string | null;
    investigationId: string | null;
    personnelId: string | null;
    personnelName: string | null;
    dispatchedPersonnelIds: string[];
    dispatchedPersonnelNames: string[];
    investigationStatus: string | null;
    acceptedAt: string | null;
    dispatchedAt: string | null;
    arrivedAt: string | null;
    postponedAt: string | null;
    postponedUntil: string | null;
    noActionAt: string | null;
    doneInvestigatedAt: string | null;
    doneAt: string | null;
    investigationResult: string | null;
    investigationNote: string | null;
    attachments: InvestigateAttachmentType[];
};

interface StateType {
    investigations: investigateType[];
    selectedInvestigation: investigateType | null;
    investigateFilter: GetFilter;
    investigateMeta: metaData;
}

const initialState: StateType = {
    investigations: [],
    selectedInvestigation: null,
    investigateFilter: {
        page: 1,
        limit: 10,
        search: '',
        sortBy: '',
        sortOrder: 'desc',
    },
    investigateMeta: {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    },
};

export const InvestigateSlice = createSlice({
    name: 'investigate',
    initialState,
    reducers: {

        GetInvestigations: (state, action: PayloadAction<investigateType[]>) => {
            state.investigations = action.payload;
        },
        SelectInvestigation: (state, action: PayloadAction<investigateType | null>) => {
            state.selectedInvestigation = action.payload;
        },
        UpdateFilter: (state, action: PayloadAction<Partial<GetFilter>>) => {
            state.investigateFilter = { ...state.investigateFilter, ...action.payload };
        },
        UpdateMeta: (state, action: PayloadAction<metaData>) => {
            state.investigateMeta = action.payload;
        },
    },
});

export const { GetInvestigations, SelectInvestigation, UpdateFilter, UpdateMeta } = InvestigateSlice.actions;

export default InvestigateSlice.reducer;