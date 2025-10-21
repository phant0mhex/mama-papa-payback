import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DebtSetup } from "@/components/DebtSetup";
import { DebtDashboard } from "@/components/DebtDashboard";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

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
    // Remplacer le texte par des Skeletons
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-background to-secondary/20">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-1/2 mb-4" /> {/* Placeholder titre */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <Skeleton className="h-20 w-full" /> {/* Placeholder Progress */}
          <Skeleton className="h-80 w-full" /> {/* Placeholder Stats/Chart */}
          <Skeleton className="h-12 w-full" /> {/* Placeholder Button */}
          <Skeleton className="h-60 w-full" /> {/* Placeholder History */}
        </div>
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
