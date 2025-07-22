import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OtpLoginFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

export default function OtpLoginForm({ onSuccess, onBack }: OtpLoginFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const handleSendOtp = () => {
    const indianPhoneRegex = /^[6-9]\d{9}$/;

    if (!indianPhoneRegex.test(phoneNumber)) {
      alert("Please enter a valid 10-digit Indian phone number.");
      return;
    }

    const formattedPhoneNumber = `+91${phoneNumber}`;

    setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    onSuccess();
  };

  return (
    <div className="space-y-4">
      {!otpSent ? (
        <>
          <Input
            placeholder="Enter your phone number"
            value={phoneNumber}
            maxLength={10}
            onChange={(e) => {
              const onlyDigits = e.target.value.replace(/\D/g, "");
              setPhoneNumber(onlyDigits);
            }}
          />
          <Button onClick={handleSendOtp} className="w-full">
            Send OTP
          </Button>
        </>
      ) : (
        <>
          <Input
            placeholder="Enter the OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <Button onClick={handleVerifyOtp} className="w-full">
            Verify & Login
          </Button>
        </>
      )}
      <Button variant="link" className="w-full !p-0" onClick={onBack}>
        Back to Login
      </Button>
    </div>
  );
}
