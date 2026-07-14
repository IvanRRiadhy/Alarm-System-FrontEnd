import { useState } from 'react';
import PageContainer from 'src/components/container/PageContainer';
import ScheduleList from 'src/components/master/Schedule/ScheduleList';
import AppCard from 'src/components/shared/AppCard';
import { Drawer, Theme, useMediaQuery, Button, Grid2 as Grid, Box, CardContent, Typography, CircularProgress } from '@mui/material';
import ParentCard from 'src/components/shared/ParentCard';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { RootState, useDispatch, useSelector } from 'src/store/Store';
import { SelectedSchedule } from 'src/store/apps/crud/schedule';
import { defaultScheduleForm } from 'src/store/apps/defaultForm';
import { useTranslation } from 'react-i18next';

interface cardType {
  icon?: string;
  title: string;
  subtitle: string;
  bgcolor: string;
}

const drawerWidth = 320;

const Scheduler = () => {
  const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
  const mdUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const dispatch = useDispatch();
    const { scheduleMeta } = useSelector((state: RootState) => state.scheduleReducer);
    const { t } = useTranslation();
      const topCards: cardType[] = [
        {
          title: 'Total Schedule',
          subtitle: scheduleMeta.totalItems.toString(),
          bgcolor: 'success',
        },
      ];

  const handleAddClick = () => {
    dispatch(SelectedSchedule(defaultScheduleForm));
    navigate('/master/schedule/edit');
  };

  return (
    <PageContainer title="Schedule" description="Manage weekly schedules">
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
                        {!scheduleMeta ? (
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
          <ParentCard
            title="Time Table List"
            codeModel={[
              <Button
                key="add-btn"
                variant="contained"
                color="primary"
                startIcon={<IconPlus size={20} />}
                onClick={handleAddClick}
              >
                Add Schedule
              </Button>
            ]}
          >
            <ScheduleList />
          </ParentCard>
        </Drawer>
      </AppCard>
    </PageContainer>
  );
};

export default Scheduler;