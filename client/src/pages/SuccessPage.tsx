import React, { useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useLocation } from "wouter";

export default function SuccessPage() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: [
        "#f97316", // orange-500
        "#facc15", // yellow-400
        "#34d399", // green-400
        "#60a5fa", // blue-400
        "#f472b6", // pink-400
      ],
    });
  }, []);

  return (
    <div className="min-h-[57.5vh] bg-white flex flex-col justify-center items-center p-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <CheckCircle className="text-orange-500 w-20 h-20 mb-6" />
      </motion.div>

      <motion.h1
        className="text-3xl font-bold text-gray-900 mb-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        Payment Successful
      </motion.h1>

      <motion.p
        className="text-lg text-gray-700 mb-8 text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        Your subscription has been activated successfully! Your millet meals
        will be delivered according to your schedule.
      </motion.p>

      <div className="flex flex-wrap justify-center gap-3">
        <motion.button
          className="bg-orange-500 text-white px-6 py-3 rounded-full hover:bg-orange-600 transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={() => setLocation("/profile?tab=subscriptions")}
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
          onClick={() => setLocation("/")}
        >
          Return to Home
        </motion.button>
        <motion.button
          className="bg-orange-500 text-white px-6 py-3 rounded-full hover:bg-orange-600 transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          onClick={() => setLocation("/menu")}
        >
          Explore Menu
        </motion.button>
      </div>
    </div>
  );
}
