import { useState } from 'react';
import {
  Drawer,
  useMediaQuery,
  Theme,
  Grid2 as Grid,
  Box,
  CardContent,
  Typography,
  CircularProgress,
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import AppCard from 'src/components/shared/AppCard';
import { RootState, useSelector } from 'src/store/Store';
import ParentCard from 'src/components/shared/ParentCard';
import { useTranslation } from 'react-i18next';
import BuildingList from 'src/components/master/site/Building/BuildingList';
import AddEditBuilding from 'src/components/master/site/Building/AddEditBuilding';
import BuildingSearch from 'src/components/master/site/Building/BuildingSearch';
import BuildingFilter from 'src/components/master/site/Building/BuildingFilter';

interface cardType {
  icon?: string;
  title: string;
  subtitle: string;
  bgcolor: string;
}

const drawerWidth = 320;

const Building = () => {
  const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
  const mdUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
  const { t } = useTranslation();
  const { buildingMeta } = useSelector((state: RootState) => state.buildingReducer);
  const topCards: cardType[] = [
    {
      title: 'Total Buildings',
      subtitle: buildingMeta.totalItems.toString(),
      bgcolor: 'success',
    },
  ];

  return (
    <PageContainer title="People Tracking System" description="People Tracking System">
      <Grid container spacing={3} my={3}>
        {topCards.map((topcard, i) => (
          <Grid key={i} size={{ xs: 12, sm: 4, lg: 2 }}>
            <Box bgcolor={topcard.bgcolor + '.light'} textAlign="center">
              <CardContent>
                <Typography
                  color={topcard.bgcolor + '.dark'}
                  mt={1}
                  variant="subtitle1"
                  fontWeight={600}
                  fontSize={13}
                >
                  {t(`${topcard.title}`)}
                </Typography>
                {!buildingMeta ? (
                  <CircularProgress
                    size={24}
                    style={{ marginTop: 10, color: topcard.bgcolor + '.main' }}
                  />
                ) : (
                  <Typography
                    color={topcard.bgcolor + '.main'}
                    variant="h4"
                    fontWeight={600}
                    fontSize={25}
                  >
                    {topcard.subtitle}
                  </Typography>
                )}
              </CardContent>
            </Box>
          </Grid>
        ))}
      </Grid>
      <AppCard>
        <Drawer
          anchor="right"
          open={isRightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
          variant={mdUp ? 'permanent' : 'temporary'}
          sx={{
            width: mdUp ? drawerWidth : '100%',
            zIndex: lgUp ? 0 : 1,
            flex: mdUp ? 'auto' : '',
            [`& .MuiDrawer-paper`]: { width: '100%', position: 'relative' },
          }}
        >
          <ParentCard title="Building List" codeModel={[
            <BuildingSearch key={"search"} />,
            <BuildingFilter key="filter" />,
            // <BuildingImport key={"import"} />,
            // <BuildingExport key={"export"} />,
            <AddEditBuilding key={"add"} type="add" />
            ]}>
            <BuildingList />
          </ParentCard>
        </Drawer>
      </AppCard>
    </PageContainer>
  );
};

export default Building;
