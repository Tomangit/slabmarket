
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { AlertCircle, Upload, FileText, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { transactionService } from "@/services/transactionService";
import { disputeService, type DisputeWithRelations } from "@/services/disputeService";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  slab: Database["public"]["Tables"]["slabs"]["Row"] | null;
  buyer: { id: string; full_name: string | null; email: string | null } | null;
  seller: { id: string; full_name: string | null; email: string | null } | null;
};

export default function DisputePage() {
  const router = useRouter();
  const { id } = router.query;
  const t = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [existingDispute, setExistingDispute] = useState<DisputeWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [disputeType, setDisputeType] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("normal");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);

  useEffect(() => {
    if (id && typeof id === "string" && user) {
      loadData(id);
    }
  }, [id, user]);

  const loadData = async (transactionId: string) => {
    try {
      setLoading(true);
      const [txn, disputes] = await Promise.all([
        transactionService.getTransactionById(transactionId),
        disputeService.getUserDisputes(user!.id),
      ]);
      
      // Verify user has access
      if (txn.buyer_id !== user!.id && txn.seller_id !== user!.id) {
        router.push("/dashboard");
        return;
      }
      
      setTransaction(txn);
      
      // Check if dispute already exists
      const dispute = disputes.find((d) => d.transaction_id === transactionId);
      if (dispute) {
        setExistingDispute(dispute);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !transaction || !disputeType || !title || !description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      await disputeService.createDispute({
        transaction_id: transaction.id,
        created_by_id: user.id,
        dispute_type: disputeType as any,
        title,
        description,
        priority: priority as any,
        evidence_urls: evidenceUrls,
        status: "open",
      });

      toast({
        title: "Dispute created",
        description: "Your dispute has been submitted and will be reviewed by our support team.",
      });

      router.push(`/transaction/${transaction.id}`);
    } catch (error) {
      console.error("Error creating dispute:", error);
      toast({
        title: "Error",
        description: "Failed to create dispute. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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

  if (!transaction) {
    return null;
  }

  const isBuyer = transaction.buyer_id === user?.id;

  // If dispute already exists, show it
  if (existingDispute) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <MainHeader />
        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="max-w-4xl mx-auto">
            <Button variant="outline" className="mb-6" asChild>
              <Link href={`/transaction/${transaction.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Transaction
              </Link>
            </Button>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Dispute #{existingDispute.id.slice(0, 8)}</CardTitle>
                    <CardDescription>
                      Created {new Date(existingDispute.created_at || "").toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(existingDispute.status)}>
                    {existingDispute.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Dispute Type</Label>
                  <p className="mt-1 capitalize">{existingDispute.dispute_type.replace(/_/g, " ")}</p>
                </div>

                <div>
                  <Label>Title</Label>
                  <p className="mt-1 font-semibold">{existingDispute.title}</p>
                </div>

                <div>
                  <Label>Description</Label>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{existingDispute.description}</p>
                </div>

                {existingDispute.resolution && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <Label className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4" />
                      Resolution
                    </Label>
                    <p className="text-slate-700 dark:text-slate-300">{existingDispute.resolution}</p>
                    {existingDispute.resolved_at && (
                      <p className="text-xs text-slate-500 mt-2">
                        Resolved on {new Date(existingDispute.resolved_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {existingDispute.moderator && (
                  <div>
                    <Label>Assigned Moderator</Label>
                    <p className="mt-1">{existingDispute.moderator.full_name || existingDispute.moderator.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" className="mb-6" asChild>
            <Link href={`/transaction/${transaction.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Transaction
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-orange-600" />
                Open a Dispute
              </CardTitle>
              <CardDescription>
                If you have an issue with this transaction, please provide details below. Our support team will review your case.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="dispute-type">Dispute Type *</Label>
                  <Select value={disputeType} onValueChange={setDisputeType} required>
                    <SelectTrigger id="dispute-type" className="mt-2">
                      <SelectValue placeholder="Select dispute type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="item_not_received">Item Not Received</SelectItem>
                      <SelectItem value="item_not_as_described">Item Not As Described</SelectItem>
                      <SelectItem value="damaged_item">Damaged Item</SelectItem>
                      <SelectItem value="wrong_item">Wrong Item</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary of the issue"
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed information about the issue..."
                    rows={6}
                    className="mt-2"
                    required
                  />
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    <strong>Note:</strong> Opening a dispute will freeze the escrow funds until the issue is resolved. 
                    Please provide as much detail as possible to help us resolve this quickly.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? "Submitting..." : "Submit Dispute"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
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

