import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Register = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axiosInstance.post("/auth/register", formData);
      login(res.data.user, res.data.token);
      navigate("/timeline");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-md">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-center">Create Account</h2>
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" onChange={handleChange} required />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" onChange={handleChange} required />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" onChange={handleChange} required />
            </div>

            <Button type="submit" className="w-full">
              Sign Up
            </Button>
          </form>

          <p className="text-sm text-center text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-500 hover:underline">
              Log in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
