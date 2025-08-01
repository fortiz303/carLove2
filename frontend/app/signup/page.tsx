"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    countryCode: "+62",
    password: "",
    confirmPassword: "",
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
      const phone = formData.countryCode + formData.phoneNumber;
      const response = await apiService.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone,
      });

      if (response.success) {
        toast.success("Registration successful! Welcome to CARLOVE!");
        // Redirect to login page after successful registration
        router.push("/login");
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Status Bar - Mobile Only */}
      {/* <div className="flex justify-between items-center px-4 py-2 text-gray-900 text-sm font-medium md:hidden">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
          <div className="ml-2 text-xs">📶 📶 📶</div>
          <div className="ml-1 text-xs">🔋</div>
        </div>
      </div> */}

      {/* Back Button */}
      <div className="flex items-center p-4 md:p-6">
        <Link href="/login">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Centered Card */}
      <div className="flex-grow flex items-center justify-center px-4 py-4 md:px-6 md:py-6">
        <div className="max-w-md w-full mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-4xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4 tracking-tight">
              Sign Up
            </h1>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Sign up in seconds to book your first car detailing
              appointment—fast, easy, and hassle-free.
            </p>
          </div>

          {/* Card */}
          <Card className="rounded-2xl shadow-lg border-0">
            <CardContent className="p-4 md:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="fullName"
                    className="text-gray-700 font-medium"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Type Here"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className={`h-12 rounded-xl border-gray-200 bg-gray-50 placeholder-gray-400 focus:bg-white transition-colors ${
                      errors.fullName ? "border-red-500" : ""
                    }`}
                    required
                    disabled={isLoading}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm">{errors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
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
                    className={`h-12 rounded-xl border-gray-200 bg-gray-50 placeholder-gray-400 focus:bg-white transition-colors ${
                      errors.email ? "border-red-500" : ""
                    }`}
                    required
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <Label
                    htmlFor="phoneNumber"
                    className="text-gray-700 font-medium"
                  >
                    Phone Number
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.countryCode}
                      onValueChange={(value) =>
                        setFormData({ ...formData, countryCode: value })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-24 h-12 rounded-xl border-gray-200 bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+62">🇮🇩 +62</SelectItem>
                        <SelectItem value="+1">🇺🇸 +1</SelectItem>
                        <SelectItem value="+44">🇬🇧 +44</SelectItem>
                        <SelectItem value="+91">🇮🇳 +91</SelectItem>
                        <SelectItem value="+86">🇨🇳 +86</SelectItem>
                        <SelectItem value="+49">🇩🇪 +49</SelectItem>
                        <SelectItem value="+33">🇫🇷 +33</SelectItem>
                        <SelectItem value="+81">🇯🇵 +81</SelectItem>
                        <SelectItem value="+82">🇰🇷 +82</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="XXXXXXXXXXX"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value,
                        })
                      }
                      className={`flex-1 h-12 rounded-xl border-gray-200 bg-gray-50 placeholder-gray-400 focus:bg-white transition-colors ${
                        errors.phoneNumber ? "border-red-500" : ""
                      }`}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-sm">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <Label
                    htmlFor="password"
                    className="text-gray-700 font-medium"
                  >
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
                      className={`h-12 rounded-xl border-gray-200 bg-gray-50 placeholder-gray-400 focus:bg-white transition-colors pr-12 ${
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

                {/* Confirm Password */}
                <div className="space-y-1">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-gray-700 font-medium"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Type Here"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className={`h-12 rounded-xl border-gray-200 bg-gray-50 placeholder-gray-400 focus:bg-white transition-colors pr-12 ${
                        errors.confirmPassword ? "border-red-500" : ""
                      }`}
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Register Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-[#0E5814] hover:bg-green-800 text-white rounded-full font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200 mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Register"}
                </Button>

                {/* Login Link */}
                <div className="text-center pt-4">
                  <p className="text-gray-600 text-sm">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="text-green-700 font-semibold hover:text-green-800"
                    >
                      Login
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
