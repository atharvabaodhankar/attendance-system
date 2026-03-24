import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Loader2, MapPin, Play, StopCircle } from 'lucide-react';

const SessionManager = () => {
  const { classroomId } = useParams();
  const { user } = useAuth(); // Use useAuth for user context
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationRequired, setLocationRequired] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchActiveSession();
  }, [classroomId]);

  const fetchActiveSession = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('classroom_id', classroomId)
        .is('end_time', null)
        .maybeSingle();

      if (error) {
         console.error('Error fetching session:', error);
      }
      setActiveSession(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    if (!user) {
      alert("You must be logged in to start a session.");
      return;
    }

    setCreating(true);
    try {
      let lat = null;
      let long = null;

      if (locationRequired) {
        setMessage && setMessage('Requesting location access...');
        try {
          await new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error("Geolocation is not supported by your browser."));
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                lat = pos.coords.latitude;
                long = pos.coords.longitude;
                resolve();
              },
              (err) => {
                let msg = "Location error: ";
                switch(err.code) {
                  case err.PERMISSION_DENIED: msg += "Permission denied. Please enable location."; break;
                  case err.POSITION_UNAVAILABLE: msg += "Position unavailable."; break;
                  case err.TIMEOUT: msg += "Request timed out."; break;
                  default: msg += "Unknown error.";
                }
                reject(new Error(msg));
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
          });
        } catch (locErr) {
          throw locErr; // Rethrow to be caught by the main catch block
        }
      }

      const qrToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const { data: newSession, error: insertError } = await supabase
        .from('attendance_sessions')
        .insert([
          {
            classroom_id: classroomId,
            teacher_id: user.id, // Correctly using user.id from useAuth
            qr_code: qrToken,
            location_required: locationRequired,
            teacher_latitude: lat,
            teacher_longitude: long,
          }
        ])
        .select()
        .single();
        
      if (insertError) throw insertError;
      setActiveSession(newSession);
      
    } catch (error) {
      console.error("Session Error:", error);
      alert("Error starting session: " + (error.message || "Failed to start session. Check your permissions."));
    } finally {
      setCreating(false);
    }
  };

  const endSession = async () => {
    if (!activeSession) return;
    try {
      const { error } = await supabase
        .from('attendance_sessions')
        .update({ end_time: new Date().toISOString() })
        .eq('id', activeSession.id);

      if (error) throw error;
      setActiveSession(null);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <AppLayout><div className="flex justify-center p-10"><Loader2 className="animate-spin"/></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold">Attendance Session</h1>
        
        {!activeSession ? (
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
             <h2 className="text-lg font-medium">Start New Session</h2>
             <div className="flex items-center space-x-2">
                <input 
                   type="checkbox" 
                   id="location" 
                   checked={locationRequired} 
                   onChange={(e) => setLocationRequired(e.target.checked)} 
                   className="rounded text-indigo-600"
                />
                <label htmlFor="location" className="flex items-center text-gray-700">
                   <MapPin size={16} className="mr-1"/> Require Location Verification
                </label>
             </div>
             <button 
                onClick={startSession}
                disabled={creating}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
             >
                {creating ? <Loader2 className="animate-spin mr-2"/> : <Play className="mr-2"/>}
                Start Session
             </button>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow text-center space-y-6">
             <div className="inline-block p-6 bg-white border-2 border-gray-100 rounded-2xl shadow-xl">
                <QRCodeCanvas 
                   value={JSON.stringify({
                      sessionId: activeSession.id,
                      token: activeSession.qr_code,
                   })} 
                   size={256}
                   level="H"
                   marginSize={2}
                />
             </div>
             
             <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-wider font-mono">
                   {activeSession.qr_code}
                </h2>
                <p className="text-sm text-gray-500 mt-2">Scan this QR code to mark attendance</p>
             </div>

             <div className="flex justify-center">
                <button 
                   onClick={endSession}
                   className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
                >
                   <StopCircle className="mr-2"/> End Session
                </button>
             </div>
             
             {/* Live count could be added here with a subscription */}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SessionManager;
