import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
// import { DashboardAreaChartFilter as DashboardFilter } from 'src/store/apps/dashboard/Dashboard';

const API_DASHBOARD = '/api/reports/dashboard-summary';

export const useDashboardSummary = (filter: any)=>{
    return useQuery({
        queryKey: ["dashboard-summary",filter],
        queryFn: async () => {
            const response = await axiosServices.get(API_DASHBOARD,{params:filter});
            console.log("Response", response);
            return response.data;
        },
                placeholderData: keepPreviousData,
                staleTime: 5  * 1000, // 5 seconds
                gcTime: 10  * 1000, // 10 seconds
    })
}



