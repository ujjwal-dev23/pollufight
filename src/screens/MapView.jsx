import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, Factory, Construction, Navigation, Info, Loader2, CheckCircle2, Clock, Plus } from 'lucide-react';
import { subscribeToReports, updateReportStatus, createReport } from '../services/pollutionReports';

// Custom Marker Creator with Glowing Aura
const createMarkerIcon = (color) => {
  // Map status to color hex codes
  const colorMap = {
    red: '#ff3333',    // Red for detected
    orange: '#ff8800', // Orange for in progress
    green: '#22c55e'   // Green for resolved
  };

  const colorHex = colorMap[color] || colorMap.red;
  // Convert hex to RGB for rgba usage
  const r = parseInt(colorHex.slice(1, 3), 16);
  const g = parseInt(colorHex.slice(3, 5), 16);
  const b = parseInt(colorHex.slice(5, 7), 16);

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-10 h-10 rounded-full animate-ping" style="background-color: rgba(${r}, ${g}, ${b}, 0.6);"></div>
        <div class="absolute w-6 h-6 rounded-full" style="background-color: rgba(${r}, ${g}, ${b}, 0.4); box-shadow: 0 0 20px rgba(${r}, ${g}, ${b}, 0.8);"></div>
        <div class="relative w-5 h-5 rounded-full border-2 border-white" style="background-color: ${colorHex}; box-shadow: 0 0 15px rgba(${r}, ${g}, ${b}, 1), 0 0 30px rgba(${r}, ${g}, ${b}, 0.6);"></div>
      </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

// Map status to color
const getStatusColor = (status) => {
  switch (status) {
    case 'detected':
      return 'red';
    case 'in_progress':
      return 'orange';
    case 'resolved':
      return 'green';
    default:
      return 'red';
  }
};

// Get vibrant color hex for circles and overlays
const getStatusColorHex = (status) => {
  switch (status) {
    case 'detected':
      return '#ff3333'; // Red for detected
    case 'in_progress':
      return '#ff8800'; // Orange for in progress
    case 'resolved':
      return '#22c55e'; // Green for resolved (more standard green)
    default:
      return '#ff3333'; // Default to red
  }
};

// Map status to display name
const getStatusDisplay = (status) => {
  switch (status) {
    case 'detected':
      return 'Detected';
    case 'in_progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    default:
      return 'Unknown';
  }
};

// Hardcoded demo spots for demonstration
const DEMO_SPOTS = [
  {
    id: 'demo-1',
    status: 'detected',
    location: {
      latitude: 28.4744,
      longitude: 77.0652
    },
    metadata: {
      site: 'Udyog Vihar Factory Cluster',
      type: 'Industrial'
    },
    imageUrl: null,
    createdAt: { toDate: () => new Date() },
    updatedAt: { toDate: () => new Date() },
    isDemo: true
  },
  {
    id: 'demo-2',
    status: 'in_progress',
    location: {
      latitude: 28.4505,
      longitude: 77.0266
    },
    metadata: {
      site: 'Sector 29 Luxury Heights Construction',
      type: 'Construction'
    },
    imageUrl: null,
    createdAt: { toDate: () => new Date() },
    updatedAt: { toDate: () => new Date() },
    isDemo: true
  },
  {
    id: 'demo-3',
    status: 'resolved',
    location: {
      latitude: 28.4850,
      longitude: 77.0850
    },
    metadata: {
      site: 'DLF Cyber Hub Backlane',
      type: 'Industrial'
    },
    imageUrl: null,
    createdAt: { toDate: () => new Date() },
    updatedAt: { toDate: () => new Date() },
    isDemo: true
  },
  {
    id: 'demo-4',
    status: 'detected',
    location: {
      latitude: 28.4420,
      longitude: 77.0400
    },
    metadata: {
      site: 'Sector 18 Industrial Area',
      type: 'Industrial'
    },
    imageUrl: null,
    createdAt: { toDate: () => new Date() },
    updatedAt: { toDate: () => new Date() },
    isDemo: true
  }
];

const MapView = () => {
  const center = [28.4595, 77.0266]; // Cyber City, Gurugram
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null); // Track which report is being updated
  const [isAddingTestSpot, setIsAddingTestSpot] = useState(false);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeToReports((reportsData) => {
      // Filter out reports without valid location data
      const validReports = reportsData.filter(
        report => report.location &&
          report.location.latitude &&
          report.location.longitude
      );
      // Merge demo spots with Firestore reports (demo spots first, then real reports)
      const allReports = [...DEMO_SPOTS, ...validReports];
      setReports(allReports);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleStatusUpdate = async (reportId, newStatus) => {
    // Check if it's a demo spot
    const report = reports.find(r => r.id === reportId);
    if (report?.isDemo) {
      // For demo spots, update local state only
      setReports(prevReports =>
        prevReports.map(r =>
          r.id === reportId ? { ...r, status: newStatus } : r
        )
      );
      return;
    }

    // For real reports, update in Firestore
    setUpdatingStatus(reportId);
    try {
      const result = await updateReportStatus(reportId, newStatus);
      if (!result.success) {
        console.error('Failed to update status:', result.error);
        alert('Failed to update status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Count active violations (detected + in_progress)
  const activeViolations = reports.filter(
    report => report.status === 'detected' || report.status === 'in_progress'
  ).length;

  // Test function to add a new spot to Firestore
  const handleAddTestSpot = async () => {
    setIsAddingTestSpot(true);
    try {
      // Add a test spot near the existing demo spots
      // Using coordinates between demo-1 and demo-2
      const testLocation = {
        latitude: 28.4625, // Between 28.4744 and 28.4505
        longitude: 77.0459, // Between 77.0652 and 77.0266
        accuracy: 10
      };

      const result = await createReport({
        location: testLocation,
        imageUrl: 'https://via.placeholder.com/800x600/ff3333/ffffff?text=Test+Pollution+Report',
        metadata: {
          site: 'Test Location - Cyber City',
          type: 'Industrial',
          test: true
        }
      });

      if (result.success) {
        console.log('Test spot added successfully:', result.reportId);
        alert('Test spot added successfully! It should appear on the map shortly.');
      } else {
        console.error('Failed to add test spot:', result.error);
        alert(`Failed to add test spot: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding test spot:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsAddingTestSpot(false);
    }
  };

  return (
    <div className="h-screen w-full relative bg-[#0f172a] pb-24 overflow-hidden">
      {/* Top HUD Overlay */}
      <div className="absolute top-6 left-6 right-6 z-[1000] space-y-3 pointer-events-none">
        <div className="glass p-5 rounded-[24px] flex justify-between items-center pointer-events-auto">
          <div>
            <h2 className="text-white font-black italic tracking-tighter">GUILTY MAP</h2>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
              {loading ? 'Loading...' : `${activeViolations} active violation${activeViolations !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Test Button - Remove in production */}
            <button
              onClick={handleAddTestSpot}
              disabled={isAddingTestSpot}
              className="bg-blue-500/80 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
              title="Add test spot to Firestore"
            >
              {isAddingTestSpot ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Test Spot</span>
                </>
              )}
            </button>
            <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
              <Navigation className="text-white" size={18} />
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex space-x-2 pointer-events-auto">
          <div className="glass-emerald px-4 py-2 rounded-full text-[9px] font-black text-emerald-400 border-emerald-500/30">ALL THREATS</div>
          <div className="glass px-4 py-2 rounded-full text-[9px] font-black text-slate-400 uppercase">Industrial</div>
          <div className="glass px-4 py-2 rounded-full text-[9px] font-black text-slate-400 uppercase">Construction</div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-2000 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700 flex flex-col items-center space-y-3">
            <Loader2 size={24} className="text-emerald-400 animate-spin" />
            <span className="text-emerald-400 font-mono text-[10px] uppercase tracking-widest">Loading Reports</span>
          </div>
        </div>
      )}

      {/* Map Container */}
      <MapContainer
        center={center}
        zoom={13}
        zoomControl={false}
        className="h-full w-full grayscale-[0.9] invert-[0.95] contrast-[1.1]"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {reports.map((report) => {
          const statusColor = getStatusColor(report.status);
          const colorHex = getStatusColorHex(report.status);
          // Leaflet uses [lat, lng] format - ensure consistent position reference
          const lat = report.location.latitude;
          const lng = report.location.longitude;
          const position = [lat, lng];

          return (
            <FeatureGroup key={report.id}>
              {/* Heat Ring Overlay */}
              <Circle
                center={position}
                radius={500}
                pathOptions={{
                  fillColor: colorHex,
                  color: colorHex,
                  fillOpacity: 0.3,
                  weight: 2,
                  opacity: 0.5
                }}
              />

              <Marker
                position={position}
                icon={createMarkerIcon(statusColor)}
              >
                <Popup className="custom-popup">
                  <div className="p-3 w-56 bg-slate-900 text-white rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      {report.status === 'resolved' ? (
                        <CheckCircle2 size={16} className="text-[#22c55e]" style={{ filter: 'drop-shadow(0 0 4px #22c55e)' }} />
                      ) : report.status === 'in_progress' ? (
                        <Clock size={16} className="text-[#ff8800]" style={{ filter: 'drop-shadow(0 0 4px #ff8800)' }} />
                      ) : (
                        <Factory size={16} className="text-[#ff3333]" style={{ filter: 'drop-shadow(0 0 4px #ff3333)' }} />
                      )}
                      <span className="font-black text-xs uppercase italic">
                        {getStatusDisplay(report.status)} Alert
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-3">
                      <span
                        className={`inline-block px-3 py-1.5 rounded-md text-[9px] font-black uppercase ${report.status === 'detected' ? 'bg-red-500/30 text-red-300 border border-red-500/50' :
                          report.status === 'in_progress' ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50' :
                            'bg-green-500/30 text-green-300 border border-green-500/50'
                          }`}
                        style={{
                          boxShadow: report.status === 'detected' ? '0 0 10px rgba(255, 51, 51, 0.4)' :
                            report.status === 'in_progress' ? '0 0 10px rgba(255, 136, 0, 0.4)' :
                              '0 0 10px rgba(34, 197, 94, 0.4)' // Updated to match #22c55e (rgb(34, 197, 94))
                        }}
                      >
                        {getStatusDisplay(report.status)}
                      </span>
                    </div>

                    {report.metadata?.site && (
                      <p className="text-[10px] text-slate-400 mb-3">{report.metadata.site}</p>
                    )}

                    {/* Status Update Buttons */}
                    <div className="space-y-2">
                      {report.status === 'detected' && (
                        <button
                          onClick={() => handleStatusUpdate(report.id, 'in_progress')}
                          disabled={updatingStatus === report.id}
                          className="w-full bg-orange-500 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          {updatingStatus === report.id ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <Clock size={12} />
                              <span>Mark as In Progress</span>
                            </>
                          )}
                        </button>
                      )}

                      {(report.status === 'detected' || report.status === 'in_progress') && (
                        <button
                          onClick={() => handleStatusUpdate(report.id, 'resolved')}
                          disabled={updatingStatus === report.id}
                          className="w-full bg-emerald-500 text-slate-900 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          {updatingStatus === report.id ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={12} />
                              <span>Mark as Resolved</span>
                            </>
                          )}
                        </button>
                      )}

                      {report.status === 'resolved' && (
                        <div className="text-center py-2">
                          <p className="text-[9px] text-green-400 font-bold uppercase">Issue Resolved</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </FeatureGroup>
          );
        })}
      </MapContainer>

      {/* Bottom Floating Info Card */}
      <div className="absolute bottom-32 left-6 right-6 z-[1000] glass p-4 rounded-2xl flex items-center space-x-4 border-l-4 border-emerald-500">
        <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-500">
          <Info size={18} />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Crowdsource Data Active</h4>
          <p className="text-[9px] text-slate-400 italic font-medium">
            {reports.length} report{reports.length !== 1 ? 's' : ''} tracked in real-time
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapView;
