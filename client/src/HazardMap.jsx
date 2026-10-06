import { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';

const getHazardCoordinates = (location) => {
  const latitude = location?.latitude ?? location?._latitude;
  const longitude = location?.longitude ?? location?._longitude;

  if (typeof latitude !== 'number' || typeof longitude !== 'number' || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return [latitude, longitude];
};

function FitMapToMarkers({ positions, focusPosition }) {
  const map = useMap();

  useEffect(() => {
    if (focusPosition) {
      map.setView(focusPosition, 16);
    } else if (positions.length === 1) {
      map.setView(positions[0], 13);
    } else if (positions.length > 1) {
      map.fitBounds(positions, { padding: [36, 36], maxZoom: 14 });
    }
  }, [focusPosition, map, positions]);

  return null;
}

function HazardMap({ text, complaints, isLoading, selectedHazardId }) {
  const statusColors = { Pending: '#c77d12', Reviewed: '#0f766e', Resolved: '#2854a5', Rejected: '#b42318' };
  const hazardLabels = { Pothole: text.pothole, 'Fallen Tree': text.fallenTree, 'Broken Sign': text.brokenSign };
  const statusLabels = { Pending: text.pending, Reviewed: text.reviewed, Resolved: text.resolved, Rejected: text.rejected };
  const mappedComplaints = complaints.map((complaint) => ({
    ...complaint,
    coordinates: getHazardCoordinates(complaint.location)
  })).filter((complaint) => complaint.coordinates);
  const positions = mappedComplaints.map((complaint) => complaint.coordinates);
  const focusPosition = mappedComplaints.find((complaint) => complaint.id === selectedHazardId)?.coordinates;
  const center = positions[0] || [7.8731, 80.7718];

  return (
    <section className="card border-0 shadow-sm hazard-map-panel">
      <header className="card-header bg-white border-0 p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
          <div>
            <h2 className="h5 mb-1">{text.mapView}</h2>
            <p className="text-secondary mb-0">{text.mapDescription}</p>
          </div>
          <span className="badge text-bg-light border">{mappedComplaints.length} / {complaints.length}</span>
        </div>
      </header>
      <div className="hazard-map-frame">
        <MapContainer center={center} zoom={7} scrollWheelZoom className="hazard-map-canvas">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitMapToMarkers positions={positions} focusPosition={focusPosition} />
          {mappedComplaints.map((complaint) => (
            <CircleMarker
              key={complaint.id}
              center={complaint.coordinates}
              radius={complaint.id === selectedHazardId ? 12 : 9}
              pathOptions={{ color: complaint.id === selectedHazardId ? '#111827' : '#fff', weight: complaint.id === selectedHazardId ? 3 : 2, fillColor: statusColors[complaint.status] || '#4b5563', fillOpacity: 0.95 }}
            >
              <Popup>
                <strong>{complaint.id}</strong><br />
                {hazardLabels[complaint.hazard_type] || complaint.hazard_type}<br />
                {statusLabels[complaint.status] || complaint.status}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <footer className="d-flex flex-wrap align-items-center gap-3 px-4 py-3 border-top small text-secondary">
        {isLoading && <span>{text.loading}</span>}
        {!isLoading && mappedComplaints.length === 0 && <span>{text.noMappedHazards}</span>}
        {Object.entries(statusColors).map(([status, color]) => (
          <span className="d-inline-flex align-items-center gap-2" key={status}>
            <span className="hazard-map-legend-dot" style={{ backgroundColor: color }} />{statusLabels[status]}
          </span>
        ))}
      </footer>
    </section>
  );
}

export default HazardMap;