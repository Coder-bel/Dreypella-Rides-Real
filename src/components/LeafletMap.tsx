import { useEffect, useRef } from "react";

/** Approximate coordinates for MVP cities */
const CITY_COORDS: Record<string, [number, number]> = {
  ogbomoso: [8.1337, 4.2472],
  ibadan: [7.3776, 3.9470],
  lagos: [6.5244, 3.3792],
  iseyin: [7.9667, 3.6000],
  oyo: [7.8508, 3.9342],
};

const KNOWN_CITIES = Object.keys(CITY_COORDS);

const matchCity = (text: string): string | null => {
  const lower = text.toLowerCase();
  return KNOWN_CITIES.find((c) => lower.includes(c)) || null;
};

interface LeafletMapProps {
  pickup: string;
  dropoff: string;
  height?: number;
}

declare global {
  interface Window {
    L: any;
  }
}

const LeafletMap = ({ pickup, dropoff, height = 192 }: LeafletMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = window.L;
      if (!L) return;

      const pickupCity = matchCity(pickup);
      const dropoffCity = matchCity(dropoff);

      const pickupCoords = pickupCity ? CITY_COORDS[pickupCity] : CITY_COORDS.ogbomoso;
      const dropoffCoords = dropoffCity ? CITY_COORDS[dropoffCity] : CITY_COORDS.ogbomoso;

      const map = L.map(mapRef.current).setView(pickupCoords, 10);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const pickupMarker = L.marker(pickupCoords).addTo(map);
      pickupMarker.bindPopup(`<b>📍 Pickup Point</b><br/>${pickup}`).openPopup();

      const dropoffMarker = L.marker(dropoffCoords).addTo(map);
      dropoffMarker.bindPopup(`<b>📦 Delivery Point</b><br/>${dropoff}`);

      if (pickupCity !== dropoffCity) {
        const bounds = L.latLngBounds([pickupCoords, dropoffCoords]);
        map.fitBounds(bounds, { padding: [40, 40] });
        L.polyline([pickupCoords, dropoffCoords], { color: "#E63946", dashArray: "8 4", weight: 3 }).addTo(map);
      }
    };

    // Load Leaflet JS if not loaded
    if (!window.L) {
      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => setTimeout(initMap, 100);
        document.head.appendChild(script);
      } else {
        const check = setInterval(() => {
          if (window.L) { clearInterval(check); initMap(); }
        }, 100);
      }
    } else {
      initMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pickup, dropoff]);

  return (
    <div
      ref={mapRef}
      className="w-full h-48 rounded-xl overflow-hidden border z-0"
      style={{ minHeight: 192 }}
    />
  );
};

export default LeafletMap;
