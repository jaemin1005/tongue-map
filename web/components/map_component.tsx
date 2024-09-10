"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  mapRef: React.MutableRefObject<L.Map | null>
}

const MapComponent: React.FC<MapComponentProps> = (
  { center, zoom, mapRef },
) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // DOM이 랜더링 된 후에만 변경하도록 하였다.
    if (!mapContainerRef.current) return;

    // 맵 초기화
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: false,
        dragging: true,
        inertia: true,
      });

      // 타일 레이어 즉시 추가
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    } else {
      // 맵의 중심을 업데이트
      mapRef.current.setView(center, zoom);
    }

    // 컴포넌트 언마운트 시 맵 정리
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, zoom, mapRef]);


  return (
      <div ref={mapContainerRef} className="w-full h-full z-0" />
  );
};

export default MapComponent;
