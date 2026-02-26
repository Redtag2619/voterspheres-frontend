import { useState } from "react";
import { login } from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await login(email, password);
    if (res.token) {
      localStorage.setItem("token", res.token);
      window.location = "/dashboard";
    } else {
      alert("Login failed");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>VoterSpheres Login</h1>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <br />
      <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
      <br />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
