import React from 'react';
import { MapPin, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useLocationContext } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LocationStatusProps {
  showFullMessage?: boolean;
  compact?: boolean;
}

export const LocationStatus: React.FC<LocationStatusProps> = ({ 
  showFullMessage = false, 
  compact = false 
}) => {
  const {
    currentLocation,
    isLocationLoading,
    locationError,
    isWithinServiceArea,
    serviceMessage,
    requestLocation,
    clearLocationError,
  } = useLocationContext();

  const getLocationIcon = () => {
    if (isLocationLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (locationError) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (currentLocation && isWithinServiceArea) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (currentLocation && !isWithinServiceArea) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <MapPin className="h-4 w-4 text-gray-500" />;
  };

  const getStatusBadge = () => {
    if (isLocationLoading) return <Badge variant="secondary">Detecting...</Badge>;
    if (locationError) return <Badge variant="destructive">Location Error</Badge>;
    if (currentLocation && isWithinServiceArea) return <Badge variant="default" className="bg-green-600">Available</Badge>;
    if (currentLocation && !isWithinServiceArea) return <Badge variant="secondary">Not Available</Badge>;
    return <Badge variant="outline">No Location</Badge>;
  };

  const handleLocationRequest = () => {
    if (locationError) {
      clearLocationError();
    }
    requestLocation();
  };

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLocationRequest}
            className="flex items-center gap-2 px-2"
          >
            {getLocationIcon()}
            {!isLocationLoading && getStatusBadge()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{serviceMessage}</p>
          {locationError && (
            <p className="text-sm text-red-400 mt-1">Click to retry location detection</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm">
      {getLocationIcon()}
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">Location Status</span>
          {getStatusBadge()}
        </div>
        
        {showFullMessage && (
          <p className="text-xs text-gray-600">{serviceMessage}</p>
        )}
        
        {currentLocation && (
          <p className="text-xs text-gray-500">
            Lat: {currentLocation.lat.toFixed(4)}, Lng: {currentLocation.lng.toFixed(4)}
          </p>
        )}
      </div>

      {locationError && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleLocationRequest}
          className="text-xs"
        >
          Retry
        </Button>
      )}
    </div>
  );
};