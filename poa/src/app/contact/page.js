// components/LeafletMap.js
'use client';

import { useEffect, useRef } from 'react';

export default function LeafletMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    const loadMap = async () => {
      if (mapInstanceRef.current) return;

      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      if (mapRef.current && !mapInstanceRef.current) {
        const map = L.map(mapRef.current).setView([34.919091, -120.442226], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        L.marker([34.919091, -120.442226], {
          icon: L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            shadowSize: [41, 41]
          })
        }).addTo(map)

        // Store the map instance in the ref
        mapInstanceRef.current = map;
      }

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    };

    loadMap();
  }, []);

  return <div ref={mapRef} style={{ height: '300px', width: '100%' }} />;
}