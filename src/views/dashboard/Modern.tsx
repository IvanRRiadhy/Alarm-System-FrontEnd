import React, { useState, useEffect, useMemo } from 'react';
import { Box, Grid2 as Grid, Card, Typography, Chip, CircularProgress, Button } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import AlarmTopCards from 'src/components/dashboards/alarm/AlarmTopCards';
import ActiveAlarms from 'src/components/dashboards/alarm/ActiveAlarms';
import SiteMap from 'src/components/dashboards/alarm/SiteMap';
import DeviceStatus from 'src/components/dashboards/alarm/DeviceStatus';
import AlarmTrend from 'src/components/dashboards/alarm/AlarmTrend';
import ActiveAlarmSites from 'src/components/dashboards/alarm/ActiveAlarmSites';
import FloorPlan from 'src/components/dashboards/alarm/FloorPlan';
import RecentEvents from 'src/components/dashboards/alarm/RecentEvents';
import QuickActions from 'src/components/dashboards/alarm/QuickActions';
import { useDashboardSummary } from 'src/hooks/useDashboard';
import { useSiteById, useSiteList } from 'src/hooks/useSite';
import { useBuildingList } from 'src/hooks/useBuilding';
import { useFloorList } from 'src/hooks/useFloor';
import { useFloorplanList } from 'src/hooks/useFloorplan';
import { useSelector, RootState } from 'src/store/Store';
import EventSidebar, { dummyEvents, EventItem } from 'src/components/dashboards/monitoring/monitoringcomponents/sidebar/EventSidebar';
import { IconMapPin } from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router';

const getCdnUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://ble-cdn.tunnel.piranticerdasindonesia.com/${url}`;
};

const Modern = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [siteId, setSiteId] = useState<string | null>(() => {
    const urlId = new URLSearchParams(window.location.search).get('siteId');
    if (urlId) return urlId;
    return localStorage.getItem('selectedSiteId');
  });

  useEffect(() => {
    const handleSiteChange = () => {
      const currentSiteId = localStorage.getItem('selectedSiteId');
      setSiteId(currentSiteId);
      
      if (currentSiteId) {
        setSearchParams({ siteId: currentSiteId }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    };

    const urlId = searchParams.get('siteId');
    if (urlId && urlId !== localStorage.getItem('selectedSiteId')) {
      localStorage.setItem('selectedSiteId', urlId);
      localStorage.removeItem('selectedSite');
      window.dispatchEvent(new Event('siteChanged'));
    } else if (!urlId && siteId) {
      setSearchParams({ siteId }, { replace: true });
    }

    window.addEventListener('siteChanged', handleSiteChange);
    return () => {
      window.removeEventListener('siteChanged', handleSiteChange);
    };
  }, [searchParams, setSearchParams, siteId]);

  const region = 'All';
  const filter = siteId ? { siteId } : {};
  const { data: summaryResponse } = useDashboardSummary(filter);
  const dashboardData = summaryResponse?.data;
  console.log("DATA: ", dashboardData)

  const { data: singleSiteResponse } = useSiteById(siteId || '');
  const siteObj = singleSiteResponse?.data
    ? (Array.isArray(singleSiteResponse.data) ? singleSiteResponse.data[0] : (singleSiteResponse.data as any))
    : null;
  console.log("Site", siteObj)

  // Resolve user role
  const [role, setRole] = useState('');
  useEffect(() => {
    let currentRole = '';
    try {
      const responseStr = localStorage.getItem('response');
      const loggedInUser = responseStr ? JSON.parse(responseStr) : null;
      currentRole = loggedInUser?.role || localStorage.getItem('role') || '';
    } catch (e) {
      currentRole = localStorage.getItem('role') || '';
    }
    setRole(currentRole);
  }, []);

  const isSuperAdmin = role === 'SuperAdmin' || role?.toLowerCase() === 'superadmin';

  // Fetch standard view buildings for selected site
  const { data: buildingResponse, isLoading: isLoadingBuildings } = useBuildingList(
    siteId ? { page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc', siteId } : undefined
  );
  const buildings = buildingResponse?.data || [];

  const { data: allFloorsResponse } = useFloorList();
  const { data: allFloorplansResponse } = useFloorplanList();

  const handleBuildingClick = (buildingId: string) => {
    const buildingFloors = allFloorsResponse?.data?.filter((f) => f.buildingId === buildingId) || [];
    
    // Prioritize floors that have a whole number level
    const wholeLevelFloors = buildingFloors.filter((f) => Number.isInteger(f.level));
    
    if (wholeLevelFloors.length > 0) {
      wholeLevelFloors.sort((a, b) => a.level - b.level);
      const targetFloor = wholeLevelFloors[0];
      const floorplan = allFloorplansResponse?.data?.find((fp) => fp.floorId === targetFloor.id);
      if (floorplan) {
        navigate('/dashboards/monitoring', {
          state: { floorplanId: floorplan.id },
        });
        return;
      }
    }
    
    // Fallback 1: sorted floors (any level value)
    if (buildingFloors.length > 0) {
      buildingFloors.sort((a, b) => a.level - b.level);
      const targetFloor = buildingFloors[0];
      const floorplan = allFloorplansResponse?.data?.find((fp) => fp.floorId === targetFloor.id);
      if (floorplan) {
        navigate('/dashboards/monitoring', {
          state: { floorplanId: floorplan.id },
        });
        return;
      }
    }

    // Fallback 2: direct floorplan for the building
    const buildingFloorplan = allFloorplansResponse?.data?.find((fp) => fp.buildingId === buildingId);
    if (buildingFloorplan) {
      navigate('/dashboards/monitoring', {
        state: { floorplanId: buildingFloorplan.id },
      });
      return;
    }

    // Fallback 3: redirect to main monitoring view
    navigate('/dashboards/monitoring');
  };

  // Site List for Superadmin view with Infinite Scroll
  const [page, setPage] = useState(1);
  const [allSites, setAllSites] = useState<any[]>([]);
  
  const shouldFetchSites = isSuperAdmin && !siteId;
  const { data: siteListResponse, isLoading: isLoadingSites } = useSiteList(
    shouldFetchSites ? { page, limit: 20, sortBy: 'name', sortOrder: 'asc' } : undefined
  );

  useEffect(() => {
    if (!shouldFetchSites) {
      setAllSites([]);
      setPage(1);
    }
  }, [shouldFetchSites]);

  useEffect(() => {
    if (siteListResponse?.data && shouldFetchSites) {
      setAllSites((prev) => {
        const existingIds = new Set(prev.map((s) => s.id));
        const newSites = siteListResponse.data.filter((s) => !existingIds.has(s.id));
        return [...prev, ...newSites];
      });
    }
  }, [siteListResponse, shouldFetchSites]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
      if (siteListResponse?.meta?.hasNextPage && !isLoadingSites) {
        setPage((prev) => prev + 1);
      }
    }
  };

  const handleSelectSite = (site: any) => {
    localStorage.setItem('selectedSiteId', site.id);
    localStorage.setItem('selectedSite', JSON.stringify(site));
    window.dispatchEvent(new Event('siteChanged'));
  };

  const handleSiteMonitoringClick = (site: any) => {
    localStorage.setItem('selectedSiteId', site.id);
    localStorage.setItem('selectedSite', JSON.stringify(site));
    window.dispatchEvent(new Event('siteChanged'));

    const siteFloors = allFloorsResponse?.data?.filter((f) => f.siteId === site.id) || [];
    const wholeLevelFloors = siteFloors.filter((f) => Number.isInteger(f.level));
    
    if (wholeLevelFloors.length > 0) {
      wholeLevelFloors.sort((a, b) => a.level - b.level);
      const targetFloor = wholeLevelFloors[0];
      const floorplan = allFloorplansResponse?.data?.find((fp) => fp.floorId === targetFloor.id);
      if (floorplan) {
        navigate('/dashboards/monitoring', {
          state: { floorplanId: floorplan.id },
        });
        return;
      }
    }
    
    if (siteFloors.length > 0) {
      siteFloors.sort((a, b) => a.level - b.level);
      const targetFloor = siteFloors[0];
      const floorplan = allFloorplansResponse?.data?.find((fp) => fp.floorId === targetFloor.id);
      if (floorplan) {
        navigate('/dashboards/monitoring', {
          state: { floorplanId: floorplan.id },
        });
        return;
      }
    }

    const siteFloorplan = allFloorplansResponse?.data?.find((fp) => fp.siteId === site.id);
    if (siteFloorplan) {
      navigate('/dashboards/monitoring', {
        state: { floorplanId: siteFloorplan.id },
      });
      return;
    }

    navigate('/dashboards/monitoring');
  };

  // Redux Event list for EventSidebar
  const alarmEventList = useSelector((state: RootState) => state.alarmEventReducer.alarmEventList);
  const events = useMemo(() => {
    if (alarmEventList.length === 0) {
      return dummyEvents;
    }
    return alarmEventList;
  }, [alarmEventList]);

  const buildingAlarms = useMemo(() => {
    const map: Record<string, { severity: string; status: string; id: number | string }> = {};
    for (const event of alarmEventList) {
      const status = event.statusAlarm?.toLowerCase();
      const isTriggered = status === 'triggered' || status === 'on' || status === 'active';
      if (isTriggered && event.buildingId) {
        const current = map[event.buildingId];
        const sevPriority: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        const newPriority = sevPriority[(event.severity || '').toLowerCase()] || 0;
        const oldPriority = current ? (sevPriority[current.severity.toLowerCase()] || 0) : 0;
        if (newPriority > oldPriority) {
          map[event.buildingId] = {
            severity: event.severity || 'Low',
            status: event.statusAlarm || 'active',
            id: event.id
          };
        }
      }
    }
    return map;
  }, [alarmEventList]);

  const filteredSuperAdminEvents = useMemo(() => {
    return events.filter((evt) => {
      const sev = (evt.severity || '').toLowerCase();
      return sev === 'critical' || sev === 'high';
    });
  }, [events]);

  const handleSelectEvent = (event: EventItem) => {
    if (event.siteId) {
      const matchingSite = allSites.find((s) => s.id === event.siteId);
      if (matchingSite) {
        localStorage.setItem('selectedSiteId', matchingSite.id);
        localStorage.setItem('selectedSite', JSON.stringify(matchingSite));
      } else {
        localStorage.setItem('selectedSiteId', event.siteId);
        localStorage.setItem('selectedSite', JSON.stringify({ id: event.siteId, name: event.site }));
      }
      window.dispatchEvent(new Event('siteChanged'));
    }
  };

  const getSiteStatusAndColor = (siteId: string) => {
    const siteAlarm = dashboardData?.activeAlarmsBySite?.find((s: any) => s.siteId === siteId);
    const status = siteAlarm?.status || 'Normal';
    let color = '#22C55E';
    let bg = 'rgba(34, 197, 94, 0.1)';
    let shadowGlow = 'none';
    if (status === 'Alarm') {
      color = '#EF4444';
      bg = 'rgba(239, 68, 68, 0.15)';
      shadowGlow = '0 0 12px rgba(239, 68, 68, 0.4)';
    } else if (status === 'Trouble' || status === 'Open Case') {
      color = '#F59E0B';
      bg = 'rgba(245, 158, 11, 0.15)';
      shadowGlow = '0 0 12px rgba(245, 158, 11, 0.3)';
    }
    return { status, color, bg, shadowGlow };
  };

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
            : dashboardData?.activeAlarmsByFloorplan?.some((fp: any) => fp.status?.toLowerCase() === 'trouble' || fp.status?.toLowerCase() === 'open case')
            ? 'Open Case'
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

  const activeAlarmsSitesData = useMemo(() => {
    let list = siteId 
      ? (dashboardData?.activeAlarmsByFloorplan || [])
      : (dashboardData?.activeAlarmsBySite || []);
    if (isSuperAdmin) {
      list = list.filter((item: any) => {
        const s = (item.severity || '').toLowerCase();
        return s !== 'low' && s !== 'medium';
      });
    }
    return list;
  }, [siteId, dashboardData?.activeAlarmsByFloorplan, dashboardData?.activeAlarmsBySite, isSuperAdmin]);

  const renderStandardDashboard = () => (
    <>
      {/* Top row: Side-by-side TopCards and QuickActions */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid
          size={{
            xs: 12,
            lg: 5
          }}
          sx={{ display: 'flex', flexDirection: 'column' }}
        >
          <AlarmTopCards data={dashboardData} />
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 7
          }}
          sx={{ display: 'flex', flexDirection: 'column' }}
        >
          <QuickActions />
        </Grid>
      </Grid>

      {/* Middle row: ActiveAlarms, BuildingList (instead of SiteMap), FloorPlan */}
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
        
        {/* Building List replacing SiteMap */}
        <Grid
          size={{
            xs: 12,
            md: 12,
            lg: 5
          }}>
          <Card
            sx={{
              bgcolor: '#111827',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 3,
              p: 2,
              height: 440, // Match the height of FloorPlan which is around 440px
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'none',
            }}
          >
            <Typography
              sx={{
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                mb: 2,
              }}
            >
              DAFTAR BUILDING ({buildings.length})
            </Typography>
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                pr: 1,
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: 4 },
              }}
            >
              {isLoadingBuildings ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={24} sx={{ color: '#3B82F6' }} />
                </Box>
              ) : buildings.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography sx={{ color: '#64748B', fontSize: 13 }}>Tidak ada gedung di site ini.</Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 2,
                    pb: 1,
                  }}
                >
                  {buildings.map((building) => {
                    const buildingAlarm = buildingAlarms[building.id];
                    const hasAlarm = !!buildingAlarm;
                    const isHighOrCritical = hasAlarm && (buildingAlarm.severity.toLowerCase() === 'critical' || buildingAlarm.severity.toLowerCase() === 'high');
                    const isMediumOrLow = hasAlarm && (buildingAlarm.severity.toLowerCase() === 'medium' || buildingAlarm.severity.toLowerCase() === 'low');
                    
                    return (
                      <Box
                        key={`${building.id}-${buildingAlarm?.id || 'none'}`}
                        onClick={() => handleBuildingClick(building.id)}
                        sx={{
                          position: 'relative',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          height: '110px',
                          cursor: 'pointer',
                          border: isHighOrCritical
                            ? '1px solid #EF4444'
                            : isMediumOrLow
                            ? '1px solid #F59E0B'
                            : '1px solid rgba(255,255,255,0.08)',
                          transition: 'all 0.25s ease',
                          animation: isHighOrCritical
                            ? 'breathe-red-border 2s infinite'
                            : isMediumOrLow
                            ? 'blink-once-border 1.5s ease-out 1'
                            : 'none',
                          '@keyframes breathe-red-border': {
                            '0%': {
                              boxShadow: '0 0 4px rgba(239, 68, 68, 0.2)',
                              borderColor: 'rgba(239, 68, 68, 0.4)',
                            },
                            '50%': {
                              boxShadow: '0 0 16px rgba(239, 68, 68, 0.8)',
                              borderColor: 'rgba(239, 68, 68, 1)',
                            },
                            '100%': {
                              boxShadow: '0 0 4px rgba(239, 68, 68, 0.2)',
                              borderColor: 'rgba(239, 68, 68, 0.4)',
                            },
                          },
                          '@keyframes blink-once-border': {
                            '0%': {
                              boxShadow: 'none',
                              borderColor: 'rgba(255,255,255,0.08)',
                            },
                            '25%': {
                              boxShadow: '0 0 12px rgba(245, 158, 11, 0.8)',
                              borderColor: 'rgba(245, 158, 11, 1)',
                            },
                            '100%': {
                              boxShadow: 'none',
                              borderColor: 'rgba(255,255,255,0.08)',
                            },
                          },
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            borderColor: isHighOrCritical ? '#EF4444' : isMediumOrLow ? '#F59E0B' : '#3B82F6',
                            boxShadow: isHighOrCritical 
                              ? '0 8px 24px rgba(239, 68, 68, 0.5)' 
                              : isMediumOrLow 
                              ? '0 8px 24px rgba(245, 158, 11, 0.4)' 
                              : '0 8px 16px rgba(0,0,0,0.5)',
                            '& .building-img': {
                              transform: 'scale(1.1)',
                            },
                          },
                        }}
                      >
                      <Box
                        className="building-img"
                        component="img"
                        src={getCdnUrl(building.imageUrl)}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.25s ease',
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.4) 60%, rgba(15, 23, 42, 0.2) 100%)',
                          display: 'flex',
                          alignItems: 'flex-end',
                          p: 1.5,
                        }}
                      >
                        <Typography
                          sx={{
                            color: '#F8FAFC',
                            fontSize: 12,
                            fontWeight: 700,
                            lineHeight: 1.3,
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            wordBreak: 'break-word',
                          }}
                        >
                          {building.name}
                        </Typography>
                      </Box>
                    </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Card>
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
              totalAlarmCaseOpen={dashboardData?.totalAlarmCaseOpen ?? dashboardData?.totalTrouble}
            />
            <AlarmTrend alarmTrends={dashboardData?.alarmTrends} />
          </Box>
        </Grid>

        {/* Recent Events / Open Cases */}
        <Grid
          size={{
            xs: 12,
            md: 12,
            lg: 3
          }}>
          <RecentEvents recentOpenCases={dashboardData?.recentOpenCases} recentEvents={dashboardData?.recentEvents} />
        </Grid>
      </Grid>
    </>
  );

  const renderSuperAdminOverview = () => (
    <>
      {/* Viewport-height SOC Console (Top Fold) */}
      <Grid container spacing={3} sx={{ height: 'calc(100vh - 148px)', minHeight: '580px', mb: 3 }}>
        {/* Left Column: Map and Sites */}
        <Grid size={{ xs: 12, md: 9, lg: 9.5 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Map (60% height) */}
          <Box sx={{ height: '60%' }}>
            <SiteMap region={region} activeAlarmsBySite={mapAlarmsBySite} height="100%" />
          </Box>

          {/* Sites Card (40% height) */}
          <Card
            sx={{
              height: '40%',
              bgcolor: '#111827',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 3,
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'none',
            }}
          >
            <Typography
              sx={{
                color: '#F8FAFC',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '0.5px',
                mb: 2,
              }}
            >
              DAFTAR SITE ({allSites.length})
            </Typography>
            <Box
              onScroll={handleScroll}
              sx={{
                flex: 1,
                overflowY: 'auto',
                pr: 1,
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: 4 },
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(1, minmax(0, 1fr))',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    md: 'repeat(3, minmax(0, 1fr))',
                    lg: 'repeat(5, minmax(0, 1fr))',
                  },
                  gap: 2.5,
                  pb: 2,
                }}
              >
                {allSites.map((site) => {
                  const { status, color, bg, shadowGlow } = getSiteStatusAndColor(site.id);
                  return (
                    <Card
                      key={site.id}
                      sx={{
                        position: 'relative',
                        backgroundColor: '#122033',
                        border: `1px solid ${status !== 'Normal' ? color : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '12px',
                        p: 2,
                        transition: 'all 0.25s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: shadowGlow,
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          borderColor: status === 'Normal' ? '#3B82F6' : color,
                          boxShadow: status === 'Normal' ? '0 8px 16px -4px rgba(59, 130, 246, 0.2)' : shadowGlow,
                          '& .site-overlay': {
                            opacity: 1,
                            pointerEvents: 'auto',
                          }
                        },
                      }}
                    >
                      {/* Hover Overlay */}
                      <Box
                        className="site-overlay"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          bgcolor: 'rgba(15, 23, 42, 0.95)',
                          backdropFilter: 'blur(4px)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 1,
                          opacity: 0,
                          pointerEvents: 'none',
                          transition: 'opacity 0.2s ease-in-out',
                          zIndex: 2,
                        }}
                      >
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSite(site);
                          }}
                          sx={{
                            fontSize: '11px',
                            fontWeight: 700,
                            px: 2,
                            py: 0.5,
                            textTransform: 'none',
                            borderRadius: '6px',
                            minWidth: '85px',
                          }}
                        >
                          Dashboard
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSiteMonitoringClick(site);
                          }}
                          sx={{
                            fontSize: '11px',
                            fontWeight: 700,
                            px: 2,
                            py: 0.5,
                            textTransform: 'none',
                            borderRadius: '6px',
                            minWidth: '85px',
                            borderColor: 'rgba(255,255,255,0.3)',
                            color: '#fff',
                            '&:hover': {
                              borderColor: '#3B82F6',
                              bgcolor: 'rgba(59, 130, 246, 0.1)',
                            }
                          }}
                        >
                          Monitoring
                        </Button>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: bg,
                            color: color,
                          }}
                        >
                          <IconMapPin size={18} />
                        </Box>
                        <Chip
                          label={status}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: 9,
                            fontWeight: 700,
                            bgcolor: bg,
                            color: color,
                            border: `1px solid ${color}40`,
                          }}
                        />
                      </Box>
                      <Typography
                        sx={{
                          color: '#F8FAFC',
                          fontSize: 13,
                          fontWeight: 600,
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {site.name}
                      </Typography>
                    </Card>
                  );
                })}
                {isLoadingSites && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', gridColumn: 'span 5', py: 2 }}>
                    <CircularProgress size={24} sx={{ color: '#3B82F6' }} />
                  </Box>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Right Column: EventSidebar */}
        <Grid size={{ xs: 12, md: 3, lg: 2.5 }} sx={{ height: '100%' }}>
          <Box sx={{ height: '100%' }}>
            <EventSidebar
              events={filteredSuperAdminEvents}
              onSelectEvent={handleSelectEvent}
              selectedEventId={null}
              currentFloorplanId={null}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Scroll Down Analytics Section */}
      <Box sx={{ mt: 5 }}>
        {/* Top row of analytics: Side-by-side TopCards and QuickActions */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid
            size={{
              xs: 12,
              lg: 6
            }}
            sx={{ display: 'flex', flexDirection: 'column' }}
          >
            <AlarmTopCards data={dashboardData} />
          </Grid>
          <Grid
            size={{
              xs: 12,
              lg: 6
            }}
            sx={{ display: 'flex', flexDirection: 'column' }}
          >
            <QuickActions />
          </Grid>
        </Grid>

        {/* Middle row: ActiveAlarms, FloorPlan */}
        <Grid container spacing={3} sx={{ mb: 4, minHeight: "50vh" }}>
          <Grid
            size={{
              xs: 12,
              md: 4,
              lg: 3.5
            }}>
            <ActiveAlarms region={region} recentActiveAlarms={dashboardData?.recentActiveAlarms} />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 8,
              lg: 8.5
            }}>
            <FloorPlan />
          </Grid>
        </Grid>

        {/* Bottom row: ActiveAlarmSites, DeviceStatus/AlarmTrend, RecentEvents */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid
            size={{
              xs: 12,
              md: 12,
              lg: 4
            }}>
            <ActiveAlarmSites activeAlarmsBySite={activeAlarmsSitesData} />
          </Grid>
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
                totalAlarmCaseOpen={dashboardData?.totalAlarmCaseOpen ?? dashboardData?.totalTrouble}
              />
              <AlarmTrend alarmTrends={dashboardData?.alarmTrends} />
            </Box>
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 12,
              lg: 3
            }}>
            <RecentEvents recentOpenCases={dashboardData?.recentOpenCases} recentEvents={dashboardData?.recentEvents} />
          </Grid>
        </Grid>
      </Box>
    </>
  );

  return (
    <PageContainer title="SOC Dashboard" description="Security Operations Center Dashboard">
      <Box sx={{ backgroundColor: '#0b0f19', p: 3, borderRadius: '16px', minHeight: '100%' }}>
        {isSuperAdmin && !siteId ? renderSuperAdminOverview() : renderStandardDashboard()}
      </Box>
    </PageContainer>
  );
};

export default Modern;
