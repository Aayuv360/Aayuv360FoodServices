import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Truck, 
  Clock, 
  Phone, 
  Package,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Static configuration outside component to prevent reloads
const MAP_CONFIG = {
  width: '100%',
  height: '500px',
  borderRadius: '8px'
};

const MAP_CENTER = {
  lat: 17.4065,
  lng: 78.4772
};

const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

const MAP_OPTIONS = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

interface OrderTrackingData {
  orderId: number;
  status: string;
  estimatedDeliveryTime: string;
  deliveryPerson: {
    name: string;
    phone: string;
    vehicleNumber: string;
  };
  customerLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  orderItems: Array<{
    name: string;
    quantity: number;
  }>;
  timeline: Array<{
    status: string;
    time: string;
    message: string;
  }>;
}

interface DeliveryLocation {
  lat: number;
  lng: number;
  timestamp: string;
  accuracy: number;
  speed: number;
  heading: number;
}

export function OptimizedOrderTracking() {
  const { user } = useAuth();
  const [showMap, setShowMap] = useState(true);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null);

  // Load Google Maps with stable configuration
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyBjak2fBJkYMzYBCAGM3FJOLnZGgKNmqoQ',
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  // Get user's recent orders with optimized refetch settings
  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  // Find active order using useMemo to prevent unnecessary re-renders
  const activeOrder = useMemo(() => 
    orders.find(order => 
      order.status !== 'delivered' && 
      order.status !== 'cancelled' &&
      new Date(order.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ), [orders]
  );

  // Get tracking data with conservative refetch
  const { data: trackingData } = useQuery<OrderTrackingData>({
    queryKey: [`/api/orders/${activeOrder?.id}/tracking`],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${activeOrder.id}/tracking`);
      if (!res.ok) throw new Error('Failed to fetch tracking data');
      return res.json();
    },
    enabled: !!activeOrder,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  // Get live delivery location only when needed
  const { data: liveLocation } = useQuery<DeliveryLocation>({
    queryKey: [`/api/orders/${activeOrder?.id}/delivery-location`],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${activeOrder.id}/delivery-location`);
      if (!res.ok) throw new Error('Failed to fetch delivery location');
      return res.json();
    },
    enabled: !!activeOrder && !!trackingData && showMap,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 90 * 1000, // 90 seconds - less aggressive
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  // Stable event handlers
  const toggleMap = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);

  // SSE connection with better error handling
  useEffect(() => {
    if (!activeOrder || !showMap) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;

    const connectSSE = () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.warn('Max SSE reconnection attempts reached');
        return;
      }

      try {
        eventSource = new EventSource(`/api/orders/${activeOrder.id}/tracking/live`);
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'location_update' && data.location) {
              setDeliveryLocation(data.location);
            }
          } catch (error) {
            console.warn('SSE message parsing error:', error);
          }
        };

        eventSource.onerror = () => {
          eventSource?.close();
          reconnectAttempts++;
          
          if (reconnectAttempts < maxReconnectAttempts) {
            // Exponential backoff: 10s, 30s, 60s
            const delay = Math.min(10000 * Math.pow(2, reconnectAttempts - 1), 60000);
            reconnectTimer = setTimeout(connectSSE, delay);
          }
        };

        eventSource.onopen = () => {
          reconnectAttempts = 0; // Reset on successful connection
        };

      } catch (error) {
        console.warn('Failed to create SSE connection:', error);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [activeOrder?.id, showMap]);

  // Stable directions calculation
  const calculateDirections = useCallback((from: DeliveryLocation, to: any) => {
    if (!isLoaded || !window.google) return;

    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route({
      origin: { lat: from.lat, lng: from.lng },
      destination: { lat: to.lat, lng: to.lng },
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK' && result) {
        setDirections(result);
      }
    });
  }, [isLoaded]);

  // Update directions when location changes
  useEffect(() => {
    if (liveLocation && trackingData?.customerLocation) {
      calculateDirections(liveLocation, trackingData.customerLocation);
    }
  }, [liveLocation, trackingData?.customerLocation, calculateDirections]);

  // Don't render if no user or active order
  if (!user || !activeOrder || !trackingData) {
    return null;
  }

  // Stable utility functions
  const getStatusProgress = (status: string) => {
    const statusMap: { [key: string]: number } = {
      'confirmed': 20,
      'preparing': 40,
      'ready': 60,
      'out_for_delivery': 80,
      'delivered': 100
    };
    return statusMap[status] || 0;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'confirmed': 'bg-blue-600',
      'preparing': 'bg-yellow-600',
      'ready': 'bg-orange-600',
      'out_for_delivery': 'bg-green-600',
      'delivered': 'bg-emerald-600'
    };
    return colorMap[status] || 'bg-gray-600';
  };

  const getStatusText = (status: string) => {
    const textMap: { [key: string]: string } = {
      'confirmed': 'Order Confirmed',
      'preparing': 'Being Prepared',
      'ready': 'Ready for Pickup',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered'
    };
    return textMap[status] || status;
  };

  const currentLocation = liveLocation || deliveryLocation;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Order Status Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Order #{trackingData.orderId} Tracking
            </CardTitle>
            <Badge className={cn("text-white", getStatusColor(trackingData.status))}>
              {getStatusText(trackingData.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Order Progress</span>
              <span>{getStatusProgress(trackingData.status)}% Complete</span>
            </div>
            <Progress value={getStatusProgress(trackingData.status)} className="h-2" />
          </div>

          {/* Order Details Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Delivery Person */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium">{trackingData.deliveryPerson.name}</p>
                <p className="text-sm text-gray-600">{trackingData.deliveryPerson.vehicleNumber}</p>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium">Estimated Delivery</p>
                <p className="text-sm text-gray-600">
                  {new Date(trackingData.estimatedDeliveryTime).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium">Contact Driver</p>
                <p className="text-sm text-gray-600">{trackingData.deliveryPerson.phone}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-green-600" />
              Live Delivery Tracking
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMap}
              className="flex items-center gap-2"
            >
              {showMap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showMap ? 'Hide Map' : 'Show Map'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showMap && isLoaded && (
            <div className="rounded-lg overflow-hidden border">
              <GoogleMap
                mapContainerStyle={MAP_CONFIG}
                center={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : MAP_CENTER}
                zoom={14}
                options={MAP_OPTIONS}
              >
                {/* Customer Location with Home Icon */}
                <Marker
                  position={{ lat: trackingData.customerLocation.lat, lng: trackingData.customerLocation.lng }}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="18" fill="#10B981" stroke="#ffffff" stroke-width="4"/>
                        <g transform="translate(10, 10)">
                          <path d="M10 2L2 8v12h6v-6h4v6h6V8l-8-6z" fill="#ffffff"/>
                        </g>
                      </svg>
                    `),
                    scaledSize: new google.maps.Size(40, 40),
                    anchor: new google.maps.Point(20, 20),
                  }}
                  title="Your Delivery Location"
                />

                {/* Delivery Person Location with Vehicle Icon */}
                {currentLocation && (
                  <Marker
                    position={{ lat: currentLocation.lat, lng: currentLocation.lng }}
                    icon={{
                      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                          <g transform="translate(10, 10) rotate(${currentLocation.heading}, 10, 10)">
                            <!-- Bike body -->
                            <rect x="6" y="8" width="8" height="3" fill="#F97316" rx="1"/>
                            <!-- Handle bars -->
                            <rect x="5" y="6" width="10" height="2" fill="#F97316" rx="1"/>
                            <!-- Wheels -->
                            <circle cx="4" cy="14" r="3" fill="#F97316" stroke="#ffffff" stroke-width="2"/>
                            <circle cx="16" cy="14" r="3" fill="#F97316" stroke="#ffffff" stroke-width="2"/>
                            <!-- Seat -->
                            <rect x="8" y="5" width="4" height="2" fill="#F97316" rx="1"/>
                            <!-- Rider -->
                            <circle cx="10" cy="4" r="2" fill="#F97316"/>
                            <!-- White outline for visibility -->
                            <rect x="6" y="8" width="8" height="3" fill="none" stroke="#ffffff" stroke-width="1" rx="1"/>
                            <rect x="5" y="6" width="10" height="2" fill="none" stroke="#ffffff" stroke-width="1" rx="1"/>
                            <rect x="8" y="5" width="4" height="2" fill="none" stroke="#ffffff" stroke-width="1" rx="1"/>
                            <circle cx="10" cy="4" r="2" fill="none" stroke="#ffffff" stroke-width="1"/>
                          </g>
                        </svg>
                      `),
                      scaledSize: new google.maps.Size(40, 40),
                      anchor: new google.maps.Point(20, 20),
                    }}
                    title={`${trackingData.deliveryPerson.name} - ${trackingData.deliveryPerson.vehicleNumber}`}
                  />
                )}

                {/* Directions */}
                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor: '#3B82F6',
                        strokeWeight: 4,
                        strokeOpacity: 0.8,
                      },
                    }}
                  />
                )}
              </GoogleMap>
            </div>
          )}

          {currentLocation && showMap && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Driver speed: {Math.round(currentLocation.speed)} km/h • 
                Last updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}