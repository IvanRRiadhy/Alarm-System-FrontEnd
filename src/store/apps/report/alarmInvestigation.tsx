    import { createSlice } from "@reduxjs/toolkit";
    import type { PayloadAction } from "@reduxjs/toolkit";
    import { metaData } from "../crud/site";

    export type GetFilter = {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        // severity?: string;
        // siteId?: string;
    };

    export interface DispatchedPersonnelDataType {
        personnelId: string;
        personnelName: string;
        result: string | null;
        note: string | null;
        completedAt: string | null;
        attachments: AttachmentsType[];
    }

    export interface AttachmentsType {
        fileType: string;
        fileUrl: string;
    }

    export interface AlarmInvestigationType {
        id: string;
        alarmCaseId: string;
        // personnelId: string;
        personnelName: string;
        dispatchedPersonnelIds: string[];
        dispatchedPersonnelNames: string[];
        status: string;
        acknowledgedNote: string | null;
        dispatchedNote: string | null;
        postponedNote: string | null;
        resolvedNote: string | null;
        note: string | null;
        result: string | null;
        postponedUntil: string | null;
        acknowledgedAt: string | null;
        dispatchedAt: string | null;
        waitingAt: string | null;
        acceptedAt: string | null;
        arrivedAt: string | null;
        investigationCompletedAt: string | null;
        doneAt: string | null;
        noActionAt: string | null;
        postponedAt: string | null;
        createdAt: string;
        createdBy: string;
        updatedAt: string;
        attachments?: AttachmentsType[];
        dispatchedPersonnelDetails?: DispatchedPersonnelDataType[];
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