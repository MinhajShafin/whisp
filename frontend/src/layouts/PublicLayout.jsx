import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors">
      <Outlet /> {/* 👈 This is where Login/Register pages will appear */}
    </div>
  );
}
