import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Truck, CheckCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OrderTrackingLinkProps {
  orderId: number;
  status: string;
  estimatedDelivery?: string;
  className?: string;
}

export function OrderTrackingLink({ 
  orderId, 
  status, 
  estimatedDelivery, 
  className = '' 
}: OrderTrackingLinkProps) {
  
  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    const displays: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
      confirmed: {
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'bg-blue-500',
        label: 'Confirmed'
      },
      preparing: {
        icon: <Package className="w-4 h-4" />,
        color: 'bg-yellow-500',
        label: 'Preparing'
      },
      in_transit: {
        icon: <Truck className="w-4 h-4" />,
        color: 'bg-orange-500',
        label: 'In Transit'
      },
      out_for_delivery: {
        icon: <MapPin className="w-4 h-4" />,
        color: 'bg-purple-500',
        label: 'Out for Delivery'
      },
      nearby: {
        icon: <MapPin className="w-4 h-4" />,
        color: 'bg-green-500',
        label: 'Nearby'
      },
      delivered: {
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'bg-green-600',
        label: 'Delivered'
      },
    };
    
    return displays[status] || {
      icon: <Clock className="w-4 h-4" />,
      color: 'bg-gray-500',
      label: status.replace('_', ' ').toUpperCase()
    };
  };

  const statusDisplay = getStatusDisplay(status);
  const isTrackable = ['confirmed', 'preparing', 'in_transit', 'out_for_delivery', 'nearby'].includes(status);

  if (status === 'delivered') {
    return (
      <div className={`flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          {statusDisplay.icon}
          <span className="font-medium text-green-800">Order Delivered</span>
        </div>
        <Badge className="bg-green-600 text-white">
          Completed
        </Badge>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${statusDisplay.color} text-white`}>
          {statusDisplay.icon}
        </div>
        <div>
          <p className="font-medium text-gray-900">
            Order #{orderId}
          </p>
          <p className="text-sm text-gray-600">
            Status: {statusDisplay.label}
          </p>
          {estimatedDelivery && isTrackable && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              ETA: {new Date(estimatedDelivery).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {isTrackable ? (
        <Link to={`/orders/${orderId}/tracking`}>
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700"
            aria-label={`Track order ${orderId} in real-time`}
          >
            <MapPin className="w-4 h-4 mr-1" />
            Track Live
          </Button>
        </Link>
      ) : (
        <Badge variant="outline" className="text-gray-600">
          {statusDisplay.label}
        </Badge>
      )}
    </div>
  );
}

// Quick status indicator for smaller spaces
export function OrderStatusBadge({ status }: { status: string }) {
  const statusDisplay = getStatusDisplay(status);
  
  return (
    <Badge 
      className={`${statusDisplay.color} text-white flex items-center gap-1`}
      aria-label={`Order status: ${statusDisplay.label}`}
    >
      {statusDisplay.icon}
      {statusDisplay.label}
    </Badge>
  );
}

// Helper function (same as in OrderTrackingLink)
function getStatusDisplay(status: string) {
  const displays: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    confirmed: {
      icon: <CheckCircle className="w-3 h-3" />,
      color: 'bg-blue-500',
      label: 'Confirmed'
    },
    preparing: {
      icon: <Package className="w-3 h-3" />,
      color: 'bg-yellow-500',
      label: 'Preparing'
    },
    in_transit: {
      icon: <Truck className="w-3 h-3" />,
      color: 'bg-orange-500',
      label: 'In Transit'
    },
    out_for_delivery: {
      icon: <MapPin className="w-3 h-3" />,
      color: 'bg-purple-500',
      label: 'Out for Delivery'
    },
    nearby: {
      icon: <MapPin className="w-3 h-3" />,
      color: 'bg-green-500',
      label: 'Nearby'
    },
    delivered: {
      icon: <CheckCircle className="w-3 h-3" />,
      color: 'bg-green-600',
      label: 'Delivered'
    },
  };
  
  return displays[status] || {
    icon: <Clock className="w-3 h-3" />,
    color: 'bg-gray-500',
    label: status.replace('_', ' ').toUpperCase()
  };
}