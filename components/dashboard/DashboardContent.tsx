"use client";

import OrdersTable from "@/components/dashboard/OrdersTable";
import { useNavStore } from "@/lib/stores/nav";

export default function DashboardContent() {
  const section = useNavStore((s) => s.activeSection);

  if (section === "orders") {
    return <OrdersTable />;
  }

  if (section === "menu") {
    return <UnderConstruction label="Menu" />;
  }

  if (section === "support") {
    return <UnderConstruction label="Support" />;
  }

  if (section === "drivers") {
    return <UnderConstruction label="Drivers" />;
  }

  return null;
}

function UnderConstruction({ label }: { label: string }) {
  return (
    <div className="rounded-md border p-6 text-sm text-muted-foreground">
      {label} is under construction.
    </div>
  );
}


