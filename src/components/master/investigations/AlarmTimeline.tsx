import { Box, Typography, Grid2 as Grid, Chip } from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import BlockIcon from '@mui/icons-material/Block';
import AlarmIcon from '@mui/icons-material/NotificationImportant';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { AlarmCaseTimelineType, AlarmCaseType } from 'src/store/apps/crud/alarmCase';

export interface TimelineItemType {
  stage: string;
  timestamp: string | null;
  actor?: string | null;
  actorId?: string | null;
  durationInSeconds?: number | null;
  durationFormatted?: string | null;
  description: string;
}

interface Props {
  timelineData: AlarmCaseTimelineType | null;
  caseData: AlarmCaseType | null;
}

const getActorPrefix = (stage: string) => {
  switch (stage?.toLowerCase()) {
    case 'triggered':
      return 'Triggered by';
    case 'acknowledged':
      return 'Acknowledged by';
    case 'dispatched':
      return 'Dispatched to';
    case 'accepted':
      return 'Accepted by';
    case 'arrived':
      return 'Arrived';
    case 'done_investigated':
    case 'resolved':
      return 'Resolved by';
    case 'cancelled':
    case 'no_action':
    case 'no action':
      return 'Cancelled by';
    default:
      return 'Actor';
  }
};

const getStageConfig = (stage: string) => {
  switch (stage) {
    case 'triggered':
      return {
        icon: <AlarmIcon />,
        sx: { bgcolor: '#f44336', color: '#fff' },
      };

    case 'acknowledged':
      return {
        icon: <CheckCircleIcon />,
        sx: { bgcolor: '#f44336', color: '#fff' },
      };

    case 'dispatched':
      return {
        icon: <DirectionsRunIcon />,
        sx: { bgcolor: '#ff9800', color: '#fff' },
      };

    case 'accepted':
      return {
        icon: <CheckCircleIcon />,
        sx: { bgcolor: '#ff9800', color: '#fff' },
      };

    case 'arrived':
      return {
        icon: <DirectionsRunIcon />,
        sx: { bgcolor: '#ffc107', color: '#fff' },
      };

    case 'done_investigated':
      return {
        icon: <CheckCircleIcon />,
        sx: { bgcolor: '#ffc107', color: '#fff' },
      };

    case 'resolved':
      return {
        icon: <CheckCircleIcon />,
        sx: { bgcolor: '#4caf50', color: '#fff' },
      };
    case 'investigated':
      return {
        icon: <CheckCircleIcon />,
        sx: { bgcolor: '#4caf50', color: '#fff' },
      };
    case 'waiting':
      return {
        icon: <AccessTimeIcon />,
        sx: { bgcolor: '#ffc107', color: '#000' },
      };

    case 'postpone_investigation':
      return {
        icon: <AccessTimeIcon />,
        sx: { bgcolor: '#ff9800', color: '#fff' },
      };

    case 'cancelled':
      return {
        icon: <BlockIcon />,
        sx: { bgcolor: '#9e9e9e', color: '#fff' },
      };
    case 'ongoing':
      return {
        icon: <MoreHorizIcon />,
        sx: {
          bgcolor: 'transparent',
          color: '#9e9e9e',
          border: '2px solid rgba(0,0,0,0.2)',
          opacity: 0.4,
          filter: 'grayscale(40%)',
        },
      };
    default:
      return {
        icon: <AccessTimeIcon />,
        sx: { bgcolor: '#bdbdbd', color: '#fff' },
      };
  }
};

const formatStageLabel = (stage: string) => {
  if (stage === 'cancelled' || stage === 'no_action' || stage === 'no action' || stage === 'noaction') {
    return 'NO ACTION';
  }
  return stage.replace(/_/g, ' ').toUpperCase();
};

const AlarmTimelineProgress = ({ timelineData, caseData }: Props) => {
  const [selectedStage, setSelectedStage] = useState<number>(0);
  const finalStages = ['resolved', 'cancelled', 'no_action', 'no action', 'noaction', 'cleared', 'done_investigated', 'investigated'];

  const filteredTimeline = timelineData?.timeline?.filter((item: any) => item.stage !== 'cleared') || [];

  const hasCleared = timelineData?.timeline?.some((t: any) => t.stage === 'cleared');
  const isFinal =
    hasCleared ||
    (filteredTimeline.length > 0 &&
      finalStages.includes(filteredTimeline[filteredTimeline.length - 1].stage));

  useEffect(() => {
    if (filteredTimeline.length) {
      setSelectedStage(filteredTimeline.length - 1);
    }
  }, [filteredTimeline.length]);

  if (!timelineData || !filteredTimeline.length) return null;
  const timelineWithActive = !isFinal
    ? [
        ...filteredTimeline,
        {
          stage: 'ongoing',
          timestamp: null,
          description: 'Alarm is still active',
          durationFormatted: '',
          actor: undefined,
          actorId: undefined,
          durationInSeconds: undefined,
        } as unknown as TimelineItemType,
      ]
    : filteredTimeline;

  const dispatchedStage = timelineData?.timeline?.find((t: any) => t.stage === 'dispatched');
  const investigatedStage = timelineData?.timeline?.find((t: any) => t.stage === 'accepted');
  const resolvedStage = timelineData?.timeline?.find((t: any) => t.stage === 'done_investigated');
  const confirmedResolvedStage = timelineData?.timeline?.find((t: any) => t.stage === 'resolved');
  const clearedStage = timelineData?.timeline?.find((t: any) => t.stage === 'cleared');
  return (
    <Box sx={{ mt: 1 }}>
      {/* Top Details Card */}
      {caseData && (
        <Box
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: '16px',
            bgcolor: 'action.hover',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary" display="block">Case Number</Typography>
              <Typography variant="body2" fontWeight="bold">{caseData.caseNumber}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary" display="block">Device / Type</Typography>
              <Typography variant="body2" fontWeight="bold">{caseData.deviceName} ({caseData.deviceType})</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary" display="block">Location</Typography>
              <Typography variant="body2" fontWeight="bold">
                {caseData.siteName} - {caseData.buildingName || ''} {caseData.floorName || ''} ({caseData.areaName})
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary" display="block">Severity</Typography>
              <Box display="flex" gap={1} alignItems="center" mt={0.5}>
                <Chip label={caseData.severity} size="small" color={caseData.severity === 'Critical' ? 'error' : 'warning'} />
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* LEFT SECTION — TIMELINE */}
        <Box sx={{ flex: 1 }}>
          <Timeline
            position="right"
            sx={{
              '& .MuiTimelineItem-root:before': {
                flex: 0,
                padding: 0,
              },
            }}
          >
            {timelineWithActive.map((item: any, index: any) => {
              const isOngoing = item.stage === 'ongoing';
              const isSelected = selectedStage === index && !isOngoing;
              const config = getStageConfig(item.stage);

              return (
                <TimelineItem
                  key={index}
                  onClick={!isOngoing ? () => setSelectedStage(index) : undefined}
                  sx={{
                    cursor: isOngoing ? 'default' : 'pointer',
                    opacity: isOngoing ? 0.5 : 1,
                  }}
                >
                  <TimelineOppositeContent
                    sx={{
                      flex: 0.25,
                      pt: 2,
                      fontSize: '0.75rem',
                      color: isOngoing ? 'rgba(0,0,0,0.3)' : 'text.secondary',
                    }}
                  >
                    {item.timestamp ? dayjs(item.timestamp).format('DD MMM YYYY HH:mm:ss') : 'TBA'}
                  </TimelineOppositeContent>

                  <TimelineSeparator>
                    <TimelineDot
                      sx={{
                        ...config.sx,
                        transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {config.icon}
                    </TimelineDot>

                    {index < timelineWithActive.length - 1 && (
                      <TimelineConnector
                        sx={{
                          borderLeftWidth: 3,
                          borderLeftStyle:
                            !isFinal && index === timelineWithActive.length - 2 ? 'dashed' : 'solid',
                        }}
                      />
                    )}
                  </TimelineSeparator>

                  <TimelineContent sx={{ pb: 4 }}>
                    <Typography
                      fontWeight={700}
                      sx={{
                        color: isOngoing ? 'rgba(0,0,0,0.4)' : 'inherit',
                      }}
                    >
                      {formatStageLabel(item.stage)}
                    </Typography>

                    {/* {item.actor && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        {getActorPrefix(item.stage)}: {item.actor}
                      </Typography>
                    )} */}

                    {isSelected && (
                      <>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {item.description}
                        </Typography>

                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          Duration: {item.durationFormatted}
                        </Typography>
                      </>
                    )}
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        </Box>

        {/* RIGHT SECTION — STATUS INDICATORS */}
        <Box
          sx={{
            width: 320,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {dispatchedStage && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#fff3e0',
                border: '1px solid #ffcc80',
                color: '#b26a00',
              }}
            >
              <Typography fontWeight={600} color="inherit">Dispatched to</Typography>
              <Typography variant="body2" color="inherit">{timelineData?.investigation?.dispatchedPerson}</Typography>
            </Box>
          )}

          {investigatedStage && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#fff8e1',
                border: '1px solid #ffe082',
                color: '#b78103',
              }}
            >
              <Typography fontWeight={600} color="inherit">Investigated by</Typography>
              <Typography variant="body2" color="inherit">{investigatedStage.actor}</Typography>
            </Box>
          )}

          {resolvedStage && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#e8f5e9',
                border: '1px solid #a5d6a7',
                color: '#2e7d32',
              }}
            >
              <Typography fontWeight={600} color="inherit">Resolved by</Typography>
              <Typography variant="body2" color="inherit">{resolvedStage.actor}</Typography>
            </Box>
          )}
          {confirmedResolvedStage && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#e8f5e9',
                border: '1px solid #a5d6a7',
                color: '#2e7d32',
              }}
            >
              <Typography fontWeight={600} color="inherit">Confirmed Resolved by</Typography>
              <Typography variant="body2" color="inherit">{confirmedResolvedStage.actor}</Typography>
            </Box>
          )}
          {clearedStage && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#e8f5e9',
                border: '1px solid #a5d6a7',
                color: '#2e7d32',
              }}
            >
              <Typography fontWeight={600} color="inherit">Cleared by</Typography>
              <Typography variant="body2" color="inherit">{clearedStage.actor || 'System'}</Typography>
              {clearedStage.timestamp && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {dayjs(clearedStage.timestamp).format('DD MMM YYYY HH:mm:ss')}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AlarmTimelineProgress;
