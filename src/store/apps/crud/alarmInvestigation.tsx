    import { createSlice } from "@reduxjs/toolkit";
    import type { PayloadAction } from "@reduxjs/toolkit";
    import { metaData } from "./site";

    export type GetFilter = {
        page: number;
        limit: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        // severity?: string;
        // siteId?: string;
    };

    export interface AttachmentsType {
        fileType: string;
        fileUrl: string;
    }

    export interface AlarmInvestigationType {
        id: string;
        alarmEventId: string;
        personnelId: string;
        personnelName: string;
        status: string;
        note: string;
        result: string;
        postponedUntil: string;
        createdAt: string;
        createdBy: string;
        updatedAt: string;
        attachments?: AttachmentsType[];
    }

    interface StateType {
        alarmInvestigationList: AlarmInvestigationType[];
        alarmInvestigationFilter: GetFilter;
        alarmInvestigationMeta: metaData;
    }

    const initialState: StateType = {
        alarmInvestigationList: [],
        alarmInvestigationFilter: {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            // severity: '',
            // siteId: '',
        },
        alarmInvestigationMeta: {
            page: 1,
            limit: 10,
            hasNextPage: false,
            hasPreviousPage: false,
            totalItems: 0,
            totalPages: 0,
        }
    }

    const alarmInvestigationSlice = createSlice({
        name: 'alarmInvestigation',
        initialState,
        reducers: {
            SetAlarmInvestigations: (state, action: PayloadAction<AlarmInvestigationType[]>) => {
                state.alarmInvestigationList = action.payload;
            },
            SetAlarmInvestigationFilter: (state, action: PayloadAction<Partial<GetFilter>>) => {
                state.alarmInvestigationFilter = {...state.alarmInvestigationFilter, ...action.payload};
            },
            UpdateAlarmInvestigationMeta: (state, action: PayloadAction<Partial<metaData>>) => {
                state.alarmInvestigationMeta = {...state.alarmInvestigationMeta, ...action.payload};
            }
        }
    })

    export const { SetAlarmInvestigations, SetAlarmInvestigationFilter, UpdateAlarmInvestigationMeta } = alarmInvestigationSlice.actions;
    export default alarmInvestigationSlice.reducer;    