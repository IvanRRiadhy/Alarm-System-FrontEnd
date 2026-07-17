import { Grid2 as Grid } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import InvestigateFilter from 'src/components/report/Investigate/InvestigateFilter';
import InvestigateList from 'src/components/report/Investigate/InvestigateList';

const Investigate = () => {
  return (
    <PageContainer title="Investigate Alarm" description="Investigate Alarm Report">
      <Grid
        container
        spacing={3}
        sx={{
          height: { xs: 'auto', md: 'calc(100vh - 80px)' },
          overflow: 'hidden',
          m: 0,
          width: '100%'
        }}
      >
        {/* Left Sidebar Filter */}
        <Grid
          size={{ xs: 12, md: 4, lg: 3 }}
          sx={{
            height: { xs: 'auto', md: '100%' },
            p: 1
          }}
        >
          <InvestigateFilter />
        </Grid>
        {/* Right Main Content */}
        <Grid
          size={{ xs: 12, md: 8, lg: 9 }}
          sx={{
            height: { xs: 'auto', md: '100%' },
            display: 'flex',
            flexDirection: 'column',
            p: 1
          }}
        >
          <InvestigateList />
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default Investigate;
