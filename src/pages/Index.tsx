import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DebtSetup } from "@/components/DebtSetup";
import { DebtDashboard } from "@/components/DebtDashboard";

const Index = () => {
  const [hasDebt, setHasDebt] = useState<boolean | null>(null);

  useEffect(() => {
    checkForDebt();
  }, []);

  const checkForDebt = async () => {
    try {
      const { data, error } = await supabase
        .from("debt")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking for debt:", error);
      }

      setHasDebt(!!data);
    } catch (error) {
      console.error("Error checking for debt:", error);
      setHasDebt(false);
    }
  };

  if (hasDebt === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return hasDebt ? (
    <DebtDashboard />
  ) : (
    <DebtSetup onDebtCreated={checkForDebt} />
  );
};

export default Index;
