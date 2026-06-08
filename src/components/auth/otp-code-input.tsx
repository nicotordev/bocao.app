"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface OtpCodeInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpCodeInput({
  id,
  value,
  onChange,
  disabled = false,
  autoFocus = false,
}: OtpCodeInputProps) {
  return (
    <div className="flex justify-center">
      <InputOTP
        id={id}
        maxLength={6}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoFocus={autoFocus}
        inputMode="numeric"
        autoComplete="one-time-code"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSeparator />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
