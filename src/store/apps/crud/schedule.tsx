import { createSlice } from "@reduxjs/toolkit";
import { AppDispatch, dispatch } from "src/store/Store";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { defaultBuildingFilter, defaultScheduleFilter, defaultScheduleForm, defaultSiteFilter } from "../defaultForm";
import { metaData } from "./site";

const API_URL = '/api/schedule-templates'

export type GetFilter = {
    page: number,
    limit: number,
    // search: string,
    sortBy: string,
    sortOrder: 'asc' | "desc",
    siteId?: string,
    isActive?:boolean
}

export type dayItemType = {
    dayOfWeek: string,
    startTime: string,
    endTime: string,
}

export type ScheduleDataType = {
    id: string;
    siteId: string;
    name: string;
    isActive: boolean;
    items: dayItemType[];
}

interface StateType {
    schedules: ScheduleDataType[];
    scheduleSearch: string;
    selectedSchedule: ScheduleDataType;
    scheduleFilter: GetFilter;
    lastFilter?: GetFilter;
    scheduleMeta: metaData
}

const initialState: StateType = {
    schedules: [],
    scheduleSearch: '',
    selectedSchedule: defaultScheduleForm,
    scheduleFilter: defaultScheduleFilter,
    lastFilter: undefined,
    scheduleMeta: {
        page: 1,
        limit: 5,
        hasNextPage: true,
        hasPreviousPage: true,
        totalItems: 0,
        totalPages: 0,
    }
}

const ScheduleSlice = createSlice({
    name: 'schedule',
    initialState,
    reducers: {
        SearchSchedule: (state, action: PayloadAction<string>) => {
            state.scheduleSearch = action.payload
        },
        GetSchedule: (state, action: PayloadAction<ScheduleDataType[]>) => {
            state.schedules = action.payload
        },
        UpdateScheduleFilter: (state, action: PayloadAction<GetFilter>) => {
            state.scheduleFilter = action.payload
        },
        SelectedSchedule: (state, action: PayloadAction<ScheduleDataType>) => {
            state.selectedSchedule = action.payload
        },
        UpdateScheduleMeta: (state, action: PayloadAction<metaData>) => {
            state.scheduleMeta = action.payload
        },
    }
})

export const { SearchSchedule, GetSchedule, UpdateScheduleFilter, SelectedSchedule, UpdateScheduleMeta } = ScheduleSlice.actions
export default ScheduleSlice.reducer