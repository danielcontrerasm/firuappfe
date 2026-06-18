import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/runtime";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(buildApiUrl("/api/auth/register"), {
        name,
        email,
        password,
        role: "USER",
      });
      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (error) {
      console.error("Registration failed", error);
      alert("Failed to register");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <div>
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit">Register</button>
    </form>
  );
}

export default Register;
