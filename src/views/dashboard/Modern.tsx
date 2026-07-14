import React, { useState, useEffect } from 'react';
import { Box, Grid2 as Grid } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import AlarmHeader from 'src/components/dashboards/alarm/AlarmHeader';
import AlarmTopCards from 'src/components/dashboards/alarm/AlarmTopCards';
import ActiveAlarms from 'src/components/dashboards/alarm/ActiveAlarms';
import SiteMap from 'src/components/dashboards/alarm/SiteMap';
import DeviceStatus from 'src/components/dashboards/alarm/DeviceStatus';
import AlarmTrend from 'src/components/dashboards/alarm/AlarmTrend';
import ActiveAlarmSites from 'src/components/dashboards/alarm/ActiveAlarmSites';
import FloorPlan from 'src/components/dashboards/alarm/FloorPlan';
import RecentEvents from 'src/components/dashboards/alarm/RecentEvents';
import SystemHealth from 'src/components/dashboards/alarm/SystemHealth';
import QuickActions from 'src/components/dashboards/alarm/QuickActions';
import { useDashboardSummary } from 'src/hooks/useDashboard';
import { useSiteById } from 'src/hooks/useSite';

const Modern = () => {
  const [siteId, setSiteId] = useState<string | null>(() => localStorage.getItem('selectedSiteId'));

  useEffect(() => {
    const handleSiteChange = () => {
      setSiteId(localStorage.getItem('selectedSiteId'));
    };

    window.addEventListener('siteChanged', handleSiteChange);
    return () => {
      window.removeEventListener('siteChanged', handleSiteChange);
    };
  }, []);

  const region = 'All';
  const filter = siteId ? { siteId } : {};
  const { data: summaryResponse, isLoading } = useDashboardSummary(filter);
  const dashboardData = summaryResponse?.data;
  console.log("DATA: ", dashboardData)

  const { data: singleSiteResponse } = useSiteById(siteId || '');
  const siteObj = singleSiteResponse?.data
    ? (Array.isArray(singleSiteResponse.data) ? singleSiteResponse.data[0] : (singleSiteResponse.data as any))
    : null;
  console.log("Site", siteObj)
  // Determine what to pass as activeAlarmsBySite to SiteMap
  const mapAlarmsBySite = siteId && siteObj
    ? [
        {
          siteId: siteObj.id,
          siteName: siteObj.name,
          region: siteObj.region,
          latitude: Number(siteObj.latitude),
          longitude: Number(siteObj.longitude),
          status: dashboardData?.activeAlarmsByFloorplan?.some((fp: any) => fp.status?.toLowerCase() === 'alarm')
            ? 'Alarm'
            : dashboardData?.activeAlarmsByFloorplan?.some((fp: any) => fp.status?.toLowerCase() === 'trouble')
            ? 'Trouble'
            : 'Normal',
          severity: dashboardData?.activeAlarmsByFloorplan?.reduce((maxSev: string, fp: any) => {
            if (!fp.severity) return maxSev;
            const fpSev = fp.severity;
            const sevPriority: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
            const currentPri = sevPriority[fpSev.toLowerCase()] || 0;
            const maxPri = sevPriority[maxSev.toLowerCase()] || 0;
            return currentPri > maxPri ? fpSev : maxSev;
          }, '') || null,
          totalAlarms: dashboardData?.activeAlarmsByFloorplan?.reduce((sum: number, fp: any) => sum + (fp.totalAlarms || 0), 0) || 0,
          totalDeviceOn: dashboardData?.activeAlarmsByFloorplan?.reduce((sum: number, fp: any) => sum + (fp.totalDeviceOn || 0), 0) || 0,
          totalDeviceOff: dashboardData?.activeAlarmsByFloorplan?.reduce((sum: number, fp: any) => sum + (fp.totalDeviceOff || 0), 0) || 0,
          totalAlarmOn: dashboardData?.activeAlarmsByFloorplan?.reduce((sum: number, fp: any) => sum + (fp.totalAlarmOn || 0), 0) || 0,
          totalAlarmOff: dashboardData?.activeAlarmsByFloorplan?.reduce((sum: number, fp: any) => sum + (fp.totalAlarmOff || 0), 0) || 0,
          lastAlarmAt: dashboardData?.activeAlarmsByFloorplan?.reduce((latest: string | null, fp: any) => {
            if (!fp.lastAlarmAt) return latest;
            if (!latest) return fp.lastAlarmAt;
            return new Date(fp.lastAlarmAt) > new Date(latest) ? fp.lastAlarmAt : latest;
          }, null as string | null) || null,
        }
      ]
    : dashboardData?.activeAlarmsBySite;

  const activeAlarmsSitesData = siteId 
    ? (dashboardData?.activeAlarmsByFloorplan || [])
    : (dashboardData?.activeAlarmsBySite || []);

  return (
    <PageContainer title="SOC Dashboard" description="Security Operations Center Dashboard">
      <Box sx={{ backgroundColor: '#0b0f19', p: 3, borderRadius: '16px', minHeight: '100%' }}>
        {/* Header */}
        {/* <AlarmHeader region={region} setRegion={setRegion} /> */}

        {/* Top Cards row */}
        <Box sx={{ mb: 3 }}>
          <AlarmTopCards data={dashboardData} />
        </Box>

        {/* Middle row: ActiveAlarms, SiteMap, DeviceStatus/AlarmTrend */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Active Alarms */}
          <Grid
            size={{
              xs: 12,
              md: 12,
              lg: 2.5
            }}>
            <ActiveAlarms region={region} recentActiveAlarms={dashboardData?.recentActiveAlarms} />
          </Grid>
          {/* Map */}
          <Grid
            size={{
              xs: 12,
              md: 12,
              lg: 5
            }}>
            <SiteMap region={region} activeAlarmsBySite={mapAlarmsBySite} />
          </Grid>

          {/* FloorPlan */}
          <Grid
            size={{
              xs: 12,
              md: 12,
              lg: 4.5
            }}>
            <FloorPlan />
          </Grid>
        </Grid>

        {/* Bottom row: ActiveAlarmSites, FloorPlan, RecentEvents */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Active Alarm Sites Table */}
          <Grid
            size={{
              xs: 12,
              md: 12,
              lg: 4
            }}>
            <ActiveAlarmSites activeAlarmsBySite={activeAlarmsSitesData} />
          </Grid>
          {/* Status + Trend */}
          <Grid
            size={{
              xs: 12,
              md: 12,
              lg: 5
            }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <DeviceStatus
                deviceOnline={dashboardData?.deviceOnline}
                deviceOffline={dashboardData?.deviceOffline}
                totalTrouble={dashboardData?.totalTrouble}
              />
              <AlarmTrend alarmTrends={dashboardData?.alarmTrends} />
            </Box>
          </Grid>

          {/* Recent Events */}
          <Grid
            size={{
              xs: 12,
              md: 12,
              lg: 3
            }}>
            <RecentEvents recentEvents={dashboardData?.recentEvents} />
          </Grid>
        </Grid>

        {/* Footer row: SystemHealth, QuickActions */}
        <Grid container spacing={3}>
          <Grid
            size={{
              xs: 12,
              lg: 5.5
            }}>
            <SystemHealth systemHealth={dashboardData?.systemHealth} />
          </Grid>
          <Grid
            size={{
              xs: 12,
              lg: 6.5
            }}>
            <QuickActions />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Modern;
