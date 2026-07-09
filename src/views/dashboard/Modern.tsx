import React, { useState } from 'react';
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

const Modern = () => {
  const [region, setRegion] = useState<string>('Semua Region');
  const filter = region !== 'Semua Region' ? { region } : {};
  const { data: summaryResponse, isLoading } = useDashboardSummary(filter);
  const dashboardData = summaryResponse?.data;


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
            <SiteMap region={region} />
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
            <ActiveAlarmSites activeAlarmsBySite={dashboardData?.activeAlarmsBySite} />
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
