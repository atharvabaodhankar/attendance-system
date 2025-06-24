import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import LogoutButton from "../components/LogoutButton";

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // Fetch user profile from `users` table
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setUserData(data);
      }

      setLoading(false);
    };

    loadUserData();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  if (!userData)
    return <p className="text-center mt-10 text-red-500">User not found</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Welcome, {userData.name}</h2>
        <LogoutButton />
      </div>

      {/* STUDENT VIEW */}
      {userData.role === "student" && (
        <div className="p-4 border rounded">
          <p>
            <strong>Class:</strong> {userData.class_name}
          </p>
          <p>
            <strong>Roll No:</strong> {userData.roll_number}
          </p>
          <p className="mt-4 text-lg font-semibold">📅 Attendance Record:</p>

          <StudentAttendance
            userId={userData.id}
            className={userData.class_name}
          />
        </div>
      )}

      {/* TEACHER VIEW */}
      {userData.role === "teacher" && (
        <div className="space-y-4">
          <p className="text-lg font-semibold mb-2">
            📚 Select a Class to Manage:
          </p>
          {["CM1k", "CM2k", "CM3k", "CM4k", "CM5k", "CM6k"].map((cls) => (
            <button
              key={cls}
              onClick={() => (window.location.href = `/dashboard/class/${cls}`)}
              className="block w-full bg-blue-100 border border-blue-400 hover:bg-blue-200 px-4 py-2 rounded text-left"
            >
              {cls}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
