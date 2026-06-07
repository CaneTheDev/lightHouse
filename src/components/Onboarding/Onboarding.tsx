import React, { useState, useEffect } from 'react';
import { OnboardingDesktop } from './Onboarding.desktop';
import { OnboardingMobile } from './Onboarding.mobile';

export const Onboarding: React.FC = () => {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? <OnboardingMobile /> : <OnboardingDesktop />;
};

export default Onboarding;
