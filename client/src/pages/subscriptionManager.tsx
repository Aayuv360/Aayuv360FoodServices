import React from "react";
import { useQuery } from "@tanstack/react-query";
import Subscription from "./subscription";
import SubscriptionCRUD from "./subscriptionCRUD";

const SubscriptionManager = () => {
  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } =
    useQuery<any[]>({
      queryKey: ["/api/subscriptions"],
      queryFn: async () => {
        const res = await fetch("/api/subscriptions");
        if (!res.ok) throw new Error("Failed to fetch subscriptions");
        return res.json();
      },
    });

  if (isLoadingSubscriptions) return <div>Loading...</div>;

  const hasActiveSubscription = subscriptions.length > 0;

  return hasActiveSubscription ? (
    <SubscriptionCRUD previousPlansData={subscriptions} />
  ) : (
    <Subscription />
  );
};

export default SubscriptionManager;
