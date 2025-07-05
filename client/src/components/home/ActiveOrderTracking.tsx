import React, { useState, useEffect } from 'react';
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
  CheckCircle,
  Navigation,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 17.4065,
  lng: 78.4772
};

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places", "geometry"];

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

export function ActiveOrderTracking() {
  const { user } = useAuth();
  const [showMap, setShowMap] = useState(true);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyBjak2fBJkYMzYBCAGM3FJOLnZGgKNmqoQ',
    libraries: libraries
  });

  // Get user's recent orders
  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Find the most recent active order (not delivered)
  const activeOrder = orders.find(order => 
    order.status !== 'delivered' && 
    order.status !== 'cancelled' &&
    // Order placed within last 24 hours
    new Date(order.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  // Get tracking data for active order
  const { data: trackingData } = useQuery<OrderTrackingData>({
    queryKey: [`/api/orders/${activeOrder?.id}/tracking`],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${activeOrder.id}/tracking`);
      if (!res.ok) throw new Error('Failed to fetch tracking data');
      return res.json();
    },
    enabled: !!activeOrder,
    refetchInterval: 10000 // Refetch every 10 seconds
  });

  // Get live delivery location
  const { data: liveLocation } = useQuery<DeliveryLocation>({
    queryKey: [`/api/orders/${activeOrder?.id}/delivery-location`],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${activeOrder.id}/delivery-location`);
      if (!res.ok) throw new Error('Failed to fetch delivery location');
      return res.json();
    },
    enabled: !!activeOrder && (trackingData?.status === 'out_for_delivery' || trackingData?.status === 'in_transit'),
    refetchInterval: 15000 // Refetch every 15 seconds for live tracking
  });

  // Set up Server-Sent Events for real-time updates
  useEffect(() => {
    if (!activeOrder) return;

    const eventSource = new EventSource(`/api/orders/${activeOrder.id}/tracking/live`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'location_update' && data.location) {
        setDeliveryLocation(data.location);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [activeOrder?.id]);

  // Calculate directions when delivery location updates
  useEffect(() => {
    if (!isLoaded || !trackingData || !liveLocation) return;

    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route({
      origin: { lat: liveLocation.lat, lng: liveLocation.lng },
      destination: { lat: trackingData.customerLocation.lat, lng: trackingData.customerLocation.lng },
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') {
        setDirections(result);
      }
    });
  }, [isLoaded, liveLocation, trackingData]);

  // Don't show if no active order
  if (!user || !activeOrder || !trackingData) {
    return null;
  }

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
      {(trackingData.status === 'out_for_delivery' || trackingData.status === 'in_transit') && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-6 h-6 text-green-600" />
                Live Delivery Tracking
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMap(!showMap)}
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
                  mapContainerStyle={mapContainerStyle}
                  center={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : center}
                  zoom={14}
                  options={{
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                  }}
                >
                  {/* Customer Location */}
                  <Marker
                    position={{ lat: trackingData.customerLocation.lat, lng: trackingData.customerLocation.lng }}
                    icon={{
                      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="20" cy="20" r="18" fill="#10B981" stroke="#ffffff" stroke-width="4"/>
                          <circle cx="20" cy="20" r="8" fill="#ffffff"/>
                        </svg>
                      `),
                      scaledSize: new google.maps.Size(40, 40),
                      anchor: new google.maps.Point(20, 20),
                    }}
                    title="Your Location"
                  />

                  {/* Delivery Person Location */}
                  {currentLocation && (
                    <Marker
                      position={{ lat: currentLocation.lat, lng: currentLocation.lng }}
                      icon={{
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="#ffffff" stroke-width="4"/>
                            <path d="M12 20l4-4 4 4 8-8" stroke="#ffffff" stroke-width="3" fill="none"/>
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

            {/* Location Info */}
            {currentLocation && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Live Location Update</span>
                </div>
                <p className="text-sm text-blue-800">
                  Driver is moving at {Math.round(currentLocation.speed)} km/h • 
                  Last updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-blue-600" />
            Order Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trackingData.timeline.map((event, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className={cn(
                  "w-3 h-3 rounded-full mt-2",
                  index === 0 ? "bg-blue-600" : "bg-gray-300"
                )} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{event.message}</p>
                    <span className="text-sm text-gray-500">
                      {new Date(event.time).toLocaleTimeString()}
                    </span>
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {getStatusText(event.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}