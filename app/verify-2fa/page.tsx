"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function Verify2FA() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user should be on this page
    const temp2FA = sessionStorage.getItem("2fa_temp");
    const timestamp = sessionStorage.getItem("2fa_timestamp");
    
    if (!temp2FA) {
      router.push("/sign-in");
      return;
    }

    // Check if session expired (5 minutes)
    if (timestamp) {
      const elapsed = Date.now() - parseInt(timestamp);
      if (elapsed > 5 * 60 * 1000) {
        toast.error("Session expired. Please sign in again.");
        sessionStorage.clear();
        router.push("/sign-in");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code) {
      toast.error("Please enter a code");
      return;
    }

    setIsLoading(true);

    try {
      const email = sessionStorage.getItem("2fa_email");
      const password = sessionStorage.getItem("2fa_password");
      
      if (!email || !password) {
        toast.error("Session expired. Please sign in again.");
        router.push("/sign-in");
        return;
      }

      // Verify the 2FA code
      const response = await axios.post("/api/auth/verify-2fa-login", {
        email,
        code,
        isBackupCode: useBackupCode,
      });

      if (!response.data.success) {
        toast.error(response.data.message || "Invalid code");
        setIsLoading(false);
        return;
      }

      // 2FA verified - now complete the sign-in
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      // Clear session storage
      sessionStorage.removeItem("2fa_email");
      sessionStorage.removeItem("2fa_password");
      sessionStorage.removeItem("2fa_temp");
      sessionStorage.removeItem("2fa_timestamp");

      if (result?.error) {
        toast.error("Authentication failed");
        router.push("/sign-in");
      } else {
        toast.success("Signed in successfully!");
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("2FA verification error:", error);
      toast.error(error.response?.data?.message || "Invalid code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    sessionStorage.clear();
    router.push("/sign-in");
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-center">
            Enter the code from your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                {useBackupCode ? "Backup Code" : "Authentication Code"}
              </Label>
              <Input
                id="code"
                placeholder={useBackupCode ? "XXXX-XXXX-XXXX" : "000000"}
                value={code}
                onChange={(e) => {
                  if (useBackupCode) {
                    setCode(e.target.value.toUpperCase());
                  } else {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  }
                }}
                maxLength={useBackupCode ? 14 : 6}
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify"}
            </Button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setCode("");
                }}
                className="text-sm text-primary hover:underline"
                disabled={isLoading}
              >
                {useBackupCode
                  ? "Use authenticator code instead"
                  : "Use backup code instead"}
              </button>
              
              <div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-sm text-muted-foreground hover:text-primary"
                  disabled={isLoading}
                >
                  Back to sign in
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

