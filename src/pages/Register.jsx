import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    class_name: "",
    roll_number: "",
    role: "student",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { email, password, name, class_name, roll_number, role } = form;

    // 1. Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    // 2. Insert into `users` table
    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      name,
      email,
      class_name,
      role,
      roll_number: role === "student" ? roll_number : null,
    });

    if (insertError) {
      alert(insertError.message);
    } else {
      alert("Registration successful! Check your email.");
      navigate("/login");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 mt-10 border rounded-xl shadow-xl">
      <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Name:
          <input name="name" value={form.name} onChange={handleChange} required className="input" />
        </label>

        <label className="block">
          Email:
          <input name="email" type="email" value={form.email} onChange={handleChange} required className="input" />
        </label>

        <label className="block">
          Password:
          <input name="password" type="password" value={form.password} onChange={handleChange} required className="input" />
        </label>

        <label className="block">
          Role:
          <select name="role" value={form.role} onChange={handleChange} className="input">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </label>

        {form.role === "student" && (
          <label className="block">
            Roll Number:
            <input name="roll_number" value={form.roll_number} onChange={handleChange} required className="input" />
          </label>
        )}

        <label className="block">
          Class Name:
          <select name="class_name" value={form.class_name} onChange={handleChange} required className="input">
            <option value="">Select Class</option>
            <option value="CM1k">CM1k</option>
            <option value="CM2k">CM2k</option>
            <option value="CM3k">CM3k</option>
            <option value="CM4k">CM4k</option>
            <option value="CM5k">CM5k</option>
            <option value="CM6k">CM6k</option>
          </select>
        </label>

        <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
