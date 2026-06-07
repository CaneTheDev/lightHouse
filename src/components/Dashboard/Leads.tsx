import React, { useState, useEffect } from 'react';
import { LeadsDesktop } from './Leads.desktop';
import { LeadsMobile } from './Leads.mobile';

export const Leads: React.FC = () => {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? <LeadsMobile /> : <LeadsDesktop />;
};

export default Leads;
