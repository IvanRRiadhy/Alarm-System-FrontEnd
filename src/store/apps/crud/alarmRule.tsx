import { createSlice } from "@reduxjs/toolkit";
import { AppDispatch, dispatch } from "src/store/Store";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { defaultAlarmRuleFilter} from "../defaultForm";
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

export type ioItems = {
 deviceId: string;
 deviceName: string;
}

export type AlarmRuleDataType = {
    id: string;
    siteId: string;
    siteName: string;
    name: string;
    isActive: boolean;
    inputDeviceName?: string;
    inputDeviceId: string;
    streamDeviceIds: string[];
    streams?: ioItems[];
    outputDeviceIds: string[];
    outputs?: ioItems[];
    scheduleTemplateId?: string;
    scheduleTemplateName?: string;
}

interface StateType {
    AlarmRule: AlarmRuleDataType[];
    alarmRuleSearch: string;
    selectedAlarmRule: AlarmRuleDataType | null;
    alarmRuleFilter: GetFilter;
    lastAlarmRuleFilter?: GetFilter;
    alarmRuleMeta: metaData
}

const initialState: StateType = {
    AlarmRule: [],
    alarmRuleSearch: '',
    selectedAlarmRule: null,
    alarmRuleFilter: defaultAlarmRuleFilter,
    lastAlarmRuleFilter: undefined,
    alarmRuleMeta: {
        page: 1,
        limit: 5,
        hasNextPage: true,
        hasPreviousPage: true,
        totalItems: 0,
        totalPages: 0,
    }
}

const AlarmRuleSlice = createSlice({
    name: 'alarmRule',
    initialState,
    reducers: {
        SearchAlarmRule: (state, action: PayloadAction<string>) => {
            state.alarmRuleSearch = action.payload
        },
        GetAlarmRule: (state, action: PayloadAction<AlarmRuleDataType[]>) => {
            state.AlarmRule = action.payload
        },
        UpdateAlarmRuleFilter: (state, action: PayloadAction<GetFilter>) => {
            state.alarmRuleFilter = action.payload
        },
        SelectedAlarmRule: (state, action: PayloadAction<AlarmRuleDataType>) => {
            state.selectedAlarmRule = action.payload
        },
        UpdateAlarmRuleMeta: (state, action: PayloadAction<metaData>) => {
            state.alarmRuleMeta = action.payload
        },
    }
})

export const { SearchAlarmRule, GetAlarmRule, UpdateAlarmRuleFilter, SelectedAlarmRule, UpdateAlarmRuleMeta } = AlarmRuleSlice.actions
export default AlarmRuleSlice.reducer