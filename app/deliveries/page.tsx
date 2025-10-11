"use client";

/// <reference types="google.maps" />

import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import DeliveryCard from "@/components/deliveries/DeliveryCard";

interface Delivery {
  id: string;
  customerName: string;
  address: string;
  phoneNumber: string;
  orderDetails: string;
  deliveryTime: string;
  status: "pending" | "completed";
  lat: number;
  lng: number;
}

// Mock data for Fremont, CA deliveries
const MOCK_DELIVERIES: Delivery[] = [
  {
    id: "1",
    customerName: "Sarah Johnson",
    address: "39650 Liberty St, Fremont, CA 94538",
    phoneNumber: "(510) 555-0123",
    orderDetails: "1x Rose Bouquet, 1x Lily Arrangement",
    deliveryTime: "9:00 AM - 11:00 AM",
    status: "pending",
    lat: 37.5485,
    lng: -121.9886,
  },
  {
    id: "2",
    customerName: "Michael Chen",
    address: "43831 Mission Blvd, Fremont, CA 94539",
    phoneNumber: "(510) 555-0234",
    orderDetails: "1x Sunflower Bouquet",
    deliveryTime: "10:00 AM - 12:00 PM",
    status: "pending",
    lat: 37.5593,
    lng: -121.9732,
  },
  {
    id: "3",
    customerName: "Emily Rodriguez",
    address: "3555 Walnut Ave, Fremont, CA 94536",
    phoneNumber: "(510) 555-0345",
    orderDetails: "1x Orchid Plant, 1x Tulip Bouquet",
    deliveryTime: "11:00 AM - 1:00 PM",
    status: "pending",
    lat: 37.5577,
    lng: -122.0391,
  },
  {
    id: "4",
    customerName: "James Wilson",
    address: "40580 Fremont Blvd, Fremont, CA 94538",
    phoneNumber: "(510) 555-0456",
    orderDetails: "1x Mixed Flower Arrangement",
    deliveryTime: "12:00 PM - 2:00 PM",
    status: "pending",
    lat: 37.5324,
    lng: -121.9897,
  },
  {
    id: "5",
    customerName: "Lisa Martinez",
    address: "4260 Central Ave, Fremont, CA 94536",
    phoneNumber: "(510) 555-0567",
    orderDetails: "2x Rose Bouquet, 1x Carnation Arrangement",
    deliveryTime: "1:00 PM - 3:00 PM",
    status: "pending",
    lat: 37.5438,
    lng: -122.0711,
  },
  {
    id: "6",
    customerName: "David Kim",
    address: "4555 Peralta Blvd, Fremont, CA 94536",
    phoneNumber: "(510) 555-0678",
    orderDetails: "1x Daisy Bouquet",
    deliveryTime: "2:00 PM - 4:00 PM",
    status: "pending",
    lat: 37.5272,
    lng: -122.0585,
  },
];

// Light mode map styles - hide POIs, streets, and neighborhoods (but keep city names)
const LIGHT_MODE_MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

// Dark mode map styles
const DARK_MODE_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>(MOCK_DELIVERIES);
  const [selectedDate, setSelectedDate] = useState<string>("today");
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect and watch for theme changes
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    // Check initially
    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Hide Google Maps branding elements
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .gm-style-cc,
      .gm-style a[href^="https://maps.google.com/maps"] {
        display: none !important;
      }
      .gmnoprint a,
      .gmnoprint span,
      .gm-style-cc {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      apiKey || ""
    }&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const googleMap = new google.maps.Map(mapRef.current, {
      zoom: 12,
      center: { lat: 37.5485, lng: -121.9886 }, // Center of Fremont
      mapTypeControl: false, // Hide map/satellite button
      streetViewControl: false, // Hide street view person button
      styles: isDarkMode ? DARK_MODE_MAP_STYLES : LIGHT_MODE_MAP_STYLES,
    });

    const renderer = new google.maps.DirectionsRenderer({
      map: googleMap,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: isDarkMode ? "#60A5FA" : "#4F46E5",
        strokeWeight: 4,
      },
    });

    setMap(googleMap);
    setDirectionsRenderer(renderer);
  }, [isLoaded, map, isDarkMode]);

  // Update map styles when theme changes
  useEffect(() => {
    if (!map) return;

    map.setOptions({
      styles: isDarkMode ? DARK_MODE_MAP_STYLES : LIGHT_MODE_MAP_STYLES,
    });

    if (directionsRenderer) {
      directionsRenderer.setOptions({
        polylineOptions: {
          strokeColor: isDarkMode ? "#60A5FA" : "#4F46E5",
          strokeWeight: 4,
        },
      });
    }
  }, [isDarkMode, map, directionsRenderer]);

  // Calculate and display optimal route
  useEffect(() => {
    if (!map || !directionsRenderer || deliveries.length === 0) return;

    const pendingDeliveries = deliveries.filter((d) => d.status === "pending");
    if (pendingDeliveries.length === 0) return;

    const directionsService = new google.maps.DirectionsService();

    // Starting point (shop location in Fremont)
    const origin = { lat: 37.5485, lng: -121.9886 };

    // Waypoints (all but the last delivery)
    const waypoints = pendingDeliveries.slice(0, -1).map((delivery) => ({
      location: { lat: delivery.lat, lng: delivery.lng },
      stopover: true,
    }));

    // Destination (last delivery)
    const destination = {
      lat: pendingDeliveries[pendingDeliveries.length - 1].lat,
      lng: pendingDeliveries[pendingDeliveries.length - 1].lng,
    };

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (
        result: google.maps.DirectionsResult | null,
        status: google.maps.DirectionsStatus
      ) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
        } else {
          console.error("Directions request failed:", status);
        }
      }
    );
  }, [map, directionsRenderer, deliveries]);

  const toggleDeliveryStatus = (id: string) => {
    setDeliveries((prev) =>
      prev.map((delivery) =>
        delivery.id === id
          ? {
              ...delivery,
              status: delivery.status === "pending" ? "completed" : "pending",
            }
          : delivery
      )
    );
  };

  const pendingCount = deliveries.filter((d) => d.status === "pending").length;
  const completedCount = deliveries.filter(
    (d) => d.status === "completed"
  ).length;

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4">
      {/* Left Side - Delivery List */}
      <div className="w-full md:w-1/3 lg:w-1/3 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
        {/* Header with Date Selector and Status Badges */}
        <div className="flex items-start justify-between gap-4 mb-6">
          {/* Date Selector Dropdown - Grouped */}
          <div className="flex items-start gap-2">
            <div className="rounded-xl p-2 bg-muted">
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Viewing
              </div>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Badges - Grouped */}
          <div className="flex items-start gap-2">
            <Badge variant="info" className="px-3 py-1 font-medium">
              {pendingCount} Pending
            </Badge>
            <Badge variant="success" className="px-3 py-1 font-medium">
              {completedCount} Completed
            </Badge>
          </div>
        </div>

        {deliveries.map((delivery) => (
          <DeliveryCard
            key={delivery.id}
            id={delivery.id}
            customerName={delivery.customerName}
            address={delivery.address}
            phoneNumber={delivery.phoneNumber}
            orderDetails={delivery.orderDetails}
            deliveryTime={delivery.deliveryTime}
            status={delivery.status}
            onClick={() => toggleDeliveryStatus(delivery.id)}
          />
        ))}
      </div>

      {/* Right Side - Google Maps */}
      <div className="hidden md:block md:w-2/3 lg:w-2/3">
        {!isLoaded ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading map...</p>
            </div>
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full rounded-lg" />
        )}
      </div>
    </div>
  );
}
