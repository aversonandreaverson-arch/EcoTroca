import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const MapaRotas = ({ origin, destination }) => {
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const mapRef = useRef();

    useEffect(() => {
        if (origin && destination) {
            // Calculate route and distance here
            const [lat1, lng1] = origin;
            const [lat2, lng2] = destination;
            const distance = calculateDistance(lat1, lng1, lat2, lng2);
            setRouteCoordinates([{ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 }]);
            alert(`Distance: ${distance} km`);
        }
    }, [origin, destination]);

    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lng2 - lng1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in km
        return distance;
    };

    const AddControls = () => {
        const map = useMap();

        const navigate = (direction) => {
            const currentZoom = map.getZoom();
            const currentCenter = map.getCenter();
            if (direction === 'in') {
                map.setZoom(currentZoom + 1);
            } else if (direction === 'out') {
                map.setZoom(currentZoom - 1);
            } else if (direction === 'reset') {
                map.setView([routeCoordinates[0].lat, routeCoordinates[0].lng]);
            }
        };

        return ( 
            <div>
                <button onClick={() => navigate('in')}>Zoom In</button>
                <button onClick={() => navigate('out')}>Zoom Out</button>
                <button onClick={() => navigate('reset')}>Reset View</button>
            </div>
        );
    };

    return (
        <MapContainer center={origin} zoom={13} ref={mapRef} style={{ height: '500px', width: '100%' }}>
            <TileLayer 
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' 
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {routeCoordinates.map((position, index) => (
                <Marker key={index} position={position}>
                    <Popup>{`Lat: ${position.lat}, Lng: ${position.lng}`}</Popup>
                </Marker>
            ))}
            <AddControls />
        </MapContainer>
    );
};

export default MapaRotas;
