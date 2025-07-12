import { getCurrentISTDate } from "@/lib/timezone-utils";

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Clock, Phone, CheckCircle, Truck, Package, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DeliveryLocation {
  lat: number;
  lng: number;
  timestamp: Date;
  accuracy?: number;
}

interface OrderTrackingData {
  orderId: number;
  status: 'confirmed' | 'preparing' | 'in_transit' | 'out_for_delivery' | 'nearby' | 'delivered';
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  deliveryPerson: {
    name: string;
    phone: string;
    vehicleNumber?: string;
  };
  customerLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  deliveryLocation?: DeliveryLocation;
  orderItems: Array<{
    name: string;
    quantity: number;
    image?: string;
  }>;
  timeline: Array<{
    status: string;
    time: Date;
    message: string;
  }>;
}

interface LiveOrderTrackingProps {
  orderId: number;
  onStatusUpdate?: (status: string) => void;
}

export function LiveOrderTracking({ orderId, onStatusUpdate }: LiveOrderTrackingProps) {
  const [trackingData, setTrackingData] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveTrackingEnabled, setIsLiveTrackingEnabled] = useState(false);

  // Calculate delivery progress percentage
  const getProgressPercentage = (status: string): number => {
    const statusMap: Record<string, number> = {
      confirmed: 10,
      preparing: 30,
      in_transit: 50,
      out_for_delivery: 70,
      nearby: 90,
      delivered: 100,
    };
    return statusMap[status] || 0;
  };

  // Calculate estimated time remaining
  const calculateTimeRemaining = useCallback((estimatedTime: string): string => {
    const estimated = new Date(estimatedTime);
    const now = getCurrentISTDate();
    const diffMs = estimated.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Any moment now';
    
    const diffMins = Math.ceil(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins} mins`;
    
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return `${diffHours}h ${remainingMins}m`;
  }, []);

  // Fetch initial tracking data
  const fetchTrackingData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}/tracking`);
      if (!response.ok) throw new Error('Failed to fetch tracking data');
      
      const data: OrderTrackingData = await response.json();
      setTrackingData(data);
      setError(null);
      
      // Enable live tracking if order is in transit
      if (['in_transit', 'out_for_delivery', 'nearby'].includes(data.status)) {
        setIsLiveTrackingEnabled(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Setup live tracking updates
  useEffect(() => {
    fetchTrackingData();
    
    let eventSource: EventSource | null = null;
    let locationInterval: NodeJS.Timeout | null = null;

    if (isLiveTrackingEnabled) {
      // Setup Server-Sent Events for real-time updates
      eventSource = new EventSource(`/api/orders/${orderId}/tracking/live`);
      
      eventSource.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          setTrackingData(prev => prev ? { ...prev, ...update } : null);
          
          if (update.status && onStatusUpdate) {
            onStatusUpdate(update.status);
          }
        } catch (err) {
          console.error('Failed to parse tracking update:', err);
        }
      };

      eventSource.onerror = () => {
        console.warn('Live tracking connection lost, attempting to reconnect...');
        setTimeout(() => {
          eventSource?.close();
          setIsLiveTrackingEnabled(false);
          setTimeout(() => setIsLiveTrackingEnabled(true), 5000);
        }, 1000);
      };

      // Request location updates every 30 seconds
      locationInterval = setInterval(() => {
        fetch(`/api/orders/${orderId}/delivery-location`)
          .then(res => res.json())
          .then(location => {
            setTrackingData(prev => prev ? { ...prev, deliveryLocation: location } : null);
          })
          .catch(err => console.warn('Failed to update delivery location:', err));
      }, 30000);
    }

    return () => {
      eventSource?.close();
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [orderId, isLiveTrackingEnabled, onStatusUpdate, fetchTrackingData]);

  // Handle calling delivery person
  const handleCallDeliveryPerson = () => {
    if (trackingData?.deliveryPerson.phone) {
      window.open(`tel:${trackingData.deliveryPerson.phone}`);
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      confirmed: 'bg-blue-500',
      preparing: 'bg-yellow-500',
      in_transit: 'bg-orange-500',
      out_for_delivery: 'bg-purple-500',
      nearby: 'bg-green-500',
      delivered: 'bg-green-600',
    };
    return colors[status] || 'bg-gray-500';
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      confirmed: <CheckCircle className="w-4 h-4" />,
      preparing: <Package className="w-4 h-4" />,
      in_transit: <Truck className="w-4 h-4" />,
      out_for_delivery: <Navigation className="w-4 h-4" />,
      nearby: <MapPin className="w-4 h-4" />,
      delivered: <CheckCircle className="w-4 h-4" />,
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !trackingData) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Unable to load tracking information</p>
            <Button onClick={fetchTrackingData} className="mt-4" variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Order Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(trackingData.status)}
              Order #{trackingData.orderId}
            </CardTitle>
            <Badge className={`${getStatusColor(trackingData.status)} text-white`}>
              {trackingData.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Order Progress</span>
              <span>{getProgressPercentage(trackingData.status)}%</span>
            </div>
            <Progress value={getProgressPercentage(trackingData.status)} className="h-2" />
          </div>

          {/* Estimated Delivery Time */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">
                {trackingData.status === 'delivered' ? 'Delivered' : 'Estimated Delivery'}
              </p>
              <p className="text-sm text-blue-700">
                {trackingData.status === 'delivered' 
                  ? trackingData.actualDeliveryTime 
                  : `${calculateTimeRemaining(trackingData.estimatedDeliveryTime)} remaining`}
              </p>
            </div>
          </div>

          {/* Live Location Indicator */}
          {isLiveTrackingEnabled && trackingData.deliveryLocation && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium">Live tracking active</span>
              <span className="text-green-600 text-sm">
                Last updated: {new Date(trackingData.deliveryLocation.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Person Info */}
      {trackingData.deliveryPerson && ['in_transit', 'out_for_delivery', 'nearby'].includes(trackingData.status) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Delivery Partner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{trackingData.deliveryPerson.name}</p>
                {trackingData.deliveryPerson.vehicleNumber && (
                  <p className="text-sm text-gray-600">
                    Vehicle: {trackingData.deliveryPerson.vehicleNumber}
                  </p>
                )}
              </div>
              <Button onClick={handleCallDeliveryPerson} className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Call
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trackingData.orderItems.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trackingData.timeline.map((event, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full mt-1 ${
                  index === 0 ? getStatusColor(trackingData.status) : 'bg-gray-300'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium">{event.message}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(event.time).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}