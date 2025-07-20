import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useNavigationTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Store the current path as the previous path for the next navigation
    const currentPath = location.pathname;
    
    // Get the stored previous path
    const previousPath = sessionStorage.getItem('navigation_previous_path');
    
    // Store current path for next navigation
    sessionStorage.setItem('navigation_previous_path', currentPath);
    
    // If we have a previous path, store it as referrer for breadcrumbs
    if (previousPath && previousPath !== currentPath) {
      sessionStorage.setItem('breadcrumb_referrer', previousPath);
    }
    
    // Clean up old referrer if navigating from same page
    if (previousPath === currentPath) {
      sessionStorage.removeItem('breadcrumb_referrer');
    }
    
  }, [location.pathname]);
};

export default useNavigationTracking;