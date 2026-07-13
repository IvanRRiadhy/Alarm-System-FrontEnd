import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { metaData } from "./site";


export interface AlarmEvent {
  id: string;
  deviceId: string;
  controllerId: string;
  siteId: string;
  buildingId: string | null;
  floorId: string | null;
  floorplanId: string | null;
  statusDevice: string;
  statusAlarm: string;
  posPxX: number | null;
  posPxY: number | null;
  createdAt: string;
  severity: string;
  message: string;
  siteRegion: string | null;
  deviceName: string;
  deviceType: string;
  controllerName: string;
  controllerMac: string;
  siteName: string;
  buildingName: string | null;
  floorName: string | null;
  statusEvents?: any;
}

export type GetFilter = {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  severity?: string;
  siteId?: string;
};


export interface DeviceGrouped {
  [deviceId: string]: {
    deviceName: string;
    events: AlarmEvent[];
  };
}

export interface ControllerGrouped {
  [controllerId: string]: {
    controllerName: string;
    devices: DeviceGrouped[];
  };
}

export type AlarmEventsListStructured = ControllerGrouped[];

interface StateType {
    alarmEventList: AlarmEvent[];
    AlarmEventsList: AlarmEventsListStructured;
    status: string;
    metadata: metaData;
}

const initialState: StateType = {
    alarmEventList: [],
    AlarmEventsList: [],
    status: 'idle',
    metadata: {
        page: 1,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false,
        totalItems: 0,
        totalPages: 0,
    }
}

const AlarmEventSlice = createSlice({
    name: 'alarmEvent',
    initialState,
    reducers: {
        SetAlarmEvents: (state, action: PayloadAction<AlarmEvent[]>) => {
            state.alarmEventList = action.payload;

            const controllerMap: { 
              [controllerId: string]: { 
                controllerName: string;
                deviceMap: { 
                  [deviceId: string]: { 
                    deviceName: string; 
                    events: AlarmEvent[] 
                  } 
                } 
              } 
            } = {};

            for (const event of action.payload) {
                const cId = event.controllerId || 'unknown_controller';
                const cName = event.controllerName || 'Unknown Controller';
                const dId = event.deviceId || 'unknown_device';
                const dName = event.deviceName || 'Unknown Device';

                if (!controllerMap[cId]) {
                    controllerMap[cId] = {
                        controllerName: cName,
                        deviceMap: {}
                    };
                }
                if (!controllerMap[cId].deviceMap[dId]) {
                    controllerMap[cId].deviceMap[dId] = {
                        deviceName: dName,
                        events: []
                    };
                }
                controllerMap[cId].deviceMap[dId].events.push(event);
            }

            const result: AlarmEventsListStructured = [];

            for (const cId of Object.keys(controllerMap)) {
                const { controllerName, deviceMap } = controllerMap[cId];
                const deviceArray: DeviceGrouped[] = [];

                for (const dId of Object.keys(deviceMap)) {
                    deviceArray.push({
                        [dId]: {
                            deviceName: deviceMap[dId].deviceName,
                            events: deviceMap[dId].events
                        }
                    });
                }

                result.push({
                    [cId]: {
                        controllerName,
                        devices: deviceArray
                    }
                });
            }
            console.log("Events", result)
            state.AlarmEventsList = result;
        },
        UpdateAlarmEventMeta: (state, action: PayloadAction<metaData>) => {
            state.metadata = action.payload;
        }
    }
});

export const { SetAlarmEvents, UpdateAlarmEventMeta } = AlarmEventSlice.actions;
export default AlarmEventSlice.reducer;
