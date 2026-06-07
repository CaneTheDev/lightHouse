import React, { useState, useEffect } from 'react';
import { DashboardDesktop } from './Dashboard.desktop';
import { DashboardMobile } from './Dashboard.mobile';

export const Dashboard: React.FC = () => {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isMobile ? <DashboardMobile /> : <DashboardDesktop />;
};
export default Dashboard;
