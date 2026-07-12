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
} from '@mui/material';
import BlankCard from 'src/components/shared/BlankCard';
import { IconPaperclip, IconX } from '@tabler/icons-react';
import { useLocation } from 'react-router';
import { RootState, AppDispatch, useSelector, useDispatch } from 'src/store/Store';
import { SetAlarmInvestigationFilter, AttachmentsType } from 'src/store/apps/crud/alarmInvestigation';
import { defaultDeviceFilter } from 'src/store/apps/defaultForm';
import { useAlarmInvestigationList } from 'src/hooks/useAlarmInvestigation';
import InvestigationUpdate from './InvestigationUpdate';

const columns = [
    { label: 'Investigation Created At', field: 'createdAt', sortAble: true },
    { label: 'Personnel Name', field: 'personnelName', sortAble: true },
    { label: 'Operator Note', field: 'note', sortAble: true },
    { label: 'Result', field: 'result', sortAble: true },
    { label: 'Status', field: 'status', sortAble: true },
    { label: 'Attachment Count', field: 'attachments', sortAble: false },
];

const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'postponed':
            return 'warning';
        case 'done':
            return 'success';
        case 'in progress':
            return 'info';
        case 'cancelled':
            return 'error';
        default:
            return 'default';
    }
};

const SKELETON_ROWS = 5;

const AlarmInvestigationList = () => {
    const dispatch: AppDispatch = useDispatch();
    const location = useLocation();
    const alarmInvestigationFilter = useSelector((state: RootState) => state.alarmInvestigationReducer.alarmInvestigationFilter);

    const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
    const [selectedAttachments, setSelectedAttachments] = useState<AttachmentsType[]>([]);
    const [activeAttachmentIndex, setActiveAttachmentIndex] = useState(0);

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

        dispatch(SetAlarmInvestigationFilter(initialFilter));
    }, [dispatch, location.state?.deviceName]);

    const { data, isLoading } = useAlarmInvestigationList(alarmInvestigationFilter);
    const investigationData = data?.data || [];
    const investigationFilteredCount = data?.meta?.totalItems || 0;

    // Pagination State
    const { alarmInvestigationMeta } = useSelector((state: RootState) => state.alarmInvestigationReducer);
    const page = alarmInvestigationMeta.page;
    const rowsPerPage = alarmInvestigationMeta.limit;
    const orderBy = alarmInvestigationFilter.sortBy;
    const order = alarmInvestigationFilter.sortOrder;

    const handleChangePage = (_: unknown, newPage: number) => {
        dispatch(SetAlarmInvestigationFilter({ page: newPage + 1 }));
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newLength = parseInt(event.target.value, 10);
        dispatch(SetAlarmInvestigationFilter({ limit: newLength, page: 1 }));
    };

    const handleSort = (column: string) => {
        const isAsc = alarmInvestigationFilter.sortBy === column && alarmInvestigationFilter.sortOrder === 'asc';
        const isDesc = alarmInvestigationFilter.sortBy === column && alarmInvestigationFilter.sortOrder === 'desc';

        if (isDesc) {
            dispatch(
                SetAlarmInvestigationFilter({
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                    page: 1,
                }),
            );
        } else {
            dispatch(
                SetAlarmInvestigationFilter({
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
                        <Skeleton variant="text" width={150} height={22} />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="text" width={120} height={22} />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="text" width={150} height={22} />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="text" width={100} height={22} />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="text" width={80} height={22} />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="text" width={80} height={22} />
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
                                        : investigationData.map((device, index) => {
                                            return (
                                                <React.Fragment key={device.id || index}>
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
                                                        <TableCell>{device.createdAt ? dayjs(device.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</TableCell>
                                                        <TableCell>{device.personnelName || '-'}</TableCell>
                                                        <TableCell>{device.note || '-'}</TableCell>
                                                        <TableCell>{device.result || '-'}</TableCell>
                                                        <TableCell>
                                                            <Box display="flex" flexDirection="column" alignItems="flex-start" gap={0.5}>
                                                                <Chip
                                                                    label={device.status || '-'}
                                                                    color={getStatusColor(device.status)}
                                                                    size="small"
                                                                />
                                                                {device.status?.toLowerCase() === 'postponed' && device.postponedUntil && (
                                                                    <Typography variant="caption" color="textSecondary">
                                                                        Until: {dayjs(device.postponedUntil).format('YYYY-MM-DD HH:mm')}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>{device.attachments?.length || 0}</TableCell>
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

                                                                <Tooltip title="See Attachments">
                                                                    <span>
                                                                        <IconButton
                                                                            color="primary"
                                                                            size="small"
                                                                            onClick={() => handleOpenAttachments(device.attachments || [])}
                                                                            disabled={!device.attachments || device.attachments.length === 0}
                                                                        >
                                                                            <IconPaperclip size={20} />
                                                                        </IconButton>
                                                                    </span>
                                                                </Tooltip>
                                                                <InvestigationUpdate device={device} />
                                                            </Box>
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
                            count={investigationFilteredCount}
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
        </Grid>
    );
}

export default AlarmInvestigationList;