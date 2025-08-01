"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { toast } from "sonner";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setErrors({
          password: result.error,
        });
      } else {
        toast.success("Login successful!");
        router.push("/book-appointment");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error(`${provider} login error:`, error);
      toast.error(`${provider} login failed. Please try again.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e5814d6] flex flex-col">
      {/* Main Content */}
      <div className="min-h-screen bg-white flex flex-col">
        <div className="relative w-full h-[55vh] overflow-hidden rounded-b-lg">
          {/* Background Image */}
          <Image
            src="/images/loginbg.png"
            alt="Login Background"
            fill
            className="object-cover"
            priority
          />

          {/* Light Overlay */}
          <div className="absolute inset-0 bg-white/10 z-10" />

          {/* Text and Logo on Image */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-end text-center px-4 pb-32 md:pb-32 lg:pb-32">
            <div className="w-28 h-24 md:w-36 md:h-28  -mb-12">
              <Image
                src="/images/car.png"
                alt="Logo"
                width={140}
                height={112}
                className="object-contain mx-auto"
                priority
              />
            </div>

            <h1 className="text-white text-5xl md:text-5xl lg:text-7xl -mt-1 leading-none font-semibold">
              Get Started Now
            </h1>

            <p className="text-white/90 text-sm md:text-base max-w-sm mt-1">
              Create an account or log in to explore our app
            </p>
          </div>
        </div>

        <div className="-mt-16 px-4 pb-8 flex justify-center z-10">
          <Card className="w-full max-w-md mx-auto rounded-3xl md:rounded-2xl shadow-2xl z-10">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-black font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Type Here"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white placeholder-gray-400 transition-colors ${
                      errors.email ? "border-red-500" : ""
                    }`}
                    required
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-black font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Type Here"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className={`h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white placeholder-gray-400 transition-colors pr-12 ${
                        errors.password ? "border-red-500" : ""
                      }`}
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password}</p>
                  )}
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-[#0E5814] hover:bg-green-800 text-white rounded-full font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Login"}
                </Button>

                {/* Social Login */}
                {/* <div className="space-y-4">
                  {/* Horizontal Divider with Text 
                  <div className="flex items-center gap-1">
                    <hr className="flex-grow border-gray-300" />
                    <span className="text-black text-sm">
                      Or Social Login with
                    </span>
                    <hr className="flex-grow border-gray-300" />
                  </div> 

                  Social Login Buttons
                  <div className="flex justify-center gap-6">
                    {/* Google
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="w-16 h-12 rounded-xl border-gray-300 hover:bg-gray-100 bg-white"
                      onClick={() => handleSocialLogin("google")}
                      disabled={isLoading}
                    >
                      {/* Google Icon 
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </Button>

                    {/* Facebook *                   <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="w-16 h-12 rounded-xl border-gray-300 hover:bg-gray-100 bg-white"
                      onClick={() => handleSocialLogin("facebook")}
                      disabled={isLoading}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="#1877F2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.33l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </Button>

                    {/* Apple 
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="w-16 h-12 rounded-xl border-gray-300 hover:bg-gray-100 bg-white"
                      onClick={() => handleSocialLogin("apple")}
                      disabled={isLoading}
                    >
                      <svg className="w-5 h-5" fill="#000" viewBox="0 0 24 24">
                        <path d="M16.365 1.43c0 1.14-.68 2.27-1.66 3.02-.87.68-2.14 1.2-3.2 1.12a3.28 3.28 0 0 1-.02-.38c0-1.1.49-2.18 1.32-2.9C13.8 1.58 15.3.97 16.36 1.43zM21.84 17.34c-.63 1.54-1.32 2.99-2.4 4.58-1.09 1.61-2.6 3.23-4.5 3.08-1.58-.15-2.18-1.02-4.1-1.02-1.93 0-2.58.99-4.16 1.04-1.75.04-3.08-1.65-4.17-3.23C.99 18.3-.52 13.2 1.9 9.56 3.07 7.8 4.87 6.66 6.87 6.6c1.6-.05 3.12.99 4.1.99 1 0 2.82-1.23 4.76-1.05.81.03 3.08.33 4.55 2.5-3.86 2.11-3.25 7.64.56 8.3z" />
                      </svg>
                    </Button>

                    {/* Phone 
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="w-16 h-12 rounded-xl border-gray-300 hover:bg-gray-100 bg-white"
                      disabled={isLoading}
                    >
                      <svg className="w-5 h-5" fill="#000" viewBox="0 0 24 24">
                        <path d="M7.8 2l-.7.7-.8.8v5.1c0 3.3-.1 5.2-.2 5.2-.2 0-1.4-.7-2.7-1.5L2 11.2v6.3c0 5 0 6.3.1 6.3.1 0 1.4-.7 2.9-1.5l2.7-1.5.1 2.8c.1 1.5.2 2.8.3 2.8.1 0 .7-.3 1.4-.7l1.2-.7V2L7.8 2z" />
                      </svg>
                    </Button>
                  </div> 
                </div> */}

                {/* Sign Up Link */}
                <div className="text-center pt-1">
                  <p className="text-black text-sm">
                    Don't have an account?{" "}
                    <Link
                      href="/signup"
                      className="text-green-700 font-semibold hover:text-green-800"
                    >
                      Sign Up
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
