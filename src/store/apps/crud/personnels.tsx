import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { metaData } from "./site";

const API_URL = "api/personnel";

export type GetFilter = {
    page: number,
    limit: number,
    search: string,
    sortBy: string,
    sortOrder: 'asc' | "desc",
}

export type PersonnelType = {
    id: string;
    employeeCode: string;
    name: string;
    gender: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
    email: string;
    department: string;
    position: string;
    photoUrl: string;
    isActive: boolean;
    siteId: string;
    siteName: string;
}

interface StateType {
    personnels: PersonnelType[];
    personnelSearch: string;
    selectedPersonnel: PersonnelType | null;
    personnelFilter: GetFilter;
    lastFilterr?: GetFilter;
    personnelMeta: metaData;
}

const initialState: StateType = {
    personnels: [],
    personnelSearch: "",
    selectedPersonnel: null,
    personnelFilter: {
        page: 1,
        limit: 10,
        search: "",
        sortBy: "createdAt",
        sortOrder: "desc",
    },
    personnelMeta: {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    }
}

export const personnelSlice = createSlice({
    name: API_URL,
    initialState,
    reducers: {
        GetPersonnels: (state, action: PayloadAction<PersonnelType[]>) => {
            state.personnels = action.payload;
        },
        setPersonnelSearch: (state, action: PayloadAction<string>) => {
            state.personnelSearch = action.payload;
        },
        setSelectedPersonnel: (state, action: PayloadAction<PersonnelType>) => {
            state.selectedPersonnel = action.payload;
        },
        UpdateFilter: (state, action: PayloadAction<GetFilter>) => {
            state.personnelFilter = action.payload;
        },
        UpdatePersonnelMeta: (state, action: PayloadAction<metaData>) => {
            state.personnelMeta = action.payload;
        },
    },
})

export const { GetPersonnels, setPersonnelSearch, setSelectedPersonnel, UpdateFilter, UpdatePersonnelMeta } = personnelSlice.actions;
export default personnelSlice.reducer;