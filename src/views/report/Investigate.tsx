import { useState } from 'react';
import { Grid2 as Grid, IconButton, Tooltip } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import InvestigateFilter from 'src/components/report/Investigate/InvestigateFilter';
import InvestigateList from 'src/components/report/Investigate/InvestigateList';
import { IconChevronsLeft, IconChevronsRight } from '@tabler/icons-react';

const Investigate = () => {
  const [isFilterVisible, setIsFilterVisible] = useState(true);

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
        {isFilterVisible && (
          <Grid
            size={{ xs: 12, md: 4, lg: 3 }}
            sx={{
              height: { xs: 'auto', md: '100%' },
              p: 1
            }}
          >
            <InvestigateFilter />
          </Grid>
        )}
        {/* Right Main Content */}
        <Grid
          size={isFilterVisible ? { xs: 12, md: 8, lg: 9 } : { xs: 12, md: 12, lg: 12 }}
          sx={{
            height: { xs: 'auto', md: '100%' },
            display: 'flex',
            flexDirection: 'column',
            p: 1,
            position: 'relative',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Collapse/Expand Floating Button */}
          <Tooltip title={isFilterVisible ? "Hide Filter" : "Show Filter"}>
            <IconButton
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              sx={{
                position: 'absolute',
                left: isFilterVisible ? -15 : 10,
                top: 20,
                zIndex: 10,
                width: 30,
                height: 30,
                bgcolor: '#1E293B',
                color: '#F8FAFC',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                '&:hover': {
                  bgcolor: '#334155',
                },
                display: { xs: 'none', md: 'flex' } // Only show on desktop/md and up
              }}
            >
              {isFilterVisible ? <IconChevronsLeft size={16} /> : <IconChevronsRight size={16} />}
            </IconButton>
          </Tooltip>

          <InvestigateList />
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default Investigate;
