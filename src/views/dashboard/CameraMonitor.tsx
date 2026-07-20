import { useState, useMemo, useCallback } from 'react';
import { Box } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import CameraGrid from 'src/components/dashboards/camera/View/CameraGrid';
import CameraMonitorHeader from 'src/components/dashboards/camera/View/CameraMonitorHeader';
import CameraDetailSidebar from 'src/components/dashboards/camera/Sidebar/CameraDetailSidebar';
import { useDeviceList } from 'src/hooks/useDevice';
import { useAlarmRuleList } from 'src/hooks/useAlarmRule';
import { useDeviceMappingList } from 'src/hooks/useDeviceMapping';
import { useFloorplanList } from 'src/hooks/useFloorplan';
import { useSelector } from 'src/store/Store';
import { deviceType } from 'src/store/apps/crud/devices';
import { RootState } from 'src/store/Store';

const CameraMonitor = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [gridColumns, setGridColumns] = useState(6);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<deviceType | null>(null);

  // 1. Load all CCTV cameras
  const { data: cameraResponse } = useDeviceList({
    limit: 1000,
    deviceType: 'CctvCamera',
  });
  const allCameras = useMemo(() => cameraResponse?.data || [], [cameraResponse]);

  // 2. Load alarm rules (to map inputDeviceId -> streamDeviceIds)
  const { data: alarmRuleResponse } = useAlarmRuleList({
    limit: 1000,
    isActive: true,
  });
  const alarmRules = useMemo(() => alarmRuleResponse?.data || [], [alarmRuleResponse]);

  // 3. Read active alarm events from Redux
  const alarmEventList = useSelector(
    (state: RootState) => state.alarmEventReducer.alarmEventList,
  );

  // 4. Load device mappings for location info
  const { data: deviceMappingResponse } = useDeviceMappingList({
    page: 1,
    limit: 1000,
    sortBy: 'name',
    sortOrder: 'asc',
    floorplanId: '',
  });
  const deviceMappings = useMemo(
    () => deviceMappingResponse?.data || [],
    [deviceMappingResponse],
  );

  // 5. Load floorplans for floor/building/site info
  const { data: floorplanResponse } = useFloorplanList();
  const floorplans = useMemo(() => floorplanResponse?.data || [], [floorplanResponse]);

  // Build a set of camera IDs that have active stream device mappings
  const cameraIdSet = useMemo(
    () => new Set(allCameras.map((c) => c.id)),
    [allCameras],
  );

  // Compute active camera IDs from alarm events
  const activeCameraIds = useMemo(() => {
    const activeIds = new Set<string>();

    // Get unique active device IDs from alarm events (triggered alarms)
    const activeDeviceIds = new Set<string>();
    for (const event of alarmEventList) {
      const statusAlarmLower = event.statusAlarm?.toLowerCase();
      const isTriggered =
        statusAlarmLower === 'triggered' ||
        statusAlarmLower === 'on' ||
        statusAlarmLower === 'active';

      if (isTriggered && event.deviceId) {
        activeDeviceIds.add(event.deviceId);
      }

      // Also use streamDevices directly if available on the event
      if (event.streamDevices && isTriggered) {
        for (const sd of event.streamDevices) {
          if (sd.deviceId && cameraIdSet.has(sd.deviceId)) {
            activeIds.add(sd.deviceId);
          }
        }
      }
    }

    // For each active device, find matching alarm rule and extract streamDeviceIds
    for (const deviceId of activeDeviceIds) {
      for (const rule of alarmRules) {
        if (rule.inputDeviceId === deviceId && rule.streamDeviceIds) {
          for (const streamId of rule.streamDeviceIds) {
            if (cameraIdSet.has(streamId)) {
              activeIds.add(streamId);
            }
          }
        }
      }
    }

    return activeIds;
  }, [alarmEventList, alarmRules, cameraIdSet]);

  // Location info for the selected camera
  const locationInfo = useMemo(() => {
    if (!selectedCamera) return undefined;

    // Find device mapping for this camera
    const mapping = deviceMappings.find(
      (dm) =>
        dm.deviceId === selectedCamera.id ||
        dm.deviceId?.toLowerCase() === selectedCamera.id?.toLowerCase(),
    );

    if (!mapping) {
      return { siteName: selectedCamera.siteName };
    }

    // Find floorplan to get floor/building/site
    const floorplan = floorplans.find((fp) => fp.id === mapping.floorplanId);

    return {
      areaName: mapping.areaName,
      floorplanName: mapping.floorplanName || floorplan?.name,
      floorName: floorplan?.floorName,
      buildingName: floorplan?.buildingName,
      siteName: floorplan?.siteName || selectedCamera.siteName,
    };
  }, [selectedCamera, deviceMappings, floorplans]);

  const handleSelectCamera = useCallback((camera: deviceType) => {
    setSelectedCamera(camera);
  }, []);

  return (
    <PageContainer title="Camera Monitor" description="CCTV Camera Monitoring Dashboard">
      <Box
        sx={{
          display: 'flex',
          bgcolor: '#0b0f19',
          height: 'calc(100vh - 90px)',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Left Sidebar */}
        <CameraDetailSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((prev) => !prev)}
          selectedCamera={selectedCamera}
          locationInfo={locationInfo}
        />

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {/* Header */}
          <CameraMonitorHeader
            gridColumns={gridColumns}
            onGridColumnsChange={setGridColumns}
            showActiveOnly={showActiveOnly}
            onToggleActiveOnly={() => setShowActiveOnly((prev) => !prev)}
            totalCameras={allCameras.length}
            activeCameras={activeCameraIds.size}
          />

          {/* Camera Grid */}
          <CameraGrid
            cameras={allCameras}
            activeCameraIds={activeCameraIds}
            gridColumns={gridColumns}
            selectedCameraId={selectedCamera?.id || null}
            onSelectCamera={handleSelectCamera}
            showActiveOnly={showActiveOnly}
          />
        </Box>
      </Box>
    </PageContainer>
  );
};

export default CameraMonitor;
