import React, { useState, useEffect } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useDiscountAndDeliverySettings,
  updateDiscountAndDeliverySettings,
} from "@/hooks/use-commonServices";

interface DeliverySettings {
  baseFee?: number;
  extraPerKm?: number;
  peakCharge?: number;
  freeDeliveryThreshold?: number;
}

interface DiscountSettings {
  flatDiscount?: number;
  minOrderValue?: number;
}

interface TaxSettings {
  gstPercent?: number;
  serviceTax?: number;
}

interface FeeSettings {
  smallOrderFee?: number;
  packagingFee?: number;
}

interface Settings {
  delivery?: DeliverySettings;
  discount?: DiscountSettings;
  tax?: TaxSettings;
  fees?: FeeSettings;
}

const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tempSettings, setTempSettings] = useState<Settings | null>(null);
  const [editSection, setEditSection] = useState<keyof Settings | null>(null);

  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useDiscountAndDeliverySettings();

  const mutation = useMutation({
    mutationFn: updateDiscountAndDeliverySettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/DiscountAndDeliverySettings"],
      });
    },
    onError: () => {
      //
    },
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
      setTempSettings(data);
    }
  }, [data]);

  const handleChange = (
    section: keyof Settings,
    field: string,
    value: number,
  ) => {
    setTempSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev?.[section],
        [field]: value,
      },
    }));
  };

  const handleSave = (section: keyof Settings) => {
    const newSettings = {
      ...settings,
      [section]: tempSettings?.[section],
    };
    setSettings(newSettings);
    setEditSection(null);
    mutation.mutate(newSettings);
  };

  const handleCancel = (section: keyof Settings) => {
    setTempSettings((prev) => ({
      ...prev,
      [section]: settings?.[section],
    }));
    setEditSection(null);
  };

  const handleEdit = (section: keyof Settings) => {
    setTempSettings(settings);
    setEditSection(section);
  };

  const renderSection = (section: keyof Settings, fields: string[]) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 capitalize text-gray-800">
        {section} Settings
      </h2>
      {editSection === section ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {fields.map((key) => (
            <div key={key} className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {key.replace(/([A-Z])/g, " $1")}
              </label>
              <input
                type="number"
                value={(tempSettings?.[section]?.[key] as number) ?? ""}
                onChange={(e) => handleChange(section, key, +e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Enter ${key.replace(/([A-Z])/g, " $1")}`}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-base space-y-2 text-gray-700">
          {fields.map((key) => (
            <div key={key} className="flex justify-between items-center">
              <span className="font-medium capitalize">
                {key.replace(/([A-Z])/g, " $1")}:
              </span>
              <span className="text-gray-900 font-semibold">
                ₹{(settings?.[section]?.[key] as number) ?? "N/A"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end space-x-3 mt-6">
        {editSection === section ? (
          <>
            <button
              onClick={() => handleCancel(section)}
              className="px-5 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(section)}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-sm"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save"}
            </button>
          </>
        ) : (
          <button
            onClick={() => handleEdit(section)}
            className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200 shadow-sm"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-600">Loading settings...</div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-red-600">
        Failed to load settings.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-800">Admin Settings</h1>

        {renderSection("delivery", [
          "baseFee",
          "extraPerKm",
          "peakCharge",
          "freeDeliveryThreshold",
        ])}

        {renderSection("discount", ["flatDiscount", "minOrderValue"])}

        {renderSection("tax", ["gstPercent", "serviceTax"])}

        {renderSection("fees", ["smallOrderFee", "packagingFee"])}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
