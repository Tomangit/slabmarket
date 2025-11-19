
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { 
  Package, 
  Truck, 
  ShieldCheck, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  DollarSign,
  User,
  Calendar,
  MapPin,
  ExternalLink,
  Edit,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { transactionService } from "@/services/transactionService";
import { reviewService, type ReviewWithUser } from "@/services/reviewService";
import { messageService } from "@/services/messageService";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  slab: Database["public"]["Tables"]["slabs"]["Row"] & {
    grading_company: { id: string; name: string; code: string } | null;
  } | null;
  buyer: { id: string; full_name: string | null; email: string | null; avatar_url: string | null } | null;
  seller: { id: string; full_name: string | null; email: string | null; avatar_url: string | null } | null;
};

export default function TransactionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const t = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingStatus, setShippingStatus] = useState("preparing");
  const [updatingShipping, setUpdatingShipping] = useState(false);

  useEffect(() => {
    if (id && typeof id === "string" && user) {
      loadTransaction(id);
      loadReviews(id);
    }
  }, [id, user]);

  useEffect(() => {
    if (transaction && user) {
      checkCanReview();
      // Initialize shipping dialog state
      if (transaction.tracking_number) {
        setTrackingNumber(transaction.tracking_number);
      }
      setShippingStatus(transaction.shipping_status);
    }
  }, [transaction, user]);

  const loadTransaction = async (transactionId: string) => {
    try {
      setLoading(true);
      const data = await transactionService.getTransactionById(transactionId);
      
      // Verify user has access to this transaction
      if (user && data.buyer_id !== user.id && data.seller_id !== user.id) {
        router.push("/dashboard");
        return;
      }
      
      setTransaction(data);
    } catch (error) {
      console.error("Error loading transaction:", error);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (transactionId: string) => {
    try {
      const data = await reviewService.getTransactionReviews(transactionId);
      setReviews(data || []);
    } catch (error) {
      console.error("Error loading reviews:", error);
    }
  };

  const checkCanReview = async () => {
    if (!user || !transaction) return;
    
    try {
      const can = await reviewService.canUserReviewTransaction(user.id, transaction.id);
      setCanReview(can);
    } catch (error) {
      console.error("Error checking review eligibility:", error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !transaction || !reviewComment.trim()) {
      toast({
        title: "Error",
        description: "Please provide a review comment",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingReview(true);
      const revieweeId = isBuyer ? transaction.seller_id : transaction.buyer_id;
      
      await reviewService.createReview({
        transaction_id: transaction.id,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });

      // Reload reviews
      await loadReviews(transaction.id);
      await checkCanReview();
      
      // Reset form
      setReviewRating(5);
      setReviewComment("");
      setShowReviewForm(false);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleUpdateShipping = async () => {
    if (!transaction) return;

    try {
      setUpdatingShipping(true);
      await transactionService.updateShippingStatus(
        transaction.id,
        shippingStatus,
        trackingNumber.trim() || undefined
      );

      toast({
        title: "Shipping updated",
        description: "Shipping information has been updated successfully.",
      });

      // Reload transaction
      await loadTransaction(transaction.id);
      setShowShippingDialog(false);
    } catch (error) {
      console.error("Error updating shipping:", error);
      toast({
        title: "Error",
        description: "Failed to update shipping information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingShipping(false);
    }
  };

  const handleMarkAsDelivered = async () => {
    if (!transaction) return;

    try {
      setUpdatingShipping(true);
      await transactionService.updateShippingStatus(transaction.id, "delivered");

      toast({
        title: "Marked as delivered",
        description: "The item has been marked as delivered.",
      });

      // Reload transaction
      await loadTransaction(transaction.id);
    } catch (error) {
      console.error("Error marking as delivered:", error);
      toast({
        title: "Error",
        description: "Failed to update delivery status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingShipping(false);
    }
  };

  const getTrackingUrl = (trackingNumber: string) => {
    // Try to detect carrier and generate tracking URL
    // This is a simplified version - in production, you'd want to store carrier info
    const num = trackingNumber.toUpperCase();
    
    // USPS tracking numbers are typically 20-22 digits or 13 characters (letters and numbers)
    if (/^[0-9]{20,22}$/.test(num) || /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/.test(num)) {
      return `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`;
    }
    
    // UPS tracking numbers are typically 18 characters (letters and numbers)
    if (/^1Z[0-9A-Z]{16}$/.test(num)) {
      return `https://www.ups.com/track?tracknum=${trackingNumber}`;
    }
    
    // FedEx tracking numbers are typically 12-14 digits
    if (/^[0-9]{12,14}$/.test(num)) {
      return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    }
    
    // DHL tracking numbers
    if (/^[0-9]{10,11}$/.test(num)) {
      return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
    }
    
    // Default: use a generic tracking service
    return `https://www.17track.net/en/track?nums=${trackingNumber}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600";
      case "pending":
        return "bg-yellow-600";
      case "cancelled":
        return "bg-red-600";
      default:
        return "bg-slate-600";
    }
  };

  const getEscrowStatusColor = (status: string) => {
    switch (status) {
      case "released":
        return "bg-green-600";
      case "pending":
        return "bg-yellow-600";
      case "disputed":
        return "bg-red-600";
      default:
        return "bg-slate-600";
    }
  };

  const getShippingStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-600";
      case "shipped":
        return "bg-blue-600";
      case "preparing":
        return "bg-yellow-600";
      default:
        return "bg-slate-600";
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
    return (
      <div className="min-h-screen flex flex-col">
        <MainHeader />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Transaction Not Found</CardTitle>
              <CardDescription>The transaction you&apos;re looking for doesn&apos;t exist.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const isBuyer = user?.id === transaction.buyer_id;
  const isSeller = user?.id === transaction.seller_id;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader currentPage="dashboard" />

      <div className="container mx-auto px-4 py-8 flex-1 max-w-5xl">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/dashboard">← Back to Dashboard</Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transaction Details</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Transaction ID: {transaction.id}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Transaction Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
                  <Badge className={getStatusColor(transaction.escrow_status || "pending")}>
                    {transaction.escrow_status || "pending"}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Escrow Status</span>
                  <Badge className={getEscrowStatusColor(transaction.escrow_status)}>
                    {transaction.escrow_status}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Shipping Status</span>
                  <Badge className={getShippingStatusColor(transaction.shipping_status)}>
                    {transaction.shipping_status}
                  </Badge>
                </div>
                {transaction.tracking_number && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Tracking Number</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {transaction.tracking_number}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={getTrackingUrl(transaction.tracking_number)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Track
                          </a>
                        </Button>
                      </div>
                    </div>
                  </>
                )}
                {/* Seller actions */}
                {isSeller && transaction.shipping_status !== "delivered" && (
                  <>
                    <Separator />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowShippingDialog(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {transaction.tracking_number ? "Update Shipping" : "Add Tracking Number"}
                    </Button>
                  </>
                )}
                {/* Buyer actions */}
                {isBuyer && transaction.shipping_status === "shipped" && (
                  <>
                    <Separator />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleMarkAsDelivered}
                      disabled={updatingShipping}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Delivered
                    </Button>
                  </>
                )}
                {transaction.created_at && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Created</span>
                      <span className="text-sm">
                        {new Date(transaction.created_at).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
                {transaction.completed_at && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Completed</span>
                      <span className="text-sm">
                        {new Date(transaction.completed_at).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Slab Information */}
            {transaction.slab && (
              <Card>
                <CardHeader>
                  <CardTitle>Item Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="relative h-24 w-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden flex-shrink-0">
                      {transaction.slab.images && transaction.slab.images.length > 0 ? (
                        <Image 
                          src={transaction.slab.images[0]} 
                          alt={transaction.slab.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-3xl">🃏</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{transaction.slab.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {transaction.slab.set_name}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {transaction.slab.grading_company?.name || transaction.slab.grading_company?.code} {transaction.slab.grade}
                        </Badge>
                        {transaction.slab.first_edition && (
                          <Badge variant="outline">First Edition</Badge>
                        )}
                        {transaction.slab.shadowless && (
                          <Badge variant="outline">Shadowless</Badge>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="mt-3" asChild>
                        <Link href={`/slab/${transaction.slab_id}`}>View Slab Details</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">
                    {isBuyer ? "Shipping to you" : "Shipping to buyer"}
                  </span>
                </div>
                {transaction.tracking_number ? (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm font-medium mb-1">Tracking Number</p>
                    <code className="text-lg font-mono">{transaction.tracking_number}</code>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      Track your package using the carrier&apos;s website
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <p className="text-sm text-yellow-900 dark:text-yellow-100">
                      Tracking number will be added once the item is shipped
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Item Price</span>
                  <span className="font-semibold">${formatPrice(transaction.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Marketplace Fee</span>
                  <span>${formatPrice(transaction.marketplace_fee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Payment Processing</span>
                  <span>${formatPrice(transaction.payment_processing_fee)}</span>
                </div>
                <Separator />
                {isSeller && (
                  <div className="flex justify-between">
                    <span className="font-semibold">You Receive</span>
                    <span className="text-lg font-bold text-green-600">
                      ${formatPrice(transaction.seller_receives)}
                    </span>
                  </div>
                )}
                {isBuyer && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Paid</span>
                    <span className="text-lg font-bold">
                      ${formatPrice(transaction.price)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Party Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {isBuyer ? "Seller" : "Buyer"} Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {(isBuyer ? transaction.seller : transaction.buyer)?.full_name?.[0] || 
                     (isBuyer ? transaction.seller : transaction.buyer)?.email?.[0] || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {(isBuyer ? transaction.seller : transaction.buyer)?.full_name || 
                       (isBuyer ? transaction.seller : transaction.buyer)?.email || "Unknown"}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {(isBuyer ? "Seller" : "Buyer")}
                    </p>
                  </div>
                  {user && (isBuyer ? transaction.seller : transaction.buyer)?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const otherUserId = (isBuyer ? transaction.seller : transaction.buyer)?.id;
                          if (!otherUserId) return;
                          
                          const conversation = await messageService.getOrCreateConversation(
                            user.id,
                            otherUserId
                          );
                          router.push(`/messages/${conversation.id}`);
                        } catch (error) {
                          console.error("Error creating conversation:", error);
                          toast({
                            title: "Błąd",
                            description: "Nie udało się otworzyć konwersacji",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Wyślij wiadomość
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {(isBuyer || isSeller) && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isBuyer && transaction.escrow_status !== "disputed" && transaction.escrow_status !== "released" && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push(`/transaction/${transaction.id}/dispute`)}
                    >
                      Open Dispute
                    </Button>
                  )}
                  {isBuyer && transaction.escrow_status === "pending" && (
                    <Button variant="outline" className="w-full">
                      Request Refund
                    </Button>
                  )}
                  {isSeller && transaction.shipping_status === "preparing" && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowShippingDialog(true)}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Mark as Shipped
                    </Button>
                  )}
                  {transaction.escrow_status === "disputed" && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push(`/transaction/${transaction.id}/dispute`)}
                    >
                      View Dispute
                    </Button>
                  )}
                  {canReview && (
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                    >
                      {showReviewForm ? "Cancel Review" : "Leave a Review"}
                    </Button>
                  )}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/slab/${transaction.slab_id}`}>View Item</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard">Back to Dashboard</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
              <CardDescription>
                {reviews.length === 0 
                  ? "No reviews yet" 
                  : `${reviews.length} review${reviews.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Review Form */}
              {showReviewForm && canReview && (
                <Card className="bg-blue-50 dark:bg-blue-950/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Write a Review</CardTitle>
                    <CardDescription>
                      Share your experience with {isBuyer ? "the seller" : "the buyer"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Rating</Label>
                      <div className="flex gap-2 mt-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setReviewRating(rating)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                rating <= reviewRating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-slate-300 dark:text-slate-600"
                              } transition-colors`}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                          {reviewRating} / 5
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="review-comment">Comment</Label>
                      <Textarea
                        id="review-comment"
                        rows={4}
                        placeholder="Share your experience..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSubmitReview}
                        disabled={submittingReview || !reviewComment.trim()}
                      >
                        {submittingReview ? "Submitting..." : "Submit Review"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewRating(5);
                          setReviewComment("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Existing Reviews */}
              {reviews.length > 0 && (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {review.reviewer?.full_name?.[0] || "?"}
                          </div>
                          <div>
                            <p className="font-semibold">
                              {review.reviewer?.full_name || "Anonymous"}
                            </p>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <Star
                                  key={rating}
                                  className={`h-4 w-4 ${
                                    rating <= review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-slate-300 dark:text-slate-600"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.created_at && (
                          <span className="text-xs text-slate-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {reviews.length === 0 && !showReviewForm && (
                <p className="text-center text-slate-600 dark:text-slate-400 py-8">
                  No reviews yet. Be the first to review this transaction!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shipping Dialog */}
      <Dialog open={showShippingDialog} onOpenChange={setShowShippingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Shipping Information</DialogTitle>
            <DialogDescription>
              Add or update the tracking number and shipping status for this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="shipping-status">Shipping Status</Label>
              <Select
                value={shippingStatus}
                onValueChange={setShippingStatus}
              >
                <SelectTrigger id="shipping-status" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tracking-number">Tracking Number (Optional)</Label>
              <Input
                id="tracking-number"
                type="text"
                placeholder="Enter tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-slate-500 mt-1">
                Supports USPS, UPS, FedEx, DHL, and other major carriers
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowShippingDialog(false);
                if (transaction) {
                  setTrackingNumber(transaction.tracking_number || "");
                  setShippingStatus(transaction.shipping_status);
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateShipping}
              disabled={updatingShipping}
            >
              {updatingShipping ? "Updating..." : "Update Shipping"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

