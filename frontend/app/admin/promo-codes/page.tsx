"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

interface PromoCode {
  _id: string;
  code: string;
  name: string;
  description?: string;
  type: "percentage" | "fixed";
  value: number;
  minimumOrderAmount: number;
  maximumDiscountAmount?: number;
  maxUsage?: number;
  maxUsagePerUser: number;
  currentUsage: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicableServices: Array<{ _id: string; name: string }>;
  applicableUsers: Array<{ _id: string; fullName: string; email: string }>;
  excludedUsers: Array<{ _id: string; fullName: string; email: string }>;
  createdBy: { _id: string; fullName: string };
  createdAt: string;
  updatedAt: string;
}

interface PromoCodeStats {
  totalPromoCodes: number;
  activePromoCodes: number;
  expiredPromoCodes: number;
  topUsedPromoCodes: Array<{
    code: string;
    name: string;
    currentUsage: number;
  }>;
  totalDiscount: number;
}

export default function AdminPromoCodes() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [stats, setStats] = useState<PromoCodeStats | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (session?.accessToken) {
      fetchPromoCodes();
      fetchStats();
    }
  }, [session?.accessToken, search, statusFilter, typeFilter, page]);

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      });

      const response = await apiService.getPromoCodes(
        session!.accessToken,
        params.toString()
      );
      if (response.success) {
        setPromoCodes(response.data.promoCodes);
        setTotalPages(response.data.pagination.pages);
      } else {
        toast.error(response.message || "Failed to fetch promo codes");
      }
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      toast.error("Failed to fetch promo codes");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.getPromoCodeStats(session!.accessToken);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;

    try {
      const response = await apiService.deletePromoCode(
        id,
        session!.accessToken
      );
      if (response.success) {
        toast.success("Promo code deleted successfully");
        fetchPromoCodes();
        fetchStats();
      } else {
        toast.error(response.message || "Failed to delete promo code");
      }
    } catch (error) {
      console.error("Error deleting promo code:", error);
      toast.error("Failed to delete promo code");
    }
  };

  const getStatusBadge = (promoCode: PromoCode) => {
    const now = new Date();
    const validFrom = new Date(promoCode.validFrom);
    const validUntil = new Date(promoCode.validUntil);

    if (!promoCode.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (now < validFrom) {
      return <Badge variant="outline">Pending</Badge>;
    }

    if (now > validUntil) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    if (promoCode.maxUsage && promoCode.currentUsage >= promoCode.maxUsage) {
      return <Badge variant="destructive">Usage Limit Reached</Badge>;
    }

    return <Badge variant="default">Active</Badge>;
  };

  const formatValue = (promoCode: PromoCode) => {
    if (promoCode.type === "percentage") {
      return `${promoCode.value}%`;
    } else {
      return `$${(promoCode.value / 100).toFixed(2)}`;
    }
  };

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  if (loading && promoCodes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading promo codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-3xl font-bold mb-2">
                Promo Codes
              </h1>
              <p className="text-white/90">
                Manage discount codes and promotions
              </p>
            </div>
            <Link href="/admin">
              <Button
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-green-600"
              >
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Total Promo Codes
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalPromoCodes}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Active Promo Codes
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.activePromoCodes}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Expired Promo Codes
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.expiredPromoCodes}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Total Discount Given
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${stats.totalDiscount.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        <Card className="rounded-2xl shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search promo codes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* <SelectItem value="">All Status</SelectItem> */}
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* <SelectItem value="">All Types</SelectItem> */}
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Promo Code
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Promo Code</DialogTitle>
                  </DialogHeader>
                  <PromoCodeForm
                    onSuccess={() => {
                      setIsDialogOpen(false);
                      fetchPromoCodes();
                      fetchStats();
                    }}
                    accessToken={session!.accessToken}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Promo Codes Table */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Promo Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((promoCode) => (
                    <TableRow key={promoCode._id}>
                      <TableCell className="font-mono font-medium">
                        {promoCode.code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{promoCode.name}</p>
                          {promoCode.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {promoCode.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            promoCode.type === "percentage"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {promoCode.type === "percentage"
                            ? "Percentage"
                            : "Fixed Amount"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatValue(promoCode)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{promoCode.currentUsage} used</p>
                          {promoCode.maxUsage && (
                            <p className="text-gray-500">
                              of {promoCode.maxUsage}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>
                            {new Date(
                              promoCode.validUntil
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-gray-500">
                            {new Date(
                              promoCode.validUntil
                            ).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(promoCode)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPromoCode(promoCode)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPromoCode(promoCode);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(promoCode._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Promo Code Detail Dialog */}
        {selectedPromoCode && (
          <Dialog
            open={!!selectedPromoCode}
            onOpenChange={() => setSelectedPromoCode(null)}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Promo Code Details</DialogTitle>
              </DialogHeader>
              <PromoCodeDetail promoCode={selectedPromoCode} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

// Promo Code Form Component
function PromoCodeForm({
  onSuccess,
  accessToken,
  editPromoCode,
}: {
  onSuccess: () => void;
  accessToken: string;
  editPromoCode?: PromoCode;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: editPromoCode?.code || "",
    name: editPromoCode?.name || "",
    description: editPromoCode?.description || "",
    type: editPromoCode?.type || "percentage",
    value:
      editPromoCode?.type === "fixed"
        ? editPromoCode.value / 100
        : editPromoCode?.value || 0,
    minimumOrderAmount: editPromoCode?.minimumOrderAmount
      ? editPromoCode.minimumOrderAmount / 100
      : 0,
    maximumDiscountAmount: editPromoCode?.maximumDiscountAmount
      ? editPromoCode.maximumDiscountAmount / 100
      : 0,
    maxUsage: editPromoCode?.maxUsage || 0,
    maxUsagePerUser: editPromoCode?.maxUsagePerUser || 1,
    validFrom: editPromoCode?.validFrom
      ? new Date(editPromoCode.validFrom).toISOString().split("T")[0]
      : "",
    validUntil: editPromoCode?.validUntil
      ? new Date(editPromoCode.validUntil).toISOString().split("T")[0]
      : "",
    isActive: editPromoCode?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        value: formData.type === "fixed" ? formData.value : formData.value,
        minimumOrderAmount: formData.minimumOrderAmount,
        maximumDiscountAmount: formData.maximumDiscountAmount || null,
        maxUsage: formData.maxUsage || null,
        validFrom: new Date(formData.validFrom),
        validUntil: new Date(formData.validUntil),
      };

      let response;
      if (editPromoCode) {
        response = await apiService.updatePromoCode(
          editPromoCode._id,
          data,
          accessToken
        );
      } else {
        response = await apiService.createPromoCode(data, accessToken);
      }

      if (response.success) {
        toast.success(
          editPromoCode
            ? "Promo code updated successfully"
            : "Promo code created successfully"
        );
        onSuccess();
      } else {
        toast.error(response.message || "Failed to save promo code");
      }
    } catch (error) {
      console.error("Error saving promo code:", error);
      toast.error("Failed to save promo code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Code</label>
          <Input
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            placeholder="SAVE20"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Summer Sale"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Input
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Optional description"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Type</label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                type: value as "percentage" | "fixed",
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Value {formData.type === "percentage" ? "(%)" : "($)"}
          </label>
          <Input
            type="number"
            value={formData.value}
            onChange={(e) =>
              setFormData({
                ...formData,
                value: parseFloat(e.target.value) || 0,
              })
            }
            min="0"
            max={formData.type === "percentage" ? "100" : undefined}
            step={formData.type === "percentage" ? "1" : "0.01"}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Minimum Order Amount ($)
          </label>
          <Input
            type="number"
            value={formData.minimumOrderAmount}
            onChange={(e) =>
              setFormData({
                ...formData,
                minimumOrderAmount: parseFloat(e.target.value) || 0,
              })
            }
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Maximum Discount Amount ($)
          </label>
          <Input
            type="number"
            value={formData.maximumDiscountAmount}
            onChange={(e) =>
              setFormData({
                ...formData,
                maximumDiscountAmount: parseFloat(e.target.value) || 0,
              })
            }
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Max Usage (0 = unlimited)
          </label>
          <Input
            type="number"
            value={formData.maxUsage}
            onChange={(e) =>
              setFormData({
                ...formData,
                maxUsage: parseInt(e.target.value) || 0,
              })
            }
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Max Usage Per User
          </label>
          <Input
            type="number"
            value={formData.maxUsagePerUser}
            onChange={(e) =>
              setFormData({
                ...formData,
                maxUsagePerUser: parseInt(e.target.value) || 1,
              })
            }
            min="1"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Valid From</label>
          <Input
            type="date"
            value={formData.validFrom}
            onChange={(e) =>
              setFormData({ ...formData, validFrom: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Valid Until</label>
          <Input
            type="date"
            value={formData.validUntil}
            onChange={(e) =>
              setFormData({ ...formData, validUntil: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) =>
            setFormData({ ...formData, isActive: e.target.checked })
          }
          className="rounded"
        />
        <label htmlFor="isActive" className="text-sm font-medium">
          Active
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {editPromoCode ? "Update" : "Create"} Promo Code
        </Button>
      </div>
    </form>
  );
}

// Promo Code Detail Component
function PromoCodeDetail({ promoCode }: { promoCode: PromoCode }) {
  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatValue = (promoCode: PromoCode) => {
    if (promoCode.type === "percentage") {
      return `${promoCode.value}%`;
    } else {
      return `$${(promoCode.value / 100).toFixed(2)}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Basic Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Code:</span>
              <span className="font-mono font-medium">{promoCode.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span>{promoCode.name}</span>
            </div>
            {promoCode.description && (
              <div className="flex justify-between">
                <span className="text-gray-600">Description:</span>
                <span>{promoCode.description}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span>
                {promoCode.type === "percentage"
                  ? "Percentage"
                  : "Fixed Amount"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Value:</span>
              <span className="font-medium">{formatValue(promoCode)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Usage & Limits</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Usage:</span>
              <span>{promoCode.currentUsage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Usage:</span>
              <span>{promoCode.maxUsage || "Unlimited"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Per User:</span>
              <span>{promoCode.maxUsagePerUser}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Min Order Amount:</span>
              <span>{formatAmount(promoCode.minimumOrderAmount)}</span>
            </div>
            {promoCode.maximumDiscountAmount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Max Discount:</span>
                <span>{formatAmount(promoCode.maximumDiscountAmount)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Validity Period</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Valid From:</span>
            <span>{new Date(promoCode.validFrom).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Valid Until:</span>
            <span>{new Date(promoCode.validUntil).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span
              className={promoCode.isActive ? "text-green-600" : "text-red-600"}
            >
              {promoCode.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {promoCode.applicableServices.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Applicable Services</h3>
          <div className="flex flex-wrap gap-2">
            {promoCode.applicableServices.map((service) => (
              <Badge key={service._id} variant="outline">
                {service.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        Created by {promoCode.createdBy.fullName} on{" "}
        {new Date(promoCode.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
