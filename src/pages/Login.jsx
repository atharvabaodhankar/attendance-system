import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { email, password } = form;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
    } else {
      navigate("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 mt-10 border rounded-xl shadow-xl">
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Email:
          <input name="email" type="email" value={form.email} onChange={handleChange} required className="input" />
        </label>

        <label className="block">
          Password:
          <input name="password" type="password" value={form.password} onChange={handleChange} required className="input" />
        </label>

        <button type="submit" disabled={loading} className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700">
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
