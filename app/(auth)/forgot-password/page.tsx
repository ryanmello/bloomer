"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Mail, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Flower from "@/public/flower.png";
import axios from "axios";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const router = useRouter();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    console.log("handleSubmit called with:", values);
    setIsLoading(true);
    setError("");
    setSuccess(false);
    setDevResetUrl(null);

    try {
      console.log("Submitting forgot password request for:", values.email);
      const response = await axios.post("/api/auth/forgot-password", {
        email: values.email,
      });

      console.log("Response received:", response.status, response.data);

      if (response.status === 200) {
        setSuccess(true);
        if (response.data?.devResetUrl) {
          setDevResetUrl(response.data.devResetUrl);
        }
        console.log("Success! Showing success message");
      } else {
        setError(response.data.message || "Failed to send reset email");
      }
    } catch (error: any) {
      console.error("Error in forgot password:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "An error occurred. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <Card className="backdrop-blur-xl bg-card/80 border-border shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-background border border-border shadow-lg flex items-center justify-center">
                <Image src={Flower} alt="Bloomer" width="32" height="32" />
              </div>
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">
                Forgot Password?
              </CardTitle>
              <CardDescription className="text-base">
                Enter your email address and we'll send you a link to reset your
                password
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {success ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    If an account exists with this email, a password reset link
                    has been sent. Please check your inbox.
                  </p>
                </div>
                {devResetUrl && (
                  <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Dev mode: email provider not configured. Use this reset link:
                    </p>
                    <a
                      className="mt-2 inline-block break-all text-sm font-medium text-primary hover:underline"
                      href={devResetUrl}
                    >
                      {devResetUrl}
                    </a>
                  </div>
                )}
                <Button
                  onClick={() => router.push("/sign-in")}
                  className="w-full h-12"
                  variant="outline"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-4"
                >
                  {/* Email Input */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="Email"
                              disabled={isLoading}
                              className="pl-11 h-12 bg-muted/50 border-border focus:bg-background transition-all"
                              {...field}
                              value={field.value || ""}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Error Message */}
                  {error && (
                    <div className="text-destructive text-sm text-center bg-destructive/10 border border-destructive/30 rounded-lg py-2 px-3">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base shadow-lg hover:shadow-xl transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col items-center space-y-4 pt-2 pb-6">
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
