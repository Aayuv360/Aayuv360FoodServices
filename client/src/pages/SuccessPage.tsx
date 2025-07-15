import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

type ActionType = "modify" | "upgrade" | "renew" | "subscribed";

type MenuItem = {
  day: number;
  main: string;
  sides: string[];
  _id: string;
};

type Subscription = {
  plan: string;
  dietaryPreference: string;
  startDate: string;
  endDate: string;
  timeSlot: string;
  mealsPerMonth: number;
  daysRemaining: number;
  menuItems: MenuItem[];
};

export default function SuccessPage() {
  const { type } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/subscriptions");
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      return res.json();
    },
    enabled: !!user,
  });

  const subscription = subscriptions[0];

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f97316", "#facc15", "#34d399", "#60a5fa", "#f472b6"],
    });
  }, []);

  const messageMap: Record<ActionType, { title: string; message: string }> = {
    modify: {
      title: "Plan Modified Successfully",
      message: "Your subscription has been modified successfully.",
    },
    upgrade: {
      title: "Upgrade Successful",
      message: "Your plan has been upgraded successfully.",
    },
    renew: {
      title: "Renewal Successful",
      message: "Your subscription has been renewed.",
    },
    subscribed: {
      title: "Subscription Successful",
      message:
        "Thank you! Your subscription was successful and meals are on the way.",
    },
  };

  const content = messageMap[
    (type?.toLowerCase() as ActionType) ?? "subscribed"
  ] ?? {
    title: "Payment Successful",
    message: "Your subscription has been activated successfully.",
  };

  return (
    <div className="min-h-[57.5vh] bg-white flex flex-col justify-center items-center p-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <CheckCircle className="text-orange-500 w-16 h-16 mb" />
      </motion.div>

      <motion.h1
        className="text-2xl font-bold text-gray-900 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {content.title}
      </motion.h1>

      <motion.p
        className="text-base text-gray-700 text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {content.message}
      </motion.p>

      {subscription && (
        <motion.div
          className="w-full max-w-7xl bg-gray-50 rounded-xl shadow-md p-6 my-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Plan Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
            <p>
              <strong>Plan:</strong> {subscription.plan}
            </p>
            <p>
              <strong>Plan Diet:</strong> {subscription.dietaryPreference}
            </p>
            <p>
              <strong>Start Date:</strong>{" "}
              {format(new Date(subscription.startDate), "dd MMM yyyy")}
            </p>
            <p>
              <strong>End Date:</strong>{" "}
              {format(new Date(subscription.endDate), "dd MMM yyyy")}
            </p>
            <p>
              <strong>Time Slot:</strong> {subscription.timeSlot}
            </p>
            <p>
              <strong>Meals/Day:</strong>{" "}
              {Math.floor(subscription.mealsPerMonth / 30)}
            </p>
            <p>
              <strong>Days Remaining:</strong> {subscription.daysRemaining}
            </p>
          </div>

          <div className="mt-4">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-1 text-orange-600 font-medium"
            >
              {showMenu ? "Hide Menu Items" : "Show Menu Items"}
              {showMenu ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showMenu && (
              <motion.ul
                className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {subscription.menuItems.map((meal, index) => {
                  const deliveryDate = new Date(subscription.startDate);
                  deliveryDate.setDate(deliveryDate.getDate() + (meal.day - 1));

                  return (
                    <li
                      key={meal._id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 rounded-full w-7 h-7 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {meal.day}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">
                            {format(deliveryDate, "MMM d")}
                          </span>
                        </div>
                      </div>

                      <div className="bg-orange-50 rounded-lg p-3">
                        <h4 className="font-semibold text-primary mb-1 text-sm">
                          {meal.main}
                        </h4>
                        {meal.sides?.length > 0 && (
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Sides:</span>{" "}
                            {meal.sides.join(", ")}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </motion.ul>
            )}
          </div>
        </motion.div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <motion.button
          className="bg-orange-500 text-white px-6 py-3 rounded-full hover:bg-orange-600 transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={() => navigate("/profile?tab=subscriptions")}
        >
          View My Subscriptions
        </motion.button>
        <motion.button
          className="bg-orange-500 text-white px-6 py-3 rounded-full hover:bg-orange-600 transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={() => navigate("/")}
        >
          Return to Home
        </motion.button>
      </div>
    </div>
  );
}
