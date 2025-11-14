import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { wishlistService, type WishlistWithItems } from "@/services/wishlistService";
import { Heart, Plus, Edit, Trash2, Star, Search, List, FileText } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function WishlistsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [wishlists, setWishlists] = useState<WishlistWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWishlist, setSelectedWishlist] = useState<WishlistWithItems | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_default: false,
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
      return;
    }

    if (user) {
      loadWishlists();
    }
  }, [user, authLoading]);

  const loadWishlists = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await wishlistService.getUserWishlists(user.id);
      setWishlists(data || []);
    } catch (error) {
      console.error("Error loading wishlists:", error);
      toast({
        title: "Error",
        description: "Failed to load wishlists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWishlist = async () => {
    if (!user) return;

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Wishlist name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Ensure default wishlist is set correctly
      const isDefault = formData.is_default || wishlists.length === 0;
      
      const newWishlist = await wishlistService.createWishlist({
        user_id: user.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        is_default: isDefault,
      });

      toast({
        title: "Success",
        description: "Wishlist created successfully",
      });
      setCreateDialogOpen(false);
      setFormData({ name: "", description: "", is_default: false });
      loadWishlists();
    } catch (error: any) {
      console.error("Error creating wishlist:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create wishlist",
        variant: "destructive",
      });
    }
  };

  const handleEditWishlist = async () => {
    if (!selectedWishlist || !user) return;

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Wishlist name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await wishlistService.updateWishlist(selectedWishlist.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        is_default: formData.is_default,
      });

      toast({
        title: "Success",
        description: "Wishlist updated successfully",
      });
      setEditDialogOpen(false);
      setSelectedWishlist(null);
      setFormData({ name: "", description: "", is_default: false });
      loadWishlists();
    } catch (error: any) {
      console.error("Error updating wishlist:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update wishlist",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWishlist = async () => {
    if (!selectedWishlist) return;

    try {
      await wishlistService.deleteWishlist(selectedWishlist.id);
      toast({
        title: "Success",
        description: "Wishlist deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedWishlist(null);
      loadWishlists();
    } catch (error: any) {
      console.error("Error deleting wishlist:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete wishlist",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (wishlist: WishlistWithItems) => {
    setSelectedWishlist(wishlist);
    setFormData({
      name: wishlist.name,
      description: wishlist.description || "",
      is_default: wishlist.is_default || false,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (wishlist: WishlistWithItems) => {
    setSelectedWishlist(wishlist);
    setDeleteDialogOpen(true);
  };

  const filteredWishlists = wishlists.filter((wishlist) =>
    wishlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (wishlist.description && wishlist.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <MainHeader currentPage="wishlists" />
        <div className="container mx-auto px-4 py-10 flex-1">
          <div className="text-center">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader currentPage="wishlists" />

      <div className="container mx-auto px-4 py-10 flex-1 w-full max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Heart className="h-10 w-10 text-pink-600" />
              <div>
                <h1 className="text-4xl font-bold">My Wishlists</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Organize your favorite cards into custom lists
                </p>
              </div>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Wishlist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Wishlist</DialogTitle>
                  <DialogDescription>
                    Create a new wishlist to organize your favorite cards
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Charizard Collection"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                      maxLength={500}
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <Label htmlFor="is_default" className="text-sm font-normal">
                      Set as default wishlist
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateWishlist}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search wishlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Wishlists Grid */}
        {filteredWishlists.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No wishlists found" : "No wishlists yet"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Create your first wishlist to organize your favorite cards"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Wishlist
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWishlists.map((wishlist) => (
              <Card key={wishlist.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <List className="h-5 w-5 text-pink-600" />
                      <CardTitle className="text-lg">{wishlist.name}</CardTitle>
                      {wishlist.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(wishlist)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(wishlist)}
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {wishlist.description && (
                    <CardDescription className="line-clamp-2">
                      {wishlist.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <FileText className="h-4 w-4" />
                      <span>{wishlist.items_count || 0} items</span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/wishlists/${wishlist.id}`}>View</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Wishlist</DialogTitle>
              <DialogDescription>
                Update your wishlist details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Charizard Collection"
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  maxLength={500}
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <Label htmlFor="edit-is_default" className="text-sm font-normal">
                  Set as default wishlist
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditWishlist}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Wishlist</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedWishlist?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteWishlist} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Footer />
    </div>
  );
}

