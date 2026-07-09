import { Box, Typography, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from 'src/components/shared/BlankCard';
import { RootState, useSelector } from 'src/store/Store';
import { FloorplanType } from 'src/store/apps/crud/floorplan';
import FloorplanDeviceMapView from 'src/components/master/site/Floorplan/DeviceMapping2/FloorplanDeviceMapView';
import { IconArrowLeft } from '@tabler/icons-react';

const DeviceMappingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Try reading floorplan from Redux selectedFloorplan first, then from location state
  const selectedFloorplan = useSelector(
    (state: RootState) => state.floorplanReducer.selectedFloorplan,
  );
  const floorplan: FloorplanType | null | undefined =
    selectedFloorplan || (location.state?.floorplan as FloorplanType | undefined);

  if (!floorplan) {
    return (
      <PageContainer title="Device Mapping" description="Device Mapping">
        <BlankCard>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              gap: 2,
            }}
          >
            <Typography variant="h5" color="text.secondary">
              No floorplan selected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please select a floorplan from the list first.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<IconArrowLeft size={18} />}
              onClick={() => navigate('/master/site/floorplan')}
            >
              Back to Floorplans
            </Button>
          </Box>
        </BlankCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Device Mapping — ${floorplan.name}`}
      description="Map devices onto a floorplan"
    >
      <BlankCard sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <FloorplanDeviceMapView floorplan={floorplan} />
        </Box>
      </BlankCard>
    </PageContainer>
  );
};

export default DeviceMappingPage;
