import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/seller-requests")({
  component: AdminSellerRequestsAlias,
});

function AdminSellerRequestsAlias() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/admin/sellers" });
  }, [navigate]);

  return null;
}
