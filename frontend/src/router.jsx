import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home.jsx";
import Login from "@/pages/Login.jsx";
//import Register from "@/pages/Register.jsx";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
