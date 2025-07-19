import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Truck,
  Clock,
  Phone,
  Package,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAP_CONFIG = {
  width: "100%",
  height: "500px",
  borderRadius: "8px",
};

const MAP_CENTER = {
  lat: 17.4065,
  lng: 78.4772,
};

const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

const MAP_OPTIONS = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

const DIRECTIONS_OPTIONS = {
  suppressMarkers: true,
  polylineOptions: {
    strokeColor: "#3B82F6",
    strokeWeight: 4,
    strokeOpacity: 0.8,
  },
};

const STATUS_PROGRESS_MAP: { [key: string]: number } = {
  confirmed: 20,
  preparing: 40,
  ready: 60,
  out_for_delivery: 80,
  delivered: 100,
};

const STATUS_COLOR_MAP: { [key: string]: string } = {
  confirmed: "bg-blue-600",
  preparing: "bg-yellow-600",
  ready: "bg-orange-600",
  out_for_delivery: "bg-green-600",
  delivered: "bg-emerald-600",
};

const STATUS_TEXT_MAP: { [key: string]: string } = {
  confirmed: "Order Confirmed",
  preparing: "Being Prepared",
  ready: "Ready for Pickup",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
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

const PerformantOrderTrackingComponent = () => {
  const { user } = useAuth();
  const [showMap, setShowMap] = useState(true);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    // refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const activeOrder = useMemo(
    () =>
      orders.find(
        (order) =>
          order.status !== "delivered" &&
          order.status !== "cancelled" &&
          new Date(order.createdAt) >
            new Date(Date.now() - 24 * 60 * 60 * 1000),
      ),
    [orders],
  );

  const { data: trackingData } = useQuery<OrderTrackingData>({
    queryKey: [`/api/orders/${activeOrder?.id}/tracking`],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${activeOrder.id}/tracking`);
      if (!res.ok) throw new Error("Failed to fetch tracking data");
      return res.json();
    },
    enabled: !!activeOrder,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: liveLocation } = useQuery<DeliveryLocation>({
    queryKey: [`/api/orders/${activeOrder?.id}/delivery-location`],
    queryFn: async () => {
      const res = await fetch(
        `/api/orders/${activeOrder.id}/delivery-location`,
      );
      if (!res.ok) throw new Error("Failed to fetch delivery location");
      return res.json();
    },
    enabled: !!activeOrder && !!trackingData && showMap,
    staleTime: 30 * 1000,
    refetchInterval: 90 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const getStatusProgress = useCallback(
    (status: string) => STATUS_PROGRESS_MAP[status] || 0,
    [],
  );
  const getStatusColor = useCallback(
    (status: string) => STATUS_COLOR_MAP[status] || "bg-gray-600",
    [],
  );
  const getStatusText = useCallback(
    (status: string) => STATUS_TEXT_MAP[status] || status,
    [],
  );

  const toggleMap = useCallback(() => setShowMap((prev) => !prev), []);

  const calculateDirections = useCallback(
    (from: DeliveryLocation, to: any) => {
      if (!isLoaded || !window.google) return;

      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: from.lat, lng: from.lng },
          destination: { lat: to.lat, lng: to.lng },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            setDirections(result);
          }
        },
      );
    },
    [isLoaded],
  );

  useEffect(() => {
    if (liveLocation && trackingData?.customerLocation) {
      calculateDirections(liveLocation, trackingData.customerLocation);
    }
  }, [liveLocation, trackingData?.customerLocation, calculateDirections]);

  const vehicleIcon = useMemo(() => {
    if (!liveLocation) return undefined;

    const emoji = "🛵";
    const canvasSize = 64;

    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.font =
      "48px Apple Color Emoji, Noto Color Emoji, Segoe UI Emoji, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, canvasSize / 2, canvasSize / 2 + 4);
    return {
      url: canvas.toDataURL(),
      scaledSize: new google.maps.Size(canvasSize, canvasSize),
      anchor: new google.maps.Point(canvasSize / 2, canvasSize / 2),
    };
  }, [liveLocation]);

  if (!user || !activeOrder || !trackingData) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Order #{trackingData.orderId} Tracking
            </CardTitle>
            <Badge
              className={cn("text-white", getStatusColor(trackingData.status))}
            >
              {getStatusText(trackingData.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Order Progress</span>
              <span>{getStatusProgress(trackingData.status)}% Complete</span>
            </div>
            <Progress
              value={getStatusProgress(trackingData.status)}
              className="h-2"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium">
                  {trackingData.deliveryPerson.name}
                </p>
                <p className="text-sm text-gray-600">
                  {trackingData.deliveryPerson.vehicleNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium">Estimated Delivery</p>
                <p className="text-sm text-gray-600">
                  {new Date(
                    trackingData.estimatedDeliveryTime,
                  ).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium">Contact Driver</p>
                <p className="text-sm text-gray-600">
                  {trackingData.deliveryPerson.phone}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
              {showMap ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {showMap ? "Hide Map" : "Show Map"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showMap && isLoaded && (
            <div className="rounded-lg overflow-hidden border">
              <GoogleMap
                mapContainerStyle={MAP_CONFIG}
                center={
                  liveLocation
                    ? { lat: liveLocation.lat, lng: liveLocation.lng }
                    : MAP_CENTER
                }
                zoom={14}
                options={MAP_OPTIONS}
              >
                <Marker
                  position={{
                    lat: trackingData.customerLocation.lat,
                    lng: trackingData.customerLocation.lng,
                  }}
                  title="Your Delivery Location"
                />

                {liveLocation && (
                  <Marker
                    position={{ lat: liveLocation.lat, lng: liveLocation.lng }}
                    icon={vehicleIcon || undefined}
                    title={`${trackingData.deliveryPerson.name} - ${trackingData.deliveryPerson.vehicleNumber}`}
                  />
                )}

                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={DIRECTIONS_OPTIONS}
                  />
                )}
              </GoogleMap>
            </div>
          )}

          {liveLocation && showMap && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Driver speed: {Math.round(liveLocation.speed)} km/h • Last
                updated: {new Date(liveLocation.timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const PerformantOrderTracking = memo(PerformantOrderTrackingComponent);
