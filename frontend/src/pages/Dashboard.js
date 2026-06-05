import React from 'react';
import { useAuth } from '../context/AuthContext';
import VolunteerDashboard from './VolunteerDashboard';
import OrganizationDashboard from './OrganizationDashboard';
import MentorDashboard from './MentorDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (user?.role === 'organization') return <OrganizationDashboard />;
  if (user?.role === 'mentor') return <MentorDashboard />;
  return <VolunteerDashboard />;
};

export default Dashboard;
