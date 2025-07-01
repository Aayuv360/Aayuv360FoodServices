import React from "react";
import { useQuery } from "@tanstack/react-query";
import Subscription from "./subscription";
import SubscriptionCRUD from "./subscriptionCRUD";
import { useAuth } from "@/hooks/use-auth";
import { Loader } from "lucide-react";

const SubscriptionManager = () => {
  const { user } = useAuth();
  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } =
    useQuery<any[]>({
      queryKey: ["/api/subscriptions"],
      queryFn: async () => {
        const res = await fetch("/api/subscriptions");
        if (!res.ok) {
          throw new Error("Failed to fetch subscriptions");
        }
        return res.json();
      },

      enabled: !!user,
    });
  const hasActiveSubscription = user && subscriptions.length > 0;

  return isLoadingSubscriptions ? (
    <div className="flex items-center justify-center h-screen">
      <Loader className="animate-spin w-8 h-8 text-primary" />
    </div>
  ) : (
    <>
      {hasActiveSubscription ? (
        <SubscriptionCRUD previousPlansData={subscriptions} />
      ) : (
        <Subscription />
      )}
    </>
  );
};

export default SubscriptionManager;
