import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { UserLocation, UserProfile, UserStatus } from '../types';
import { Map as MapIcon, AlertTriangle, CheckCircle2, Home, Navigation, Crosshair } from 'lucide-react';

// Fix for default Leaflet icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  locations: Record<string, UserLocation>;
  members: (UserProfile)[];
  statuses: Record<string, UserStatus>;
  center?: { lat: number; lng: number };
}

// Component to handle map centering
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0 || center[1] !== 0) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function Map({ locations, members, statuses, center }: MapProps) {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'Safe': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'Reached Home': return <Home size={16} className="text-blue-500" />;
      case 'On the Way': return <Navigation size={16} className="text-orange-500" />;
      case 'Need Help': return <AlertTriangle size={16} className="text-red-500" />;
      default: return null;
    }
  };

  const getMarkerIcon = (status?: string, isMe?: boolean) => {
    const color = status === 'Need Help' ? '#ef4444' : isMe ? '#2563eb' : '#3b82f6';
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transform: scale(${isMe ? '1.1' : '1'});">
               ${status === 'Need Help' ? '!' : ''}
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const mapCenter: [number, number] = center 
    ? [center.lat, center.lng] 
    : [0, 0];

  const handleRecenter = useCallback(() => {
    if (mapInstance && center) {
      mapInstance.setView([center.lat, center.lng], 16, { animate: true });
    }
  }, [mapInstance, center]);

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-inner bg-gray-100 z-0">
      <MapContainer 
        center={mapCenter[0] !== 0 ? mapCenter : [20.5937, 78.9629]} // Default to India if no location
        zoom={mapCenter[0] !== 0 ? 16 : 5} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        ref={setMapInstance}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ChangeView center={mapCenter} zoom={16} />

        {Object.entries(locations).map(([uid, loc]) => {
          const member = members.find(m => m.uid === uid);
          const status = statuses[uid];
          const isMe = center?.lat === loc.latitude && center?.lng === loc.longitude;
          
          return (
            <div key={uid}>
              <Marker 
                position={[loc.latitude, loc.longitude]}
                icon={getMarkerIcon(status?.currentStatus, isMe)}
              >
                <Popup>
                  <div className="p-1">
                    <div className="font-bold text-sm mb-1">{member?.name || 'User'} {isMe && '(You)'}</div>
                    <div className="flex items-center gap-2 text-xs">
                      {getStatusIcon(status?.currentStatus)}
                      <span>{status?.currentStatus || 'Online'}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
              {isMe && loc.accuracy && (
                <Circle 
                  center={[loc.latitude, loc.longitude]} 
                  radius={loc.accuracy}
                  pathOptions={{ fillColor: '#2563eb', fillOpacity: 0.1, color: '#2563eb', weight: 1, dashArray: '5, 5' }}
                />
              )}
            </div>
          );
        })}
      </MapContainer>
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button 
          onClick={handleRecenter}
          className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors"
          title="Recenter Map"
        >
          <Crosshair size={20} />
        </button>
      </div>

      {Object.values(locations).length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-100/50 backdrop-blur-[2px] z-10 pointer-events-none">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <MapIcon size={32} />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Locating Family...</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Please ensure location services are enabled on your device.
          </p>
        </div>
      )}
    </div>
  );
}
