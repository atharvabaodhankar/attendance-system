import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function StudentAttendance({ userId, className }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("date, data")
        .eq("class_name", className)
        .order("date", { ascending: false });

      if (error) {
        console.error("Failed to load attendance:", error);
        return;
      }

      const formatted = data.map((entry) => ({
        date: entry.date,
        status: entry.data?.[userId] || "absent",
      }));

      setRecords(formatted);
      setLoading(false);
    };

    fetchAttendance();
  }, [userId, className]);

  if (loading) return <p>Loading attendance...</p>;

  if (records.length === 0) return <p className="text-gray-500">No attendance records found.</p>;

  return (
    <ul className="mt-3 space-y-2">
      {records.map(({ date, status }) => (
        <li key={date} className="flex justify-between border px-3 py-1 rounded">
          <span>{date}</span>
          <span className={status === "present" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
            {status}
          </span>
        </li>
      ))}
    </ul>
  );
}
