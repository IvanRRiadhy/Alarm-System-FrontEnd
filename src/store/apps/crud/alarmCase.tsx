

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { metaData } from "./site";

export interface AlarmCaseType {
    id: string;
    caseNumber: string;
    deviceId: string;
    deviceName: string;
    deviceType: string;
    siteName: string;
    areaName: string;
    severity: string;
    triggeredAt: string;
    clearedAt: string | null;
    isCleared: boolean;
    investigationStatus: string;
    controllerId: string;
    siteId: string;
    buildingId: string;
    floorId: string;
    floorplanId: string;
    areaId: string;
    controllerName: string;
    controllerMac: string;
    buildingName: string;
    floorName: string;
    siteRegion: string;
    posPxX: number;
    posPxY: number;
}

export interface AlarmCaseTimelineType {
    incidentInfo: {
        alarmCaseId: string;
        caseNumber: string;
        triggerTime: string;
        alarmStatus: string;
        actionStatus: string;
        location: {
            floorplanId: string;
            floorplanName: string;
            areaName: string;
            position: {
                x: number;
                y: number;
            };
        };
        dispatchedSecurities: any[];
        attachments: any[];
    };
    timeline: {
        stage: string;
        timestamp: string;
        actor: string | null;
        actorId: string | null;
        durationInSeconds: number | null;
        durationFormatted: string | null;
        description: string;
    }[];
    duration: {
        responseTimeInSeconds: number | null;
        responseTimeFormatted: string | null;
        dispatchTimeInSeconds: number | null;
        dispatchTimeFormatted: string | null;
        resolutionTimeInSeconds: number | null;
        resolutionTimeFormatted: string | null;
    };
    investigation: {
        result: string | null;
        dispatchedPerson: string | null;
        dispatchedPersonId: string | null;
        investigatedAt: string | null;
        doneAt: string | null;
        investigationNotes: string | null;
        wasInvestigated: boolean;
    };
}


export type GetFilter = {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
};

interface StateType {
    alarmCaseList: AlarmCaseType[];
    alarmCaseFilter: GetFilter;
    alarmCaseMeta: metaData;
}

const initialState: StateType = {
    alarmCaseList: [],
    alarmCaseFilter: {
        page: 1,
        limit: 10,
        sortBy: 'triggeredAt',
        sortOrder: 'desc',
    },
    alarmCaseMeta: {
        page: 1,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false,
        totalItems: 0,
        totalPages: 0,
    }
}

const alarmCaseSlice = createSlice({
    name: 'alarmCase',
    initialState,
    reducers: {
        SetAlarmCases: (state, action: PayloadAction<AlarmCaseType[]>) => {
            state.alarmCaseList = action.payload;
        },
        SetAlarmCaseFilter: (state, action: PayloadAction<Partial<GetFilter>>) => {
            state.alarmCaseFilter = {...state.alarmCaseFilter, ...action.payload};
        },
        UpdateAlarmCaseMeta: (state, action: PayloadAction<Partial<metaData>>) => {
            state.alarmCaseMeta = {...state.alarmCaseMeta, ...action.payload};
        }
    }
})

export const { SetAlarmCases, SetAlarmCaseFilter, UpdateAlarmCaseMeta } = alarmCaseSlice.actions;
export default alarmCaseSlice.reducer;
