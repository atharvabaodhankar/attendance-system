import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function StudentAttendance({ user }) {
  const [records, setRecords] = useState([]);
  const [percentage, setPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user) return;

      const { class_name, roll_number } = user;
      if (!class_name || !roll_number) return;

      // 1. Get all attendance for user's class
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("class_name", class_name);

      if (error) {
        console.error("Attendance fetch error:", error.message);
        return;
      }

      // 2. Extract entries where this student is present in the JSON
      const studentEntries = [];

      data.forEach((record) => {
        const entry = record.data[roll_number];
        if (entry) {
          studentEntries.push({
            date: record.date,
            present: entry.present,
            marked_by: entry.marked_by,
          });
        }
      });

      // 3. Get teacher names
      const teacherIds = [...new Set(studentEntries.map((e) => e.marked_by))];
      let teacherMap = {};

      if (teacherIds.length > 0) {
        const { data: teachers } = await supabase
          .from("users")
          .select("id, name, email")
          .in("id", teacherIds);

        teachers.forEach((t) => {
          teacherMap[t.id] = t.name || t.email;
        });
      }

      const enriched = studentEntries.map((rec) => ({
        ...rec,
        teacher: teacherMap[rec.marked_by] || "Unknown",
      }));

      const total = enriched.length;
      const present = enriched.filter((r) => r.present).length;
      setPercentage(total > 0 ? ((present / total) * 100).toFixed(1) : "0");
      enriched.sort((a, b) => new Date(b.date) - new Date(a.date));

      setRecords(enriched);
      setLoading(false);
    };

    fetchAttendance();
  }, [user]);

  if (loading) return <p className="text-center">Loading attendance...</p>;

  return (
    <div className="p-4 bg-white border rounded shadow">
      <h2 className="text-2xl font-semibold mb-2 text-center">
        Attendance: <span className="text-green-600">{percentage}%</span>
      </h2>

      <table className="w-full text-sm mt-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Marked By</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec, idx) => (
            <tr key={idx} className="border-b">
              <td className="p-2 border">
                {new Date(rec.date).toLocaleDateString()}
              </td>
              <td
                className={`p-2 border font-semibold ${
                  rec.present ? "text-green-600" : "text-red-500"
                }`}
              >
                {rec.present ? "✅ Present" : "❌ Absent"}
              </td>

              <td className="p-2 border">
                {rec.teacher === "Unknown" ? (
                  <span className="text-red-500 italic">Unknown</span>
                ) : (
                  rec.teacher
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
