import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
    Box,
    Grid2 as Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    TablePagination,
    TableSortLabel,
    Skeleton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    Tooltip,
    IconButton,
    Button,
    Collapse,
    Paper,
    CircularProgress,
} from '@mui/material';
import BlankCard from 'src/components/shared/BlankCard';
import { IconPaperclip, IconX, IconChevronDown, IconChevronRight, IconHistory } from '@tabler/icons-react';
import { useLocation } from 'react-router';
import { RootState, AppDispatch, useSelector, useDispatch } from 'src/store/Store';
import { SetAlarmCaseFilter, AlarmCaseType } from 'src/store/apps/crud/alarmCase';
import { defaultDeviceFilter } from 'src/store/apps/defaultForm';
import { useAlarmCaseList, useAlarmCaseTimeline } from 'src/hooks/useAlarmCase';
import { useAlarmInvestigationList } from 'src/hooks/useAlarmInvestigation';
import { AlarmInvestigationType, AttachmentsType } from 'src/store/apps/crud/alarmInvestigation';
import InvestigationUpdate from './InvestigationUpdate';
import AlarmTimelineProgress from './AlarmTimeline';

const columns = [
    { label: 'Case Number', field: 'caseNumber', sortAble: true },
    { label: 'Triggered At', field: 'triggeredAt', sortAble: true },
    { label: 'Cleared At', field: 'clearedAt', sortAble: true },
    { label: 'Device Name', field: 'deviceName', sortAble: true },
    { label: 'Severity', field: 'severity', sortAble: true },
    { label: 'Investigation Status', field: 'investigationStatus', sortAble: true },
    // { label: 'Timeline', field: 'timeline', sortAble: false },
];

const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'postponed':
            return 'warning';
        case 'done':
        case 'resolved':
            return 'success';
        case 'in progress':
        case 'acknowledged':
            return 'info';
        case 'cancelled':
            return 'error';
        default:
            return 'error';
    }
};

const InvestigationTable = ({
    investigations,
    onOpenAttachments,
}: {
    investigations: AlarmInvestigationType[];
    onOpenAttachments: (attachments: AttachmentsType[]) => void;
}) => {
    return (
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 80 }}>No</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Personnel Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Operator Note</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Result</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, width: 120 }}>Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {investigations.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7}>
                            <Typography variant="body2" color="text.secondary">
                                No investigations registered for this case.
                            </Typography>
                        </TableCell>
                    </TableRow>
                ) : (
                    investigations.map((inv, i) => (
                        <TableRow key={inv.id}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell>{inv.createdAt ? dayjs(inv.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</TableCell>
                            <TableCell>{inv.personnelName || '-'}</TableCell>
                            <TableCell>{inv.note || '-'}</TableCell>
                            <TableCell>{inv.result || '-'}</TableCell>
                            <TableCell>
                                <Chip
                                    label={inv.status || '-'}
                                    color={getStatusColor(inv.status)}
                                    size="small"
                                />
                            </TableCell>
                            <TableCell align="right">
                                <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1}>
                                    <Tooltip title="See Attachments">
                                        <span>
                                            <IconButton
                                                color="primary"
                                                size="small"
                                                onClick={() => onOpenAttachments(inv.attachments || [])}
                                                disabled={!inv.attachments || inv.attachments.length === 0}
                                            >
                                                <IconPaperclip size={18} />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <InvestigationUpdate device={inv} />
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
};

const SKELETON_ROWS = 5;

const AlarmInvestigationList = () => {
    const dispatch: AppDispatch = useDispatch();
    const location = useLocation();
    const alarmCaseFilter = useSelector((state: RootState) => state.alarmCaseReducer.alarmCaseFilter);

    const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
    const [selectedAttachments, setSelectedAttachments] = useState<AttachmentsType[]>([]);
    const [activeAttachmentIndex, setActiveAttachmentIndex] = useState(0);
    const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

    const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
    const [selectedCaseForTimeline, setSelectedCaseForTimeline] = useState<AlarmCaseType | null>(null);

    const handleOpenTimeline = (caseItem: AlarmCaseType) => {
        setSelectedCaseForTimeline(caseItem);
        setTimelineDialogOpen(true);
    };

    const handleCloseTimeline = () => {
        setTimelineDialogOpen(false);
        setSelectedCaseForTimeline(null);
    };

    const toggleExpand = (caseId: string) => {
        setExpandedCaseId((prev) => (prev === caseId ? null : caseId));
    };

    const handleOpenAttachments = (attachments: AttachmentsType[]) => {
        setSelectedAttachments(attachments);
        setActiveAttachmentIndex(0);
        setAttachmentsDialogOpen(true);
    };

    const handleCloseAttachments = () => {
        setAttachmentsDialogOpen(false);
        setSelectedAttachments([]);
        setActiveAttachmentIndex(0);
    };

    useEffect(() => {
        const initialFilter = location.state?.deviceName
            ? { ...defaultDeviceFilter, SearchValue: location.state.deviceName }
            : defaultDeviceFilter;

        dispatch(SetAlarmCaseFilter(initialFilter));
    }, [dispatch, location.state?.deviceName]);

    const { data, isLoading } = useAlarmCaseList(alarmCaseFilter);
    const caseData = data?.data || [];
    const caseFilteredCount = data?.meta?.totalItems || 0;

    const { data: investigationResponse } = useAlarmInvestigationList({ page: 1, limit: 1000 });
    const investigationData = investigationResponse?.data || [];

    // Pagination State
    const { alarmCaseMeta } = useSelector((state: RootState) => state.alarmCaseReducer);
    const page = alarmCaseMeta.page;
    const rowsPerPage = alarmCaseMeta.limit;
    const orderBy = alarmCaseFilter.sortBy;
    const order = alarmCaseFilter.sortOrder;

    const handleChangePage = (_: unknown, newPage: number) => {
        dispatch(SetAlarmCaseFilter({ page: newPage + 1 }));
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newLength = parseInt(event.target.value, 10);
        dispatch(SetAlarmCaseFilter({ limit: newLength, page: 1 }));
    };

    const handleSort = (column: string) => {
        const isAsc = alarmCaseFilter.sortBy === column && alarmCaseFilter.sortOrder === 'asc';
        const isDesc = alarmCaseFilter.sortBy === column && alarmCaseFilter.sortOrder === 'desc';

        if (isDesc) {
            dispatch(
                SetAlarmCaseFilter({
                    sortBy: 'triggeredAt',
                    sortOrder: 'desc',
                    page: 1,
                }),
            );
        } else {
            dispatch(
                SetAlarmCaseFilter({
                    sortBy: column,
                    sortOrder: isAsc ? 'desc' : 'asc',
                    page: 1,
                }),
            );
        }
    };

    const renderSkeletonRows = (rows: number) => (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                    <TableCell
                        sx={{
                            position: 'sticky',
                            left: 0,
                            backgroundColor: 'background.paper',
                            zIndex: 1,
                            width: 35,
                            minWidth: 35,
                            maxWidth: 35,
                        }}
                    >
                        <Skeleton variant="text" width={18} />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="text" width={120} height={22} />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="text" width={150} height={22} />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="text" width={150} height={22} />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="text" width={120} height={22} />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="text" width={80} height={22} />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="text" width={100} height={22} />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="text" width={50} height={22} />
                    </TableCell>
                    <TableCell
                        sx={{
                            position: 'sticky',
                            right: 0,
                            backgroundColor: 'background.paper',
                            zIndex: 2,
                            width: 150,
                            minWidth: 150,
                            maxWidth: 150,
                        }}
                    >
                        <Box display="flex" gap={1}>
                            <Skeleton variant="rounded" width={90} height={32} />
                        </Box>
                    </TableCell>
                </TableRow>
            ))}
        </>
    );

    return (
        <Grid container spacing={3}>
            <Grid size={12}>
                <Box sx={{ overflow: 'auto', maxWidth: '100%' }}>
                    <BlankCard>
                        <TableContainer
                            sx={{
                                maxHeight: '58vh',
                            }}
                        >
                            <Table stickyHeader aria-label="simple-table" sx={{ whiteSpace: 'nowrap' }}>
                                <TableHead>
                                    <TableRow>
                                        {/* Left Sticky Empty Column */}
                                        <TableCell
                                            sx={{
                                                position: 'sticky',
                                                left: 0,
                                                backgroundColor: 'background.paper',
                                                zIndex: 2,
                                                width: 35, // Fixed width
                                                minWidth: 35,
                                                maxWidth: 35,
                                            }}
                                        >
                                            <Typography variant="h6"></Typography>
                                        </TableCell>
                                        {columns.map((col) => (
                                            <TableCell key={col.label}>
                                                {col.sortAble && col.field ? (
                                                    <TableSortLabel
                                                        active={orderBy === col.field}
                                                        direction={orderBy === col.field ? order : 'asc'}
                                                        onClick={() => handleSort(col.field)}
                                                    >
                                                        <Typography variant="h6">{col.label}</Typography>
                                                    </TableSortLabel>
                                                ) : (
                                                    <Typography variant="h6">{col.label}</Typography>
                                                )}
                                            </TableCell>
                                        ))}
                                        {/* Right Sticky Empty Column */}
                                        <TableCell
                                            sx={{
                                                position: 'sticky',
                                                right: 0,
                                                backgroundColor: 'background.paper',
                                                zIndex: 2,
                                                width: 180, // Fixed width
                                                minWidth: 180,
                                                maxWidth: 180,
                                            }}
                                        >
                                            <Typography variant="h6"> Actions </Typography>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isLoading
                                        ? renderSkeletonRows(rowsPerPage || SKELETON_ROWS)
                                        : caseData.map((caseItem, index) => {
                                            const isOpen = expandedCaseId === caseItem.id;
                                            const caseInvestigations = (investigationData || []).filter(
                                                (inv) => inv.alarmCaseId === caseItem.id
                                            );

                                            const latestInvestigation = caseInvestigations.length > 0
                                                ? caseInvestigations[caseInvestigations.length - 1]
                                                : null;

                                            const mappedForUpdate: AlarmInvestigationType = latestInvestigation || {
                                                id: caseItem.id,
                                                alarmCaseId: caseItem.id, 
                                                personnelId: '',
                                                personnelName: '',
                                                status: caseItem.investigationStatus,
                                                note: '',
                                                result: '',
                                                postponedUntil: null,
                                                acknowledgedAt: null,
                                                dispatchedAt: null,
                                                waitingAt: null,
                                                acceptedAt: null,
                                                arrivedAt: null,
                                                doneInvestigatedAt: null,
                                                doneAt: null,
                                                noActionAt: null,
                                                postponedAt: null,
                                                createdAt: caseItem.triggeredAt,
                                                createdBy: '',
                                                updatedAt: '',
                                                attachments: (caseItem as any).attachments || [],
                                            };

                                            return (
                                                <React.Fragment key={caseItem.id || index}>
                                                    <TableRow hover>
                                                        <TableCell
                                                            sx={{
                                                                position: 'sticky',
                                                                left: 0,
                                                                backgroundColor: 'background.paper',
                                                                zIndex: 1,
                                                                width: 35, // Fixed width
                                                                minWidth: 35,
                                                                maxWidth: 35,
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            {index + 1 + (page - 1) * rowsPerPage}
                                                        </TableCell>
                                                        <TableCell>{caseItem.caseNumber || '-'}</TableCell>
                                                        <TableCell>{caseItem.triggeredAt ? dayjs(caseItem.triggeredAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</TableCell>
                                                        <TableCell>{caseItem.clearedAt ? dayjs(caseItem.clearedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</TableCell>
                                                        <TableCell>{caseItem.deviceName || '-'}</TableCell>
                                                        <TableCell>{caseItem.severity || '-'}</TableCell>
                                                        <TableCell>
                                                            <Box display="flex" flexDirection="column" alignItems="flex-start" gap={0.5}>
                                                                 <Chip
                                                                     label={caseItem.investigationStatus || 'TRIGGERED'}
                                                                     color={getStatusColor(caseItem.investigationStatus)}
                                                                     size="small"
                                                                 />
                                                            </Box>
                                                        </TableCell>
                                                         {/* <TableCell>
                                                             
                                                         </TableCell> */}
                                                        <TableCell
                                                            sx={{
                                                                position: 'sticky',
                                                                right: 0,
                                                                backgroundColor: 'background.paper',
                                                                zIndex: 1,
                                                                width: 180, // Fixed width
                                                                minWidth: 180,
                                                                maxWidth: 180,
                                                              }}
                                                        >
                                                             <Box display="flex" alignItems="center" gap={1}>
                                                                <Tooltip title="See Timeline">
                                                                 <IconButton
                                                                     color="primary"
                                                                     size="small"
                                                                     onClick={() => handleOpenTimeline(caseItem)}
                                                                 >
                                                                     <IconHistory size={20} />
                                                                 </IconButton>
                                                             </Tooltip>
                                                                <InvestigationUpdate device={mappedForUpdate} />
                                                                <Tooltip title={isOpen ? 'Hide Investigations' : 'Show Investigations'} arrow>
                                                                    <IconButton size="small" onClick={() => toggleExpand(caseItem.id)}>
                                                                        {isOpen ? <IconChevronDown size={20} /> : <IconChevronRight size={20} />}
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                    {/* ACCORDION ROW */}
                                                    <TableRow>
                                                        <TableCell colSpan={9} sx={{ p: 0, borderBottom: 0 }}>
                                                            <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                                                <Box pl={6} pr={2} pb={2}>
                                                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', my: 1 }}>
                                                                        <Typography variant="subtitle1" fontWeight={700} mb={2}>
                                                                            Investigations
                                                                        </Typography>
                                                                        <InvestigationTable 
                                                                            investigations={caseInvestigations} 
                                                                            onOpenAttachments={handleOpenAttachments} 
                                                                        />
                                                                    </Paper>
                                                                </Box>
                                                            </Collapse>
                                                        </TableCell>
                                                    </TableRow>
                                                </React.Fragment>
                                            );
                                        })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {/* Pagination */}
                        <TablePagination
                            component="div"
                            count={caseFilteredCount}
                            page={page - 1}
                            rowsPerPage={rowsPerPage}
                            onPageChange={handleChangePage}
                            rowsPerPageOptions={[5, 10, 25]}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </BlankCard>
                </Box>
            </Grid>

            {/* Attachment Dialog */}
            <Dialog
                open={attachmentsDialogOpen}
                onClose={handleCloseAttachments}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        p: 2,
                    },
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Investigation Attachment
                    </Typography>
                    <IconButton onClick={handleCloseAttachments} size="small" sx={{ color: 'text.secondary' }}>
                        <IconX size={20} />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {/* Attachment Display Area */}
                    <Box
                        sx={{
                            width: '100%',
                            height: '400px',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'action.hover',
                            position: 'relative',
                        }}
                    >
                        {selectedAttachments.length > 0 ? (
                            (() => {
                                const current = selectedAttachments[activeAttachmentIndex];
                                const isImage = current.fileType?.toLowerCase().startsWith('image/') ||
                                    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(current.fileUrl);
                                const isVideo = current.fileType?.toLowerCase().startsWith('video/') ||
                                    /\.(mp4|webm|ogg)$/i.test(current.fileUrl);

                                if (isImage) {
                                    return (
                                        <Box
                                            component="img"
                                            src={current.fileUrl}
                                            alt={`Attachment ${activeAttachmentIndex + 1}`}
                                            sx={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                objectFit: 'contain',
                                            }}
                                        />
                                    );
                                } else if (isVideo) {
                                    return (
                                        <Box
                                            component="video"
                                            src={current.fileUrl}
                                            controls
                                            sx={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                outline: 'none',
                                            }}
                                        />
                                    );
                                } else {
                                    return (
                                        <Box sx={{ textAlign: 'center', p: 3 }}>
                                            <Typography variant="h6" gutterBottom>
                                                Unsupported file preview
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                href={current.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Download File ({current.fileType || 'Unknown'})
                                            </Button>
                                        </Box>
                                    );
                                }
                            })()
                        ) : (
                            <Typography variant="body1" color="textSecondary">
                                No attachments available
                            </Typography>
                        )}
                    </Box>

                    {/* Pagination Circle Buttons */}
                    {selectedAttachments.length > 1 && (
                        <Box display="flex" justifyContent="center" gap={1.5} mt={3} mb={1}>
                            {selectedAttachments.map((_, idx) => {
                                const isActive = idx === activeAttachmentIndex;
                                return (
                                    <IconButton
                                        key={idx}
                                        onClick={() => setActiveAttachmentIndex(idx)}
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            backgroundColor: isActive ? 'primary.main' : 'background.paper',
                                            color: isActive ? 'primary.contrastText' : 'text.primary',
                                            border: '1px solid',
                                            borderColor: isActive ? 'primary.main' : 'divider',
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                                                borderColor: isActive ? 'primary.dark' : 'primary.main',
                                            },
                                        }}
                                    >
                                        {idx + 1}
                                    </IconButton>
                                );
                            })}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Timeline Dialog */}
            <Dialog
                open={timelineDialogOpen}
                onClose={handleCloseTimeline}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        p: 2,
                    },
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h5" fontWeight="bold">
                            Alarm Incident Timeline
                        </Typography>
                        {selectedCaseForTimeline && (
                            <Chip
                                label={selectedCaseForTimeline.investigationStatus}
                                size="small"
                                color={selectedCaseForTimeline.isCleared ? 'success' : 'error'}
                            />
                        )}
                    </Box>
                    <IconButton onClick={handleCloseTimeline} size="small" sx={{ color: 'text.secondary' }}>
                        <IconX size={20} />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <AlarmTimelineContainer id={selectedCaseForTimeline?.id || null} caseItem={selectedCaseForTimeline} />
                </DialogContent>
            </Dialog>
        </Grid>
    );
}

const AlarmTimelineContainer = ({ id, caseItem }: { id: string | null; caseItem: AlarmCaseType | null }) => {
    const { data: timelineData, isLoading, isError } = useAlarmCaseTimeline(id || '');
    const [activeAttachmentIndex, setActiveAttachmentIndex] = useState(0);

    if (!id) return null;
    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" py={5}>
                <CircularProgress />
            </Box>
        );
    }
    if (isError || !timelineData) {
        return (
            <Box py={3} textAlign="center">
                <Typography color="error">Failed to load timeline data.</Typography>
            </Box>
        );
    }

    const attachments = timelineData.incidentInfo?.attachments || [];

    return (
        <Box display="flex" flexDirection="column" gap={3}>
            <AlarmTimelineProgress timelineData={timelineData as any} caseData={caseItem} />
            
            {attachments.length > 0 && (
                <Box sx={{ mt: 2, borderTop: '1px solid', borderColor: 'divider', pt: 3 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Incident Attachments ({attachments.length})
                    </Typography>
                    
                    <Box
                        sx={{
                            width: '100%',
                            height: '350px',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'action.hover',
                            position: 'relative',
                        }}
                    >
                        {(() => {
                            const current = attachments[activeAttachmentIndex];
                            const fileUrl = typeof current === 'string' ? current : current.fileUrl || current.url || '';
                            const fileType = typeof current === 'string' ? '' : current.fileType || '';
                            
                            const isImage = fileType.toLowerCase().startsWith('image/') ||
                                /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileUrl);
                            const isVideo = fileType.toLowerCase().startsWith('video/') ||
                                /\.(mp4|webm|ogg)$/i.test(fileUrl);

                            if (isImage) {
                                return (
                                    <Box
                                        component="img"
                                        src={fileUrl}
                                        alt={`Attachment ${activeAttachmentIndex + 1}`}
                                        sx={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain',
                                        }}
                                    />
                                );
                            } else if (isVideo) {
                                return (
                                    <Box
                                        component="video"
                                        src={fileUrl}
                                        controls
                                        sx={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            outline: 'none',
                                        }}
                                    />
                                );
                            } else {
                                return (
                                    <Box sx={{ textAlign: 'center', p: 3 }}>
                                        <Typography variant="body1" gutterBottom>
                                            Preview not available for this file type.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            href={fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Download/Open File
                                        </Button>
                                    </Box>
                                );
                            }
                        })()}
                    </Box>

                    {attachments.length > 1 && (
                        <Box display="flex" justifyContent="center" gap={1.5} mt={2}>
                            {attachments.map((_, idx) => {
                                const isActive = idx === activeAttachmentIndex;
                                return (
                                    <IconButton
                                        key={idx}
                                        onClick={() => setActiveAttachmentIndex(idx)}
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            backgroundColor: isActive ? 'primary.main' : 'background.paper',
                                            color: isActive ? 'primary.contrastText' : 'text.primary',
                                            border: '1px solid',
                                            borderColor: isActive ? 'primary.main' : 'divider',
                                            fontWeight: 'bold',
                                            fontSize: '12px',
                                            '&:hover': {
                                                backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                                            },
                                        }}
                                    >
                                        {idx + 1}
                                    </IconButton>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default AlarmInvestigationList;
