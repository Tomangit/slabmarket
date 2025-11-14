
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { AlertCircle, CheckCircle, Clock, XCircle, Eye, User, DollarSign } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { disputeService, type DisputeWithRelations } from "@/services/disputeService";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SupportDisputesPage() {
  const router = useRouter();
  const t = useTranslations();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [disputes, setDisputes] = useState<DisputeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<DisputeWithRelations | null>(null);
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isModerator = profile?.role === "moderator" || profile?.role === "admin";

  // Debug logging
  useEffect(() => {
    console.log("Support Disputes Page Debug:", {
      user: user?.id,
      profile: profile ? { id: profile.id, role: profile.role } : null,
      authLoading,
      isModerator,
    });
  }, [user, profile, authLoading, isModerator]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log("No user, redirecting to signin");
        router.push("/auth/signin");
        return;
      }
      // If profile is null, try to load it manually
      if (profile === null) {
        console.log("Profile is null, trying to load manually...");
        const loadProfileManually = async () => {
          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .single();
            
            if (error) {
              console.error("Error loading profile:", error);
            } else {
              console.log("Profile loaded manually:", data);
              // Force refresh by reloading the page or calling refreshProfile
              window.location.reload();
            }
          } catch (err) {
            console.error("Error in loadProfileManually:", err);
          }
        };
        loadProfileManually();
        return;
      }
      if (profile && !isModerator) {
        console.log("User is not moderator, role:", profile.role);
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        router.push("/dashboard");
        return;
      }
      if (isModerator) {
        console.log("User is moderator, loading disputes");
        loadDisputes();
      }
    }
  }, [user, profile, authLoading, filter, isModerator]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filter !== "all") {
        filters.status = filter;
      }
      const data = await disputeService.getAllDisputes(filters);
      setDisputes(data || []);
    } catch (error) {
      console.error("Error loading disputes:", error);
      toast({
        title: "Error",
        description: "Failed to load disputes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToMe = async (disputeId: string) => {
    if (!user) return;
    
    try {
      await disputeService.assignModerator(disputeId, user.id);
      toast({
        title: "Dispute assigned",
        description: "You have been assigned to this dispute",
      });
      await loadDisputes();
    } catch (error) {
      console.error("Error assigning dispute:", error);
      toast({
        title: "Error",
        description: "Failed to assign dispute",
        variant: "destructive",
      });
    }
  };

  const handleResolve = async () => {
    if (!user || !selectedDispute || !resolution.trim()) return;

    try {
      setSubmitting(true);
      await disputeService.resolveDispute(selectedDispute.id, resolution, user.id);
      toast({
        title: "Dispute resolved",
        description: "The dispute has been resolved",
      });
      setResolutionDialogOpen(false);
      setSelectedDispute(null);
      setResolution("");
      await loadDisputes();
    } catch (error) {
      console.error("Error resolving dispute:", error);
      toast({
        title: "Error",
        description: "Failed to resolve dispute",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (disputeId: string) => {
    try {
      await disputeService.closeDispute(disputeId);
      toast({
        title: "Dispute closed",
      });
      await loadDisputes();
    } catch (error) {
      console.error("Error closing dispute:", error);
      toast({
        title: "Error",
        description: "Failed to close dispute",
        variant: "destructive",
      });
    }
  };

  // Prevent hydration mismatch by not rendering until client-side
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || authLoading || (user && !profile)) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainHeader />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainHeader />
        <div className="flex-1 flex items-center justify-center">
          <p>Redirecting...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (profile && !isModerator) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainHeader />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access this page. Only moderators and admins can access the support panel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const openDisputes = disputes.filter((d) => d.status === "open" || d.status === "under_review");
  const resolvedDisputes = disputes.filter((d) => d.status === "resolved" || d.status === "closed");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Support - Dispute Management</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Review and resolve disputes between buyers and sellers
          </p>
        </div>

        <Tabs defaultValue="open" className="space-y-6">
          <TabsList>
            <TabsTrigger value="open">
              Open ({openDisputes.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedDisputes.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({disputes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-4">
            {openDisputes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">No open disputes</p>
                </CardContent>
              </Card>
            ) : (
              openDisputes.map((dispute) => (
                <DisputeCard
                  key={dispute.id}
                  dispute={dispute}
                  onAssign={() => handleAssignToMe(dispute.id)}
                  onResolve={() => {
                    setSelectedDispute(dispute);
                    setResolutionDialogOpen(true);
                  }}
                  onClose={() => handleClose(dispute.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            {resolvedDisputes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-slate-600 dark:text-slate-400">No resolved disputes</p>
                </CardContent>
              </Card>
            ) : (
              resolvedDisputes.map((dispute) => (
                <DisputeCard
                  key={dispute.id}
                  dispute={dispute}
                  readOnly
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {disputes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-slate-600 dark:text-slate-400">No disputes</p>
                </CardContent>
              </Card>
            ) : (
              disputes.map((dispute) => (
                <DisputeCard
                  key={dispute.id}
                  dispute={dispute}
                  onAssign={() => handleAssignToMe(dispute.id)}
                  onResolve={() => {
                    setSelectedDispute(dispute);
                    setResolutionDialogOpen(true);
                  }}
                  onClose={() => handleClose(dispute.id)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Resolution Dialog */}
      <Dialog open={resolutionDialogOpen} onOpenChange={setResolutionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Provide a resolution for this dispute. This will be visible to both parties.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resolution">Resolution *</Label>
              <Textarea
                id="resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Enter the resolution details..."
                rows={6}
                className="mt-2"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolutionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={submitting || !resolution.trim()}>
              {submitting ? "Resolving..." : "Resolve Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

function DisputeCard({
  dispute,
  onAssign,
  onResolve,
  onClose,
  readOnly = false,
}: {
  dispute: DisputeWithRelations;
  onAssign?: () => void;
  onResolve?: () => void;
  onClose?: () => void;
  readOnly?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg">Dispute #{dispute.id.slice(0, 8)}</CardTitle>
              <Badge className={getStatusColor(dispute.status)}>{dispute.status}</Badge>
              <Badge variant="outline">{dispute.priority}</Badge>
            </div>
            <CardDescription>
              {dispute.title} • {new Date(dispute.created_at || "").toLocaleDateString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-slate-500">Dispute Type</Label>
            <p className="capitalize">{dispute.dispute_type.replace(/_/g, " ")}</p>
          </div>
          {dispute.transaction && (
            <div>
              <Label className="text-xs text-slate-500">Transaction Value</Label>
              <p className="font-semibold">${formatPrice(dispute.transaction.price)}</p>
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs text-slate-500">Description</Label>
          <p className="text-slate-700 dark:text-slate-300 mt-1">{dispute.description}</p>
        </div>

        {dispute.resolution && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Label className="text-xs text-slate-500 mb-2">Resolution</Label>
            <p className="text-slate-700 dark:text-slate-300">{dispute.resolution}</p>
            {dispute.resolved_at && (
              <p className="text-xs text-slate-500 mt-2">
                Resolved on {new Date(dispute.resolved_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {dispute.moderator && (
          <div>
            <Label className="text-xs text-slate-500">Assigned Moderator</Label>
            <p>{dispute.moderator.full_name || dispute.moderator.email}</p>
          </div>
        )}

        {!readOnly && (
          <div className="flex gap-2 pt-4 border-t">
            {!dispute.moderator_id && onAssign && (
              <Button variant="outline" size="sm" onClick={onAssign}>
                Assign to Me
              </Button>
            )}
            {dispute.status === "under_review" && onResolve && (
              <Button size="sm" onClick={onResolve}>
                Resolve
              </Button>
            )}
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/transaction/${dispute.transaction_id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Transaction
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "open":
      return "bg-yellow-600";
    case "under_review":
      return "bg-blue-600";
    case "resolved":
      return "bg-green-600";
    case "closed":
      return "bg-slate-600";
    case "escalated":
      return "bg-red-600";
    default:
      return "bg-slate-600";
  }
}

