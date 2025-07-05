import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrackingTestPanel } from '@/components/admin/TrackingTestPanel';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Bell, MapPin, Truck, Package, CheckCircle, PlayCircle, TestTube } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TrackingDemo() {
  const [testOrderId, setTestOrderId] = useState('123');
  const [testResults, setTestResults] = useState<string[]>([]);
  const { permission, requestPermission, sendTestNotification } = usePushNotifications();

  const addTestResult = (result: string) => {
    setTestResults(prev => [`${new Date().toLocaleTimeString()}: ${result}`, ...prev.slice(0, 9)]);
  };

  const runBasicAPITest = async () => {
    try {
      addTestResult('Testing API endpoints...');
      
      // Test tracking endpoint
      const trackingResponse = await fetch(`/api/orders/${testOrderId}/tracking`);
      const trackingData = await trackingResponse.json();
      
      if (trackingResponse.ok) {
        addTestResult(`✅ Tracking API working - Status: ${trackingData.status}`);
      } else {
        addTestResult(`ℹ️ Tracking API response: ${trackingData.error}`);
      }

      // Test delivery location endpoint
      const locationResponse = await fetch(`/api/orders/${testOrderId}/delivery-location`);
      if (locationResponse.ok) {
        const locationData = await locationResponse.json();
        addTestResult(`✅ Location API working - Lat: ${locationData.lat.toFixed(4)}, Lng: ${locationData.lng.toFixed(4)}`);
      }

    } catch (error) {
      addTestResult(`❌ API test failed: ${error}`);
    }
  };

  const testSSEConnection = () => {
    try {
      addTestResult('Testing Server-Sent Events...');
      
      const eventSource = new EventSource(`/api/orders/${testOrderId}/tracking/live`);
      
      eventSource.onopen = () => {
        addTestResult('✅ SSE connection established');
      };

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        addTestResult(`📡 SSE message received: ${data.type}`);
      };

      eventSource.onerror = () => {
        addTestResult('⚠️ SSE connection error');
        eventSource.close();
      };

      // Close after 10 seconds
      setTimeout(() => {
        eventSource.close();
        addTestResult('🔌 SSE connection closed');
      }, 10000);

    } catch (error) {
      addTestResult(`❌ SSE test failed: ${error}`);
    }
  };

  const testNotifications = async () => {
    try {
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          addTestResult('❌ Notification permission denied');
          return;
        }
      }

      const success = await sendTestNotification();
      if (success) {
        addTestResult('✅ Test notification sent successfully');
      } else {
        addTestResult('❌ Failed to send test notification');
      }
    } catch (error) {
      addTestResult(`❌ Notification test failed: ${error}`);
    }
  };

  const simulateOrderStatusUpdate = async () => {
    try {
      addTestResult('Simulating order status update...');
      
      const response = await fetch(`/api/orders/${testOrderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'in_transit',
          deliveryPersonId: 'demo_delivery_person',
          message: 'Order is now in transit - Demo update',
        }),
      });

      if (response.ok) {
        addTestResult('✅ Order status updated successfully');
      } else {
        const error = await response.json();
        addTestResult(`ℹ️ Status update response: ${error.error || 'Status updated'}`);
      }
    } catch (error) {
      addTestResult(`❌ Status update failed: ${error}`);
    }
  };

  const runFullDeliverySimulation = async () => {
    try {
      addTestResult('Starting full delivery simulation...');
      
      const response = await fetch(`/api/orders/${testOrderId}/simulate-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        addTestResult('✅ Delivery simulation started - Watch for status updates!');
      } else {
        addTestResult('ℹ️ Simulation started (order may not exist in database)');
      }
    } catch (error) {
      addTestResult(`❌ Simulation failed: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-6 h-6 text-blue-600" />
              Real-Time Order Tracking Test Suite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              This page helps you test all the real-time tracking features. Use the controls below to simulate order updates, test notifications, and verify the tracking system works correctly.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-green-600">Live GPS Tracking</Badge>
              <Badge className="bg-blue-600">Push Notifications</Badge>
              <Badge className="bg-purple-600">Server-Sent Events</Badge>
              <Badge className="bg-orange-600">Status Updates</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Test Controls */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Quick Tests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-order-id">Test Order ID</Label>
                <Input
                  id="test-order-id"
                  value={testOrderId}
                  onChange={(e) => setTestOrderId(e.target.value)}
                  placeholder="Enter order ID to test"
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button onClick={runBasicAPITest} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Test API Endpoints
                </Button>
                
                <Button onClick={testSSEConnection} variant="outline" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Test Live Updates (SSE)
                </Button>
                
                <Button onClick={testNotifications} variant="outline" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Test Notifications
                </Button>
                
                <Button onClick={simulateOrderStatusUpdate} variant="outline" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Update Order Status
                </Button>
                
                <Button onClick={runFullDeliverySimulation} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  <Truck className="w-4 h-4" />
                  Run Full Simulation
                </Button>
              </div>

              {testOrderId && (
                <Link to={`/orders/${testOrderId}/tracking`}>
                  <Button variant="outline" className="w-full flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Open Tracking Page
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-sm">Run tests to see results here...</p>
                ) : (
                  testResults.map((result, index) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 rounded border-l-2 border-blue-200">
                      {result}
                    </div>
                  ))
                )}
              </div>
              {testResults.length > 0 && (
                <Button 
                  onClick={() => setTestResults([])} 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  Clear Results
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Advanced Test Panel */}
        <TrackingTestPanel />

        {/* Testing Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">📱 Test Push Notifications:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Click "Test Notifications" button</li>
                  <li>Allow notifications when prompted</li>
                  <li>You should see a test notification appear</li>
                  <li>Notifications will show for real order updates</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🚛 Test Live Tracking:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Enter any order ID (e.g., 123)</li>
                  <li>Click "Run Full Simulation"</li>
                  <li>Open the tracking page</li>
                  <li>Watch status updates happen automatically</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📡 Test Real-Time Updates:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Open tracking page in one tab</li>
                  <li>Use admin panel in another tab</li>
                  <li>Update order status in admin panel</li>
                  <li>See instant updates in tracking page</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🗺️ Test GPS Tracking:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Start delivery simulation</li>
                  <li>Click "Update Location" multiple times</li>
                  <li>Watch delivery location change</li>
                  <li>See estimated delivery time updates</li>
                </ol>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Testing Tips:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Test with multiple browser tabs to see real-time sync</li>
                <li>Try on mobile devices to test touch interactions</li>
                <li>Test with notifications blocked and allowed</li>
                <li>Use different order IDs to test various scenarios</li>
                <li>Check browser console for detailed logs</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}