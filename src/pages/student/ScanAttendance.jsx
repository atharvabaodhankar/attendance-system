import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import { CheckCircle, XCircle, AlertTriangle, MapPin, Loader2 } from 'lucide-react';

const ScanAttendance = () => {
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    // Initialize Scanner only if idle
    if (status === 'idle') {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);

      return () => {
        scanner.clear().catch(error => console.error("Failed to clear scanner ", error));
      };
    }
  }, [status]);

  const onScanSuccess = (decodedText, decodedResult) => {
    try {
      const data = JSON.parse(decodedText);
      if (data.sessionId && data.token) {
        handleAttendanceMarking(data);
      } else {
        setStatus('error');
        setMessage('Invalid QR Code format.');
      }
    } catch (e) {
      // If not JSON, maybe old format or invalid
      setStatus('error');
      setMessage('Invalid QR Code data.');
    }
  };

  const onScanFailure = (error) => {
    // handle scan failure, usually better to ignore as it triggers on every frame check
    // console.warn(`Code scan error = ${error}`);
  };

  const handleAttendanceMarking = async (qrData) => {
    setStatus('processing');
    setMessage('Verifying attendance details...');

    try {
      // 1. Fetch Session Details
      const { data: session, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('id', qrData.sessionId)
        .single();

      if (sessionError || !session) throw new Error("Session not found or invalid.");

      // 2. Check Token match
      if (session.qr_code !== qrData.token) throw new Error("Invalid or expired QR Token.");

      // 3. Check Active
      if (session.end_time) throw new Error("Attendance session has ended.");

      let studentLat = null;
      let studentLong = null;
      let riskScore = 0.0;

      // 4. Location Check if required
      if (session.location_required) {
        setMessage('Verifying location...');
        try {
           const pos = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
           });
           studentLat = pos.coords.latitude;
           studentLong = pos.coords.longitude;
           setLocation({ lat: studentLat, long: studentLong });

           // Calculate Distance (Haversine Formula) can be done here or DB
           // For simple JS implementation:
           const dist = getDistanceFromLatLonInKm(studentLat, studentLong, session.teacher_latitude, session.teacher_longitude) * 1000; // meters
           
           if (dist > (session.radius_meters || 100)) {
              riskScore += 0.8; // High risk if far
              // We could reject or just flag. SRS says "Student location shall be validated". 
              // Let's flag heavily but maybe allow with warning? 
              // SRS FR-15: "If location is enabled, student location shall be validated against teacher location"
              // Usually strict validation means reject. 
              // But let's mark as 'flagged' status if distance is too far.
           }
        } catch (locErr) {
           console.error(locErr);
           riskScore += 1.0; // Max risk if location needed but failed
           // Could throw error here if strict.
        }
      }

      // 5. Mark Attendance
      // Check if already marked
      const { data: existing } = await supabase
         .from('attendance_records')
         .select('*')
         .eq('session_id', session.id)
         .eq('student_id', user.id)
         .single();
      
      if (existing) {
         setStatus('error');
         setMessage('You have already marked attendance for this session.');
         return;
      }

      const attendanceStatus = riskScore > 0.5 ? 'flagged' : 'present';

      const { error: markError } = await supabase
        .from('attendance_records')
        .insert([
          {
            session_id: session.id,
            student_id: user.id,
            status: attendanceStatus,
            risk_score: riskScore,
            latitude: studentLat,
            longitude: studentLong,
            device_info: navigator.userAgent
          }
        ]);

      if (markError) throw markError;

      setStatus('success');
      setMessage(attendanceStatus === 'flagged' ? 'Attendance marked but flagged for review (Location mismatch).' : 'Attendance marked successfully!');

    } catch (err) {
      setStatus('error');
      setMessage(err.message || "Failed to mark attendance.");
    }
  };

  // Helper function for distance
  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
  }

  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }

  return (
    <AppLayout>
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Scan Attendance</h1>
        
        {status === 'idle' && (
           <div className="bg-white p-4 rounded-lg shadow">
              <div id="reader"></div>
              <p className="text-center text-sm text-gray-500 mt-2">
                 Point your camera at the teacher's QR code.
              </p>
           </div>
        )}

        {status === 'processing' && (
           <div className="bg-white p-8 rounded-lg shadow text-center">
              <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4"/>
              <h3 className="text-lg font-medium text-gray-900">Processing...</h3>
              <p className="text-gray-500">{message}</p>
           </div>
        )}

        {status === 'success' && (
           <div className={`bg-white p-8 rounded-lg shadow text-center border-t-4 ${message.includes('flagged') ? 'border-yellow-500' : 'border-green-500'}`}>
              {message.includes('flagged') ? (
                 <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              ) : (
                 <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              )}
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                 {message.includes('flagged') ? 'Flagged' : 'Success'}
              </h3>
              <p className="text-gray-600">{message}</p>
              <button 
                 onClick={() => { setStatus('idle'); setMessage(''); }}
                 className="mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                 Scan Another
              </button>
           </div>
        )}

        {status === 'error' && (
           <div className="bg-white p-8 rounded-lg shadow text-center border-t-4 border-red-500">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Failed</h3>
              <p className="text-red-600">{message}</p>
              <button 
                 onClick={() => { setStatus('idle'); setMessage(''); }}
                 className="mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                 Try Again
              </button>
           </div>
        )}

      </div>
    </AppLayout>
  );
};

export default ScanAttendance;
