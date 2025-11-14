
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { SetCombobox } from "@/components/SetCombobox";
import { CardNumberCombobox } from "@/components/CardNumberCombobox";
import { Upload, ShieldCheck, Package, DollarSign, Camera, Circle, Square, Building2, Calendar, Users, Trophy, AlertCircle, X, Loader2 } from "lucide-react";
import { setService } from "@/services/setService";
import { cardService } from "@/services/cardService";
import { slabService } from "@/services/slabService";
import { shippingService } from "@/services/shippingService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { certificateService } from "@/services/certificateService";
import type { PokemonSet } from "@/data/pokemonSetCatalog";

export default function SellPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1: Certificate
  const [gradingCompany, setGradingCompany] = useState<string>("");
  const [certNumber, setCertNumber] = useState("");
  const [grade, setGrade] = useState("");
  const [certVerified, setCertVerified] = useState(false);
  
  // Step 2: Card Details
  const [sets, setSets] = useState<PokemonSet[]>([]);
  const [setsLoading, setSetsLoading] = useState(true);
  const [selectedSetSlug, setSelectedSetSlug] = useState<string | null>(null);
  const [cards, setCards] = useState<Array<{ id: string; name: string; card_number: string | null; year: number | null }>>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardName, setCardName] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [firstEdition, setFirstEdition] = useState(false);
  const [pokemonCenterEdition, setPokemonCenterEdition] = useState(false);
  const [tournamentCard, setTournamentCard] = useState(false);
  const [shadowless, setShadowless] = useState(false);
  const [prerelease, setPrerelease] = useState(false);
  const [staff, setStaff] = useState(false);
  const [errorCard, setErrorCard] = useState(false);
  
  // Step 3: Photos
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Step 4: Pricing
  const [listingType, setListingType] = useState<"bin" | "auction" | "featured">("bin");
  const [price, setPrice] = useState<number | null>(null);
  const [shippingInsured, setShippingInsured] = useState(true);
  const [shippingTemperatureControlled, setShippingTemperatureControlled] = useState(false);
  const [shippingExpedited, setShippingExpedited] = useState(false);
  const [escrowProtection, setEscrowProtection] = useState(true);
  const [calculatedShippingCost, setCalculatedShippingCost] = useState<number | null>(null);
  const [estimatedShippingDays, setEstimatedShippingDays] = useState<number | null>(null);

  // Load sets on mount
  useEffect(() => {
    async function loadSets() {
      try {
        setSetsLoading(true);
        const allSets = await setService.getAllSets();
        setSets(allSets);
      } catch (error) {
        console.error("Error loading sets:", error);
      } finally {
        setSetsLoading(false);
      }
    }
    loadSets();
  }, []);

  // Load cards when set is selected
  useEffect(() => {
    async function loadCards() {
      if (!selectedSetSlug) {
        setCards([]);
        setSelectedCardId(null);
        setCardName("");
        setYear(null);
        return;
      }

      const selectedSet = sets.find((s) => s.slug === selectedSetSlug);
      if (!selectedSet) return;

      try {
        setCardsLoading(true);
        const cardsData = await cardService.getCardsBySet(selectedSet.name);
        setCards(cardsData);
        
        // Auto-fill year from set
        if (selectedSet.releaseYear) {
          setYear(selectedSet.releaseYear);
        }
      } catch (error) {
        console.error("Error loading cards:", error);
      } finally {
        setCardsLoading(false);
      }
    }
    loadCards();
  }, [selectedSetSlug, sets]);

  // Auto-fill card name and year when card is selected
  useEffect(() => {
    if (!selectedCardId) {
      setCardName("");
      return;
    }

    const selectedCard = cards.find((c) => c.id === selectedCardId);
    if (selectedCard) {
      setCardName(selectedCard.name);
      if (selectedCard.year) {
        setYear(selectedCard.year);
      }
    }
  }, [selectedCardId, cards]);

  // Check authentication
  useEffect(() => {
    if (!user) {
      router.push("/auth/signin?redirect=/sell");
    }
  }, [user, router]);

  // Upload images to Supabase Storage
  const handleImageUpload = async (files: FileList) => {
    if (!user) {
      toast({
        title: t('sell.authRequired'),
        description: t('sell.signInToUpload'),
        variant: "destructive",
      });
      return;
    }

    const maxFiles = 8;
    const fileArray = Array.from(files).slice(0, maxFiles - uploadedImages.length);
    
    if (fileArray.length === 0) {
      toast({
        title: t('sell.maxImagesReached'),
        description: t('sell.maxImagesDesc', { max: maxFiles }),
        variant: "destructive",
      });
      return;
    }

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of fileArray) {
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: t('sell.fileTooLarge'),
            description: t('sell.fileTooLargeDesc', { filename: file.name }),
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from("slab-images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from("slab-images")
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      setUploadedImages([...uploadedImages, ...uploadedUrls]);
      toast({
        title: t('sell.imagesUploaded'),
        description: t('sell.imagesUploadedDesc', { count: uploadedUrls.length }),
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  // Submit form
  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: t('sell.authRequired'),
        description: t('sell.signInToCreate'),
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (!certNumber || !grade) {
      toast({
        title: t('sell.missingInfo'),
        description: t('sell.provideCertGrade'),
        variant: "destructive",
      });
      return;
    }

    if (!cardName || !selectedSetSlug) {
      toast({
        title: t('sell.missingInfo'),
        description: t('sell.provideCardSet'),
        variant: "destructive",
      });
      return;
    }

    if (!price || price <= 0) {
      toast({
        title: t('sell.invalidPrice'),
        description: t('sell.enterValidPrice'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedSet = sets.find((s) => s.slug === selectedSetSlug);
      const selectedCard = cards.find((c) => c.id === selectedCardId);

      // Get grading company ID (simplified - you may need to fetch from DB)
      const gradingCompanyMap: Record<string, string> = {
        psa: "psa",
        bgs: "bgs",
        cgc: "cgc",
        sgc: "sgc",
        ace: "ace",
      };

      const slabData = {
        cert_number: certNumber,
        grade: grade,
        grading_company_id: gradingCompany ? gradingCompanyMap[gradingCompany] : null,
        cert_verified: certVerified,
        cert_verified_at: certVerified ? new Date().toISOString() : null,
        name: cardName,
        set_name: selectedSet?.name || null,
        card_id: selectedCardId || null,
        card_number: selectedCard?.card_number || null,
        year: year,
        description: description || null,
        first_edition: firstEdition,
        shadowless: shadowless,
        pokemon_center_edition: pokemonCenterEdition,
        prerelease: prerelease,
        staff: staff,
        tournament_card: tournamentCard,
        error_card: errorCard,
        images: uploadedImages.length > 0 ? uploadedImages : null,
        price: price,
        currency: "USD",
        listing_type: listingType,
        status: "active",
        seller_id: user.id,
        shipping_available: true,
        shipping_insured: shippingInsured,
        shipping_temperature_controlled: shippingTemperatureControlled,
        shipping_cost: calculatedShippingCost,
        shipping_estimated_days: estimatedShippingDays,
        escrow_protection: escrowProtection,
        buyer_protection: true,
        views: 0,
        watchlist_count: 0,
      };

      const createdSlab = await slabService.createSlab(slabData);

      toast({
        title: t('sell.listingCreated'),
        description: t('sell.listingCreatedDesc'),
      });

      router.push(`/slab/${createdSlab.id}`);
    } catch (error) {
      console.error("Error creating listing:", error);
      toast({
        title: t('sell.failedToCreate'),
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader />

      <div className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600"
                }`}>
                  {s}
                </div>
                {s < 4 && (
                  <div className={`h-1 w-20 mx-2 ${
                    step > s ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs text-center">
            <span className={step >= 1 ? "text-blue-600 font-semibold" : "text-slate-600"}>{t('sell.step1')}</span>
            <span className={step >= 2 ? "text-blue-600 font-semibold" : "text-slate-600"}>{t('sell.step2')}</span>
            <span className={step >= 3 ? "text-blue-600 font-semibold" : "text-slate-600"}>{t('sell.step3')}</span>
            <span className={step >= 4 ? "text-blue-600 font-semibold" : "text-slate-600"}>{t('sell.step4')}</span>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
                {t('sell.verifyCertificate')}
              </CardTitle>
              <CardDescription>
                {t('sell.verifyCertificateDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="gradingCompany">{t('sell.gradingCompany')}</Label>
                <Select value={gradingCompany} onValueChange={setGradingCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('sell.selectGradingCompany')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="psa">PSA</SelectItem>
                    <SelectItem value="bgs">BGS / Beckett</SelectItem>
                    <SelectItem value="cgc">CGC</SelectItem>
                    <SelectItem value="sgc">SGC</SelectItem>
                    <SelectItem value="ace">ACE Grading</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certNumber">{t('sell.certificateNumber')}</Label>
                <Input
                  id="certNumber"
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  placeholder="e.g., 82749361"
                  className="font-mono"
                />
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {t('sell.certificateNumberHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">{t('sell.grade')}</Label>
                <Input
                  id="grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g., 10"
                />
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>{t('sell.whyVerify')}</strong> {t('sell.whyVerifyDesc')}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => {
                  setCertVerified(false);
                  setStep(2);
                }}>
                  {t('sell.skipVerification')}
                </Button>
                <Button 
                  onClick={async () => {
                    if (!gradingCompany || !certNumber || !grade) {
                      toast({
                        title: t('sell.missingInfo'),
                        description: t('sell.provideCertGrade'),
                        variant: "destructive",
                      });
                      return;
                    }

                    try {
                      // Verify certificate using Edge Function
                      const verified = await certificateService.verify(
                        gradingCompany,
                        certNumber,
                        grade
                      );
                      
                      setCertVerified(verified);
                      
                      if (verified) {
                        toast({
                          title: t('sell.listingCreated'),
                          description: "Certificate verified successfully",
                        });
                      } else {
                        toast({
                          title: "Verification failed",
                          description: "Could not verify certificate. You can still continue without verification.",
                          variant: "destructive",
                        });
                      }
                      
                      setStep(2);
                    } catch (error) {
                      console.error("Verification error:", error);
                      toast({
                        title: "Verification error",
                        description: error instanceof Error ? error.message : "Failed to verify certificate",
                        variant: "destructive",
                      });
                      // Allow continuing even if verification fails
                      setCertVerified(false);
                      setStep(2);
                    }
                  }}
                >
                  {t('sell.verifyContinue')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-6 w-6 text-blue-600" />
                {t('sell.cardDetails')}
              </CardTitle>
              <CardDescription>
                {t('sell.cardDetailsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">{t('sell.category')}</Label>
                <Select defaultValue="pokemon">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pokemon">Pokemon TCG</SelectItem>
                    <SelectItem value="lorcana" disabled>Disney Lorcana (Coming Soon)</SelectItem>
                    <SelectItem value="sports" disabled>Sports Cards (Coming Soon)</SelectItem>
                    <SelectItem value="mtg" disabled>Magic: The Gathering (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="set">{t('sell.setEdition')}</Label>
                <SetCombobox
                  sets={sets}
                  value={selectedSetSlug || "all"}
                  onChange={(slug) => setSelectedSetSlug(slug === "all" ? null : slug)}
                  isLoading={setsLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">{t('sell.cardNumber')}</Label>
                <CardNumberCombobox
                  cards={cards}
                  value={selectedCardId}
                  onChange={setSelectedCardId}
                  isLoading={cardsLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardName">{t('sell.cardName')}</Label>
                <Input
                  id="cardName"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g., Charizard"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">{t('sell.year')}</Label>
                <Input
                  id="year"
                  type="number"
                  value={year || ""}
                  onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 1999"
                />
              </div>

              <div className="space-y-3">
                <Label>{t('sell.cardEdition')}</Label>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="firstEdition"
                      checked={firstEdition}
                      onCheckedChange={(checked) => setFirstEdition(checked === true)}
                    />
                    <Label htmlFor="firstEdition" className="font-normal cursor-pointer flex items-center gap-2">
                      <div className="relative h-4 w-4">
                        <Circle className="h-4 w-4" />
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold leading-none">1</span>
                      </div>
                      {t('sell.firstEdition')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="shadowless"
                      checked={shadowless}
                      onCheckedChange={(checked) => setShadowless(checked === true)}
                    />
                    <Label htmlFor="shadowless" className="font-normal cursor-pointer flex items-center gap-2">
                      <Square className="h-4 w-4 stroke-[1.5]" />
                      {t('sell.shadowless')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pokemonCenterEdition"
                      checked={pokemonCenterEdition}
                      onCheckedChange={(checked) => setPokemonCenterEdition(checked === true)}
                    />
                    <Label htmlFor="pokemonCenterEdition" className="font-normal cursor-pointer flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {t('sell.pokemonCenterEdition')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="prerelease"
                      checked={prerelease}
                      onCheckedChange={(checked) => setPrerelease(checked === true)}
                    />
                    <Label htmlFor="prerelease" className="font-normal cursor-pointer flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t('sell.prerelease')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="staff"
                      checked={staff}
                      onCheckedChange={(checked) => setStaff(checked === true)}
                    />
                    <Label htmlFor="staff" className="font-normal cursor-pointer flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t('sell.staff')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tournamentCard"
                      checked={tournamentCard}
                      onCheckedChange={(checked) => setTournamentCard(checked === true)}
                    />
                    <Label htmlFor="tournamentCard" className="font-normal cursor-pointer flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      {t('sell.tournamentCard')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="errorCard"
                      checked={errorCard}
                      onCheckedChange={(checked) => setErrorCard(checked === true)}
                    />
                    <Label htmlFor="errorCard" className="font-normal cursor-pointer flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {t('sell.errorCard')}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('sell.description')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('sell.descriptionPlaceholder')}
                  rows={4}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  {t('common.back')}
                </Button>
                <Button onClick={() => setStep(3)}>
                  {t('common.continue')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-6 w-6 text-blue-600" />
                {t('sell.uploadPhotos')}
              </CardTitle>
              <CardDescription>
                {t('sell.uploadPhotosDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleImageUpload(e.target.files);
                  }
                }}
              />
              
              <div 
                className="border-2 border-dashed rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files) {
                    handleImageUpload(e.dataTransfer.files);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <p className="text-lg font-semibold mb-2">{t('sell.dropPhotos')}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {t('sell.photoRequirements')}
                </p>
                <Button 
                  variant="outline"
                  type="button"
                  disabled={uploadingImages}
                >
                  {uploadingImages ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('sell.uploading')}
                    </>
                  ) : (
                    t('sell.chooseFiles')
                  )}
                </Button>
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {uploadedImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  <strong>{t('sell.photoTips')}</strong> {t('sell.photoTipsDesc')}
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  {t('common.back')}
                </Button>
                <Button onClick={() => setStep(4)}>
                  {t('common.continue')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-blue-600" />
                {t('sell.setPrice')}
              </CardTitle>
              <CardDescription>
                {t('sell.setPriceDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t('sell.listingType')}</Label>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card 
                    className={`cursor-pointer border-2 ${listingType === "bin" ? "border-blue-500" : "hover:border-blue-500"}`}
                    onClick={() => setListingType("bin")}
                  >
                    <CardContent className="p-4 text-center">
                      <Badge className="mb-2">Recommended</Badge>
                      <p className="font-semibold">{t('sell.buyItNow')}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {t('sell.setFixedPrice')}
                      </p>
                    </CardContent>
                  </Card>
                  <Card 
                    className={`cursor-pointer border-2 ${listingType === "auction" ? "border-blue-500" : "hover:border-blue-500"}`}
                    onClick={() => setListingType("auction")}
                  >
                    <CardContent className="p-4 text-center">
                      <p className="font-semibold">{t('sell.auction')}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {t('sell.letBuyersBid')}
                      </p>
                    </CardContent>
                  </Card>
                  <Card 
                    className={`cursor-pointer border-2 ${listingType === "featured" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" : "hover:border-yellow-500"}`}
                    onClick={() => setListingType("featured")}
                  >
                    <CardContent className="p-4 text-center">
                      <Badge className="mb-2 bg-yellow-600">Premium</Badge>
                      <p className="font-semibold">{t('sell.featured')}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {t('sell.premiumHighlight')}
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-bold text-yellow-600">$50/week</p>
                        <p className="text-xs text-slate-500">Featured on homepage</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">{t('sell.priceUSD')}</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="price"
                    type="number"
                    value={price || ""}
                    onChange={(e) => {
                      const newPrice = e.target.value ? parseFloat(e.target.value) : null;
                      setPrice(newPrice);
                      
                      // Calculate shipping cost when price changes
                      if (newPrice && newPrice > 0) {
                        const shipping = shippingService.getSlabShippingCost(
                          newPrice,
                          shippingInsured,
                          shippingTemperatureControlled
                        );
                        setCalculatedShippingCost(shipping.totalCost);
                        setEstimatedShippingDays(shipping.estimatedDays);
                      } else {
                        setCalculatedShippingCost(null);
                        setEstimatedShippingDays(null);
                      }
                    }}
                    placeholder="0.00"
                    className="pl-10"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              
              {/* Shipping Cost Preview */}
              {price && price > 0 && calculatedShippingCost && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Estimated Shipping Cost:</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${calculatedShippingCost.toFixed(2)}
                    </span>
                  </div>
                  {estimatedShippingDays && (
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Estimated delivery: {estimatedShippingDays} business days
                    </p>
                  )}
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 space-y-1 pt-2 border-t border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between">
                      <span>Base shipping:</span>
                      <span>${shippingService.calculateShippingCost(price, { insured: false, temperatureControlled: false }).baseCost.toFixed(2)}</span>
                    </div>
                    {shippingInsured && (
                      <div className="flex justify-between">
                        <span>Insurance:</span>
                        <span>+${shippingService.calculateShippingCost(price, { insured: true, temperatureControlled: false }).insuranceCost.toFixed(2)}</span>
                      </div>
                    )}
                    {shippingTemperatureControlled && (
                      <div className="flex justify-between">
                        <span>Temperature control:</span>
                        <span>+${shippingService.calculateShippingCost(price, { insured: false, temperatureControlled: true }).temperatureControlCost.toFixed(2)}</span>
                      </div>
                    )}
                    {shippingExpedited && (
                      <div className="flex justify-between">
                        <span>Expedited:</span>
                        <span>+${shippingService.calculateShippingCost(price, { insured: false, temperatureControlled: false, expedited: true }).expeditedCost.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {price && price > 0 && (
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">{t('sell.yourAskingPrice')}</span>
                    <span className="font-semibold">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">{t('sell.slabMarketFee')}</span>
                    <span className="font-semibold">-${(price * 0.05).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">{t('sell.paymentProcessing')}</span>
                    <span className="font-semibold">-${(price * 0.029).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {listingType === "featured" && (
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-slate-600 dark:text-slate-400">Featured Listing Fee</span>
                      <span className="font-semibold text-yellow-600">+$50.00/week</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2 flex justify-between">
                    <span className="font-semibold">{t('sell.youReceive')}</span>
                    <span className="font-bold text-green-600">${(price * 0.921).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label>{t('sell.shippingOptions')}</Label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded" 
                    checked={shippingInsured}
                    onChange={(e) => {
                      setShippingInsured(e.target.checked);
                      // Recalculate shipping cost
                      if (price && price > 0) {
                        const shipping = shippingService.getSlabShippingCost(
                          price,
                          e.target.checked,
                          shippingTemperatureControlled
                        );
                        setCalculatedShippingCost(shipping.totalCost);
                        setEstimatedShippingDays(shipping.estimatedDays);
                      }
                    }}
                  />
                  <span className="text-sm">{t('sell.insuredShipping')}</span>
                  {price && price > 0 && (
                    <span className="text-xs text-slate-500 ml-2">
                      (+${shippingService.calculateShippingCost(price, { insured: true, temperatureControlled: false }).insuranceCost.toFixed(2)})
                    </span>
                  )}
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded"
                    checked={shippingTemperatureControlled}
                    onChange={(e) => {
                      setShippingTemperatureControlled(e.target.checked);
                      // Recalculate shipping cost
                      if (price && price > 0) {
                        const shipping = shippingService.getSlabShippingCost(
                          price,
                          shippingInsured,
                          e.target.checked
                        );
                        setCalculatedShippingCost(shipping.totalCost);
                        setEstimatedShippingDays(shipping.estimatedDays);
                      }
                    }}
                  />
                  <span className="text-sm">{t('sell.temperatureShipping')}</span>
                  {price && price > 0 && (
                    <span className="text-xs text-slate-500 ml-2">
                      (+${shippingService.calculateShippingCost(price, { insured: false, temperatureControlled: true }).temperatureControlCost.toFixed(2)})
                    </span>
                  )}
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded"
                    checked={shippingExpedited}
                    onChange={(e) => {
                      setShippingExpedited(e.target.checked);
                      // Recalculate shipping cost
                      if (price && price > 0) {
                        const shipping = shippingService.calculateShippingCost(price, {
                          insured: shippingInsured,
                          temperatureControlled: shippingTemperatureControlled,
                          expedited: e.target.checked,
                        });
                        setCalculatedShippingCost(shipping.totalCost);
                        setEstimatedShippingDays(shipping.estimatedDays);
                      }
                    }}
                  />
                  <span className="text-sm">Expedited Shipping</span>
                  {price && price > 0 && (
                    <span className="text-xs text-slate-500 ml-2">
                      (+${shippingService.calculateShippingCost(price, { insured: false, temperatureControlled: false, expedited: true }).expeditedCost.toFixed(2)})
                    </span>
                  )}
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded"
                    checked={escrowProtection}
                    onChange={(e) => setEscrowProtection(e.target.checked)}
                  />
                  <span className="text-sm">{t('sell.escrowProtection')}</span>
                </label>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  {t('common.back')}
                </Button>
                <Button 
                  size="lg" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('sell.publishing')}
                    </>
                  ) : (
                    t('sell.publishListing')
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
