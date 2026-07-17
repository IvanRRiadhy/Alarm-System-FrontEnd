import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import localForage from 'localforage';
import CustomizerReducer from './customizer/CustomizerSlice';
import SettingsReducer from "./customizer/SettingsSlice";
import EcommerceReducer from './apps/eCommerce/ECommerceSlice';
import ChatsReducer from './apps/chat/ChatSlice';
import NotesReducer from './apps/notes/NotesSlice';
import EmailReducer from './apps/email/EmailSlice';
import TicketReducer from './apps/tickets/TicketSlice';
import ContactsReducer from './apps/contacts/ContactSlice';
import UserProfileReducer from './apps/userProfile/UserProfileSlice';
import BlogReducer from './apps/blog/BlogSlice';
import floorReducer from './apps/crud/floor';
import personnelReducer from './apps/crud/personnels';
import buildingReducer from './apps/crud/building';
import siteReducer from './apps/crud/site';
import FloorplanReducer from './apps/crud/floorplan';
import UserReducer from './apps/crud/users';
import AlarmSettingReducer from './apps/alarmsetting/alarmSettings';
import GeoFencingReducer from './apps/alarmsetting/geofencing';
import OverPopulatingReducer from './apps/alarmsetting/overpopulating';
import StayOnAreaReducer from './apps/alarmsetting/stayonarea';
import BoundaryReducer from './apps/alarmsetting/boundary';
import InvestigateReducer from './apps/report/investigate';
import ControllerReducer from './apps/crud/controller';
import deviceReducer from './apps/crud/devices';
import deviceMappingReducer from './apps/crud/deviceMapping';
import areaReducer from './apps/crud/area';
import scheduleReducer from './apps/crud/schedule';
import alarmRuleReducer from './apps/crud/alarmRule';
import alarmEventReducer from './apps/crud/alarmEvent';
import alarmInvestigationReducer from './apps/report/alarmInvestigation'
import alarmCaseReducer from './apps/crud/alarmCase'
// import ReaderHealthReducer from './apps/tracking/ReaderHealth';
// import EventLogReducer from './apps/tracking/Event';
// import SessionReducer from './apps/session';
// import EvacuationReducer from './apps/tracking/Evacuation';
import {
  useDispatch as useAppDispatch,
  useSelector as useAppSelector,
  TypedUseSelectorHook,
} from 'react-redux';

const rootReducer = combineReducers({
  customizer: CustomizerReducer,
  settings: SettingsReducer,
  ecommerceReducer: EcommerceReducer,
  chatReducer: ChatsReducer,
  emailReducer: EmailReducer,
  notesReducer: NotesReducer,
  contactsReducer: ContactsReducer,
  ticketReducer: TicketReducer,
  userpostsReducer: UserProfileReducer,
  blogReducer: BlogReducer,
  floorReducer: floorReducer,
  personnelReducer: personnelReducer,
  buildingReducer: buildingReducer,
  siteReducer: siteReducer,
  floorplanReducer: FloorplanReducer,
  userReducer: UserReducer,
  AlarmSettingReducer: AlarmSettingReducer,
  GeoFencingReducer: GeoFencingReducer,
  OverPopulatingReducer: OverPopulatingReducer,
  StayOnAreaReducer: StayOnAreaReducer,
  BoundaryReducer: BoundaryReducer,
  ControllerReducer: ControllerReducer,
  deviceReducer: deviceReducer,
  deviceMappingReducer: deviceMappingReducer,
  areaReducer: areaReducer,
  scheduleReducer: scheduleReducer,
  alarmRuleReducer: alarmRuleReducer,
  alarmEventReducer: alarmEventReducer,
  alarmInvestigationReducer: alarmInvestigationReducer,
  alarmCaseReducer: alarmCaseReducer,
  InvestigateReducer: InvestigateReducer,
});

const storage = localForage.createInstance({
  name: "Modernize-ERP",
  storeName: "root-state"
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['layoutReducer', 'AlarmActiveReducer', 'settings'], // Persist layout, alarms, and settings
};

// Create persisted root reducer
const persistedReducer = persistReducer<ReturnType<typeof rootReducer>>(persistConfig, rootReducer);
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'alarmEvent/SetAlarmEvents',
          'alarmEvent/AddAlarmEvent'
        ],
        ignoredPaths: [
          'alarmEventReducer.alarmEventList',
          'alarmEventReducer.AlarmEventsList'
        ],
      },
    }),
});
// export const store = configureStore({
//   reducer: {
//     customizer: CustomizerReducer,
//     ecommerceReducer: EcommerceReducer,
//     chatReducer: ChatsReducer,
//     emailReducer: EmailReducer,
//     notesReducer: NotesReducer,
//     contactsReducer: ContactsReducer,
//     ticketReducer: TicketReducer,
//     userpostsReducer: UserProfileReducer,
//     blogReducer: BlogReducer,
//     gateReducer: GatesReducer,
//     floorplanReducer2: FloorplanReducer2,
//     applicationReducer: applicationReducer,
//     integrationReducer: integrationReducer,
//     CCTVReducer: CCTVReducer,
//     accessControlReducer: accessControlReducer,
//     brandReducer: brandReducer,
//     departmentReducer: DepartmentReducer,
//     districtReducer: DistrictReduce,
//     organizationReducer: organizationReducer,
//     maskedAreaReducer: maskedAreaReducer,
//     bleReaderReducer: bleReaderReducer,
//     floorReducer: floorReducer,
//     memberReducer: memberReducer,
//     trackingTransReducer: trackingTransReducer,
//     visitorReducer: visitorReducer,
//     blacklistReducer: blacklistReducer,
//     alarmReducer: alarmReducer,
//     buildingReducer: buildingReducer,
//     floorplanDeviceReducer: FloorplanDeviceReducer,
//     layoutReducer: layoutReducer,
//     floorplanReducer: FloorplanReducer,
//     bleNodeReducer: BleNodeReducer,
//     RulesNodeReducer: RulesNodeReducer,
//     RulesConnectorReducer: RulesConnectorReducer,
//     BeaconReducer: BeaconReducer,
//     sessionReducer: SessionReducer,
//   },
// });
// const appRootReducer = combineReducers({
//   customizer: CustomizerReducer,
//   ecommerceReducer: EcommerceReducer,
//   chatReducer: ChatsReducer,
//   emailReducer: EmailReducer,
//   notesReducer: NotesReducer,
//   contactsReducer: ContactsReducer,
//   ticketReducer: TicketReducer,
//   userpostsReducer: UserProfileReducer,
//   blogReducer: BlogReducer,
// });

// export type AppState = ReturnType<typeof appRootReducer>;

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useDispatch = () => useAppDispatch<AppDispatch>();
export const useSelector: TypedUseSelectorHook<RootState> = useAppSelector;
export const { dispatch } = store;

export default store;
