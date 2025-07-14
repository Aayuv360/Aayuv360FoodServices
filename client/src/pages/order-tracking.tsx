import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveOrderTracking } from "@/components/orders/LiveOrderTracking";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useAuth } from "@/hooks/use-auth";

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    permission,
    requestPermission,
    setupOrderNotifications,
    sendTestNotification,
  } = usePushNotifications();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [orderExists, setOrderExists] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyOrder = async () => {
      if (!orderId || !user) return;

      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (response.ok) {
          const order = await response.json();
          setOrderExists(true);
        } else {
          setOrderExists(false);
        }
      } catch (error) {
        console.error("Error verifying order:", error);
        setOrderExists(false);
      }
    };

    verifyOrder();
  }, [orderId, user]);

  useEffect(() => {
    if (!orderId || !orderExists) return;

    let cleanup: (() => void) | undefined;

    if (permission === "granted") {
      cleanup = setupOrderNotifications(parseInt(orderId));
      setNotificationsEnabled(true);
    }

    return cleanup;
  }, [orderId, orderExists, permission, setupOrderNotifications]);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted && orderId) {
      const cleanup = setupOrderNotifications(parseInt(orderId));
      setNotificationsEnabled(true);
      await sendTestNotification();

      return cleanup;
    }
  };

  const handleStatusUpdate = (status: string) => {
    console.log("Order status updated:", status);
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Invalid Order
            </h2>
            <p className="text-gray-600 mb-4">No order ID provided.</p>
            <Button onClick={() => navigate("/orders")} variant="outline">
              View My Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orderExists === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Order Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              Order #{orderId} could not be found or you don't have permission
              to view it.
            </p>
            <Button onClick={() => navigate("/orders")} variant="outline">
              View My Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orderExists === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <Card className="w-full max-w-2xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
                aria-label="Go back to previous page"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Track Order #{orderId}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {permission !== "granted" && !notificationsEnabled && (
                <Button
                  onClick={handleEnableNotifications}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  aria-label="Enable push notifications for order updates"
                >
                  <Bell className="w-4 h-4" />
                  Enable Notifications
                </Button>
              )}

              {notificationsEnabled && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <Bell className="w-4 h-4" />
                  <span>Notifications Active</span>
                </div>
              )}

              {permission === "denied" && (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <BellOff className="w-4 h-4" />
                  <span>Notifications Disabled</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        id="main-content"
      >
        <LiveOrderTracking
          orderId={parseInt(orderId)}
          onStatusUpdate={handleStatusUpdate}
        />
      </main>

      {permission === "default" && (
        <div className="fixed bottom-4 right-4 max-w-sm">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">
                    Stay Updated
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Enable notifications to get real-time updates about your
                    order delivery.
                  </p>
                  <Button
                    onClick={handleEnableNotifications}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Enable Notifications
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
