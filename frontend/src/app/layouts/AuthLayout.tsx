import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-[#0B0E11] flex items-center justify-center p-4">
      <Outlet />
    </div>
  );
}
