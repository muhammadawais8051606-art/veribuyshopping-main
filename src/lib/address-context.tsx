import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export type CustomerAddress = {
  id: string;
  label: string;
  full_name: string;
  phone: string | null;
  house_number: string | null;
  street: string | null;
  sector: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
};

type AddressContextValue = {
  addresses: CustomerAddress[];
  defaultAddress: CustomerAddress | null;
  activeAddressId: string | null;
  setActiveAddressId: (id: string) => void;
  refreshAddresses: () => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  addressSummary: string;
};

const AddressContext = createContext<AddressContextValue | undefined>(undefined);

export function AddressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tableName, setTableName] = useState<string>("addresses");
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [activeAddressId, setActiveAddressId] = useState<string | null>(null);

  const refreshAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      setActiveAddressId(null);
      return;
    }
    let { data, error } = await supabase
      .from(tableName)
      .select("id, label, full_name, phone, house_number, street, sector, line1, line2, city, state, postal_code, country, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });
    if (error && tableName !== "customer_addresses") {
      const fallback = await supabase
        .from("customer_addresses")
        .select("id, label, full_name, phone, house_number, street, sector, line1, line2, city, state, postal_code, country, is_default")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      data = fallback.data;
      error = fallback.error;
      if (!error) setTableName("customer_addresses");
    }

    const list = (data ?? []) as CustomerAddress[];
    setAddresses(list);
    setActiveAddressId((prev) => prev ?? list.find((a) => a.is_default)?.id ?? list[0]?.id ?? null);
  }, [tableName, user]);

  useEffect(() => {
    void refreshAddresses();
  }, [refreshAddresses]);

  const setDefaultAddress = useCallback(
    async (id: string) => {
      if (!user) return;
      let clearRes = await supabase.from(tableName).update({ is_default: false }).eq("user_id", user.id);
      let setRes = await supabase.from(tableName).update({ is_default: true }).eq("id", id);
      if ((clearRes.error || setRes.error) && tableName !== "customer_addresses") {
        clearRes = await supabase.from("customer_addresses").update({ is_default: false }).eq("user_id", user.id);
        setRes = await supabase.from("customer_addresses").update({ is_default: true }).eq("id", id);
        if (!clearRes.error && !setRes.error) setTableName("customer_addresses");
      }
      setActiveAddressId(id);
      await refreshAddresses();
    },
    [refreshAddresses, tableName, user],
  );

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.is_default) ?? addresses.find((a) => a.id === activeAddressId) ?? null,
    [addresses, activeAddressId],
  );

  const addressSummary = (() => {
    if (!defaultAddress) return "Set Location";
    const parts = [defaultAddress.line1, defaultAddress.city, defaultAddress.state].filter(Boolean);
    const raw = parts.join(", ").trim() || `${defaultAddress.city} ${defaultAddress.postal_code ?? ""}`.trim();
    const shortened = raw.length > 32 ? `${raw.slice(0, 28).trimEnd()}...` : raw;
    return `Deliver to ${shortened}`;
  })();

  return (
    <AddressContext.Provider
      value={{
        addresses,
        defaultAddress,
        activeAddressId,
        setActiveAddressId,
        refreshAddresses,
        setDefaultAddress,
        addressSummary,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
}

export function useAddress() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error("useAddress must be used within AddressProvider");
  return ctx;
}

