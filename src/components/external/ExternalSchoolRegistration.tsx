import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const ExternalSchoolRegistration = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the new auth page
    navigate('/external/auth', { replace: true });
  }, [navigate]);
  
  return null;
};
