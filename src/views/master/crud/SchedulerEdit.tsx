import { useNavigate } from 'react-router';
import PageContainer from 'src/components/container/PageContainer';
import ScheduleTimeTable from 'src/components/master/Schedule/ScheduleTimeTable';

const SchedulerEdit = () => {
  const navigate = useNavigate();

  return (
    <PageContainer title="Schedule Edit" description="Manage weekly schedule details">
      <ScheduleTimeTable onBack={() => navigate('/master/schedule')} />
    </PageContainer>
  );
};

export default SchedulerEdit;