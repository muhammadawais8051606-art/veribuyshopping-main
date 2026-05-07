import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardAlias,
});

function AdminDashboardAlias() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/admin" });
  }, [navigate]);
  return null;
}
