
import { BuildingType, GetFilter as BuildingFilter } from './crud/building';
import { floorType, GetFilter as FloorFilter } from './crud/floor';
import { FloorplanType, GetFilter as FloorplanFilter } from './crud/floorplan';
import { GeoFencingAlarmType, GetFilter as GeoFenceFilter } from './alarmsetting/geofencing';
import { GetFilter as AlarmSettingFilter } from './alarmsetting/alarmSettings';
import {
  OverPopulatingAlarmType,
  GetFilter as OverPopulatingFilter,
} from './alarmsetting/overpopulating';
import { BoundaryAlarmType, GetFilter as BoundaryFilter } from './alarmsetting/boundary';
import { StayOnAreaAlarmType, GetFilter as StayOnAreaFilter } from './alarmsetting/stayonarea';
import {GetFilter as UserFilter} from './crud/users';
import { EventFilter} from 'src/hooks/useEvents';
import { SiteType } from './crud/site';
import { GetFilter as SiteFilter } from './crud/site';
import { controllerType } from './crud/controller';
import { GetFilter as ControllerFilter} from './crud/controller';
import { deviceType } from './crud/devices';
import { GetFilter as DeviceFilter } from './crud/devices';
import { GetFilter as ChannelFilter} from './crud/channel';
import { PersonnelType } from './crud/personnels';
import { GetFilter as PersonnelFilter } from './crud/personnels';
import { GetFilter as ScheduleFilter,ScheduleDataType } from './crud/schedule';
import { AlarmRuleDataType, GetFilter as AlarmRuleFilter } from './crud/alarmRule';


//#region Building
export const defaultBuildingForm: BuildingType = {
  id: '',
  siteId: '',
  siteName: '',
  name: '',
  description: '',
  // tag: '',
  imageUrl:  '',
  // applicationId: localStorage.getItem('applicationId') || '',
  // createdBy: '',
  // createdAt: '',
  // updatedBy: '',
  // updatedAt: '',
};

export const defaultBuildingFilter: BuildingFilter = {
  page: 1,
  limit: 5,
  search: '',
  sortBy: '',
  sortOrder: 'desc',
  siteId: null,
};
//#endregion

//#region Site
export const defaultSiteForm: SiteType = {
  id: '',
  code: '',
  name: '',
  address: '',
  phone: '',
  timezone: 'Asia/Jakarta',
  region: '',
  latitude: 0,
  longitude: 0,
};
export const defaultSiteFilter: SiteFilter = {
  page: 1,
  limit: 5,
  // search: '',
  sortBy: '',
  sortOrder: 'desc',
};
//#endregion

//#region Floor
export const defaultFloorForm: floorType = {
  id: '',
  buildingId: '',
  name: '',
  buildingName: '',
  siteId: '',
  siteName: '',
  level: 0,
};
export const defaultFloorFilter: FloorFilter = {
  page: 1,
  limit: 5,
  search: '',
  sortBy: '',
  sortOrder: 'desc',
  buildingId: null,
};
//#endregion

//#region Floorplan
export const defaultFloorplanForm: FloorplanType = {
  id: '',
  name: '',
  floorId: '',
  floorName: '',
  buildingId: '',
  buildingName: '',
  siteId: '',
  siteName: '',
  imageUrl: '',
  pixelX: 0,
  pixelY: 0,
  floorX: 0,
  floorY: 0,
  meterPerPx: 0,
};

export const defaultFloorplanFilter: FloorplanFilter = {
  page: 1,
  limit: 5,
  search: '',
  sortBy: '',
  sortOrder: 'desc',
  floorId: null,
};
//#endregion

//#region Controller
export const defaultControllerForm: controllerType = {
    id: '',
    siteId: '',
    siteName: '',
    hardwareId: '',
    name: '',
    ipAddress: '',
    port: 0,
    inputCount: 0,
    outputCount: 0,
    macAddress: '',
    firmwareVersion: '',
    alarmMode: 'Disarmed',
    status: '',
    lastSeen: '',
};

export const defaultControllerFilter: ControllerFilter = {
  page: 1,
  limit: 5,
  search: '',
  sortBy: '',
  sortOrder: 'desc',
  siteId: undefined,
  status: undefined,
};
//#endregion

//#region Channel
export const defaultChannelFilter: ChannelFilter = {
  page: 1,
  limit: 100,
  search: '',
  sortBy: '',
  sortOrder: 'desc',
  controllerId: null,
}

//#endregion

//#region Device
export const defaultDeviceForm: deviceType = {
    id: '',
    siteId: '',
    siteName: '',
    name: '',
    channelId: null,
    hardwareId: '',
    serialNumber: '',
    manufacturer: '',
    model: '',
    deviceType: 'Other',
    alarmSeverity: 'low',
    alarmMode: 'Disarmed',
    isNormalyClose: false,
    is24H: false,
    isPanic: false,
    isEntry: false,
    deviceIO: 'None',
    ipAddress: null,
    port: null,
    username: null,
    password: null,
    rtspUrl: null,
};

export const defaultDeviceFilter: DeviceFilter = {
  page: 1,
  limit: 5,
  search: '',
  sortBy: '',
  sortOrder: 'desc',
  siteId: undefined,
  deviceIO: undefined,
  channelId: undefined,
  controllerId: undefined,
  deviceType: undefined,
  status: undefined,
};
//#endregion

//#region Personnel

export const defaultPersonnelForm: PersonnelType = {
    id: "",
    employeeCode: "",
    name: "",
    gender: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    email: "",
    department: "",
    position: "",
    photoUrl: "",
    isActive: true,
    siteId: "",
    siteName: "",
};

export const defaultPersonnelFilter: PersonnelFilter = {
  page: 1,
  limit: 5,
  search: '',
  sortBy: '',
  sortOrder: 'desc',
};
//#endregion

//#region Schedule
export const defaultScheduleForm: ScheduleDataType = {
  id: '',
  siteId: '',
  name: '',
  isActive: true,
  items: [],
};

export const defaultScheduleFilter: ScheduleFilter = {
  page: 1,
  limit: 5,
  search: '',
  sortBy: 'UpdatedAt',
  sortOrder: 'desc',
};
//#endregion

//#region Alarm Rule
export const defaultAlarmRuleForm: AlarmRuleDataType = {
  id: '',
  siteId: '',
  siteName: '',
  name: '',
  isActive: true,
  inputDeviceId: '',
  streamDeviceIds: [],
  outputDeviceIds: [],
  // outputs: [],
  // scheduleTemplateId: '',
  // scheduleTemplateName: '',
}

export const defaultAlarmRuleFilter: AlarmRuleFilter = {
  page : 1,
  limit : 5,
  search: '',
  sortBy : '',
  sortOrder : 'desc',
}
//#endregion

//#region User
export const defaultUserFilter: UserFilter = {
  page : 1,
  limit : 5,
  // search : '',
  sortBy : '',
  sortOrder : 'desc',
}
//#endregion


//#region Alarm Setting
export const defaultAlarmSettingFilter: AlarmSettingFilter = {
  Draw: 1,
  Start: 0,
  Length: 999,
  SortColumn: 'AlarmCategory',
  SortDir: 'asc',
  SearchValue: '',
};
//#endregion

//#region GeoFence
export const defaultGeoFencingForm: GeoFencingAlarmType = {
  id: ``,
  name: '',
  remarks: '',
  areaShape: '',
  color: '#f55549',
  isActive: true,
  floorplanId: '',
  floorId: '',
};

export const defaultGeoFencingFilter: GeoFenceFilter = {
  Draw: 1,
  Start: 0,
  Length: 5,
  SortColumn: 'UpdatedAt',
  SortDir: 'desc',
  SearchValue: '',
};

//#endregion

//#region OverPopulating
export const defaultOverPopulatingForm: OverPopulatingAlarmType = {
  id: ``,
  name: '',
  remarks: '',
  areaShape: '',
  color: '#eff549ff',
  isActive: true,
  floorplanId: '',
  floorId: '',
  maxCapacity: 0,
};

export const defaultOverPopulatingFilter: OverPopulatingFilter = {
  Draw: 1,
  Start: 0,
  Length: 5,
  SortColumn: 'UpdatedAt',
  SortDir: 'desc',
  SearchValue: '',
};

//#endregion
//#region Boundary
export const defaultBoundaryForm: BoundaryAlarmType = {
  id: ``,
  name: '',
  remarks: '',
  areaShape: '',
  boundaryType: 0,
  color: '#45fc4eff',
  isActive: true,
  floorplanId: '',
  floorId: '',
};

export const defaultBoundaryFilter: BoundaryFilter = {
  Draw: 1,
  Start: 0,
  Length: 5,
  SortColumn: 'UpdatedAt',
  SortDir: 'desc',
  SearchValue: '',
};

//#endregion

//#region StayOnArea
export const defaultStayOnAreaForm: StayOnAreaAlarmType = {
  id: ``,
  name: '',
  remarks: '',
  areaShape: '',
  color: '#70e3fdff',
  isActive: true,
  floorplanId: '',
  floorId: '',
  maxDuration: 0,
};

export const defaultStayOnAreaFilter: StayOnAreaFilter = {
  Draw: 1,
  Start: 0,
  Length: 5,
  SortColumn: 'UpdatedAt',
  SortDir: 'desc',
  SearchValue: '',
};

//#endregion

//#region Event Log
export const defaultEventFilter: EventFilter = {
  draw: 1,
  start: 0,
  length: 999,
  sortColumn: '',
  sortDir: 'desc',
  searchValue: '',
};
//#endregion