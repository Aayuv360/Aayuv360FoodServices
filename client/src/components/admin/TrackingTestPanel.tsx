import React, { useState } from 'react';
import { Play, Bell, MapPin, Truck, Package, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface TrackingTestPanelProps {
  className?: string;
}

export function TrackingTestPanel({ className = '' }: TrackingTestPanelProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const orderStatuses = [
    { value: 'confirmed', label: 'Confirmed', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'preparing', label: 'Preparing', icon: <Package className="w-4 h-4" /> },
    { value: 'in_transit', label: 'In Transit', icon: <Truck className="w-4 h-4" /> },
    { value: 'out_for_delivery', label: 'Out for Delivery', icon: <MapPin className="w-4 h-4" /> },
    { value: 'nearby', label: 'Nearby', icon: <MapPin className="w-4 h-4" /> },
    { value: 'delivered', label: 'Delivered', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const handleStatusUpdate = async () => {
    if (!selectedOrderId || !selectedStatus) return;

    try {
      const response = await fetch(`/api/orders/${selectedOrderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedStatus,
          deliveryPersonId: 'delivery_person_1',
          message: `Order status updated to ${selectedStatus} via admin panel`,
        }),
      });

      if (response.ok) {
        setLastUpdate(`Updated order ${selectedOrderId} to ${selectedStatus} at ${new Date().toLocaleTimeString()}`);
      } else {
        console.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleSimulateDelivery = async () => {
    if (!selectedOrderId) return;

    setIsSimulating(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrderId}/simulate-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setLastUpdate(`Started delivery simulation for order ${selectedOrderId} at ${new Date().toLocaleTimeString()}`);
      } else {
        console.error('Failed to start delivery simulation');
      }
    } catch (error) {
      console.error('Error starting delivery simulation:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleLocationUpdate = async () => {
    try {
      // Simulate delivery person location update
      const mockLocation = {
        deliveryPersonId: 'delivery_person_1',
        location: {
          lat: 17.4065 + (Math.random() - 0.5) * 0.01,
          lng: 78.4772 + (Math.random() - 0.5) * 0.01,
          timestamp: new Date(),
          accuracy: 10,
          speed: Math.random() * 40,
          heading: Math.random() * 360,
        },
        currentOrderIds: selectedOrderId ? [parseInt(selectedOrderId)] : [],
        status: 'busy' as const,
      };

      const response = await fetch('/api/delivery/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockLocation),
      });

      if (response.ok) {
        setLastUpdate(`Updated delivery location at ${new Date().toLocaleTimeString()}`);
      } else {
        console.error('Failed to update delivery location');
      }
    } catch (error) {
      console.error('Error updating delivery location:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      // Test browser notification
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Test Notification', {
            body: 'Real-time tracking system is working!',
            icon: '/favicon.png',
            badge: '/favicon.png',
          });
          setLastUpdate(`Test notification sent at ${new Date().toLocaleTimeString()}`);
        } else if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            new Notification('Test Notification', {
              body: 'Notifications are now enabled!',
              icon: '/favicon.png',
            });
            setLastUpdate(`Notifications enabled and test sent at ${new Date().toLocaleTimeString()}`);
          }
        } else {
          setLastUpdate('Notifications are blocked by the user');
        }
      } else {
        setLastUpdate('Notifications not supported in this browser');
      }
    } catch (error) {
      console.error('Error testing notification:', error);
      setLastUpdate('Error testing notification');
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          Real-Time Tracking Test Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Selection */}
        <div className="space-y-2">
          <Label htmlFor="order-id">Order ID</Label>
          <Input
            id="order-id"
            placeholder="Enter order ID (e.g., 123)"
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
          />
        </div>

        {/* Status Selection */}
        <div className="space-y-2">
          <Label htmlFor="status-select">Order Status</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger id="status-select">
              <SelectValue placeholder="Select order status" />
            </SelectTrigger>
            <SelectContent>
              {orderStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    {status.icon}
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={handleStatusUpdate}
            disabled={!selectedOrderId || !selectedStatus}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Update Status
          </Button>

          <Button
            onClick={handleSimulateDelivery}
            disabled={!selectedOrderId || isSimulating}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            {isSimulating ? 'Simulating...' : 'Simulate Delivery'}
          </Button>

          <Button
            onClick={handleLocationUpdate}
            disabled={!selectedOrderId}
            variant="outline"
            className="flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Update Location
          </Button>

          <Button
            onClick={handleTestNotification}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Test Notification
          </Button>
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <Badge className="bg-green-600 text-white mb-2">
              Latest Update
            </Badge>
            <p className="text-sm text-green-800">{lastUpdate}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How to Test:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Enter an order ID and select a status</li>
            <li>Click "Update Status" to trigger real-time notifications</li>
            <li>Use "Simulate Delivery" to run full delivery progression</li>
            <li>Click "Update Location" to simulate GPS tracking</li>
            <li>Test notifications with "Test Notification"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}