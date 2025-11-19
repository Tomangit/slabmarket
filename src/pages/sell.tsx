
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
import { Upload, ShieldCheck, Package, DollarSign, Camera, Circle, Square, Building2, Calendar, Users, Trophy, AlertCircle, X, Loader2, TrendingUp, TrendingDown, Sparkles, CheckCircle2 } from "lucide-react";
import { setService } from "@/services/setService";
import { cardService } from "@/services/cardService";
import { slabService } from "@/services/slabService";
import { shippingService } from "@/services/shippingService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { certificateService } from "@/services/certificateService";
import { priceRecommendationService, type PriceRecommendation } from "@/services/priceRecommendationService";
import type { PokemonSet } from "@/data/pokemonSetCatalog";
import { slugify } from "@/lib/slugify";

export default function SellPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1: Certificate
  const [gradingCompany, setGradingCompany] = useState<string>("");
  const [certNumber, setCertNumber] = useState("");
  const [grade, setGrade] = useState(""); // Grade jest przechowywany wewnętrznie, ale nie pokazujemy pola w UI
  const [certVerified, setCertVerified] = useState(false);
  const [verifiedCardNumber, setVerifiedCardNumber] = useState<string | null>(null); // Card number z weryfikacji
  const [pendingSetName, setPendingSetName] = useState<string | null>(null); // Set name z weryfikacji, czeka na załadowanie sets
  
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
  const [holo, setHolo] = useState(false);
  const [reverseHolo, setReverseHolo] = useState(false);
  const [availableVariants, setAvailableVariants] = useState({
    first_edition: false,
    shadowless: false,
    pokemon_center_edition: false,
    prerelease: false,
    staff: false,
    tournament_card: false,
    error_card: false,
  });
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  
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
  
  // Price recommendation
  const [priceRecommendation, setPriceRecommendation] = useState<PriceRecommendation | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);

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

  // Spróbuj znaleźć set po nazwie, gdy sets są załadowane
  useEffect(() => {
    if (pendingSetName && sets.length > 0 && !setsLoading) {
      
      // Najpierw dokładne dopasowanie
      const exactMatch = sets.find((s) => 
        s.name.toUpperCase() === pendingSetName.toUpperCase()
      );
      
      if (exactMatch) {
        setSelectedSetSlug(exactMatch.slug);
        setPendingSetName(null);
      } else {
        // Spróbuj znaleźć set, którego nazwa jest zawarta w pendingSetName lub odwrotnie
        const partialMatch = sets.find((s) => 
          s.name.toUpperCase().includes(pendingSetName.toUpperCase()) ||
          pendingSetName.toUpperCase().includes(s.name.toUpperCase())
        );
        
        if (partialMatch) {
          setSelectedSetSlug(partialMatch.slug);
          setPendingSetName(null);
        } else {
          // Spróbuj stworzyć slug i znaleźć pasujący
          const derivedSlug = slugify(`english-${pendingSetName}`);
          
          // Sprawdź, czy slug istnieje w bazie
          const exactSlugMatch = sets.find((s) => s.slug === derivedSlug);
          if (exactSlugMatch) {
            setSelectedSetSlug(derivedSlug);
            setPendingSetName(null);
          } else {
            // Spróbuj znaleźć slug, który zawiera część pendingSetName
            const slugPart = pendingSetName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const fuzzySlugMatch = sets.find((s) => 
              s.slug.includes(slugPart) ||
              slugPart.includes(s.slug.replace('english-', ''))
            );
            if (fuzzySlugMatch) {
              setSelectedSetSlug(fuzzySlugMatch.slug);
              setPendingSetName(null);
            } else {
            }
          }
        }
      }
    }
  }, [pendingSetName, sets, setsLoading]);

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
      if (!selectedSet) {
        return;
      }
      

      try {
        setCardsLoading(true);
        const cardsData = await cardService.getCardsBySet(selectedSet.name);
        setCards(cardsData);
        
        
        // Auto-fill year from set - nie nadpisujemy jeśli już jest ustawiony z weryfikacji
        // (year jest w state, ale nie dodajemy do dependencies żeby uniknąć pętli)
        
        // Jeśli mamy card_number z weryfikacji, znajdź i ustaw odpowiednią kartę
        if (verifiedCardNumber && cardsData.length > 0) {
          // Normalizuj verifiedCardNumber - usuń białe znaki i spacje
          const normalizedVerified = verifiedCardNumber.toString().trim();
          
          
          const matchingCard = cardsData.find((card) => {
            if (!card.card_number) return false;
            // Normalizuj card_number z bazy - usuń białe znaki
            const normalizedCard = card.card_number.toString().trim();
            
            // Porównaj różne formaty
            return (
              normalizedCard === normalizedVerified ||
              normalizedCard === normalizedVerified.replace(/^#/, "") ||
              normalizedCard === normalizedVerified.replace(/\//g, "-") ||
              normalizedCard === normalizedVerified.replace(/^0+/, "") || // Usuń wiodące zera
              normalizedCard.replace(/^0+/, "") === normalizedVerified.replace(/^0+/, "") ||
              parseInt(normalizedCard, 10) === parseInt(normalizedVerified, 10) // Porównaj jako liczby
            );
          });
          
          if (matchingCard) {
            setSelectedCardId(matchingCard.id);
          } else {
          }
        }
      } catch (error) {
        console.error("Error loading cards:", error);
      } finally {
        setCardsLoading(false);
      }
    }
    loadCards();
  }, [selectedSetSlug, sets, verifiedCardNumber]);

  // Auto-fill card name and year when card is selected, and load available variants/languages
  useEffect(() => {
    if (!selectedCardId) {
      setCardName("");
      setAvailableVariants({
        first_edition: false,
        shadowless: false,
        pokemon_center_edition: false,
        prerelease: false,
        staff: false,
        tournament_card: false,
        error_card: false,
      });
      setAvailableLanguages([]);
      setSelectedLanguage(null);
      return;
    }

    const selectedCard = cards.find((c) => c.id === selectedCardId);
    if (selectedCard) {
      setCardName(selectedCard.name);
      if (selectedCard.year) {
        setYear(selectedCard.year);
      }
      
      // Load available variants and languages for this card
      const loadCardVariantsAndLanguages = async () => {
        try {
          const [variants, languages] = await Promise.all([
            cardService.getCardAvailableVariants(selectedCardId),
            cardService.getCardAvailableLanguages(selectedCardId),
          ]);
          setAvailableVariants(variants);
          setAvailableLanguages(languages);
          
          // Auto-select first language if available and no language is currently selected
          if (languages.length > 0) {
            setSelectedLanguage((prev) => prev || languages[0]);
          }
        } catch (error) {
          console.error("Error loading card variants/languages:", error);
        }
      };
      
      loadCardVariantsAndLanguages();
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
    if (!certNumber) {
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

    if (!grade) {
      toast({
        title: t('sell.missingInfo'),
        description: "Please provide the card grade",
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
      // Sprawdź, czy użytkownik ma profil - jeśli nie, utwórz go
      
      if (!profile || profile === null) {
        try {
          const response = await fetch('/api/create-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              fullName: user.user_metadata?.username || user.user_metadata?.full_name || null,
            }),
          });

          console.log("[SellPage] Create profile response status:", response.status);

          if (response.ok) {
            const responseData = await response.json();
            console.log("[SellPage] Create profile response data:", responseData);
            
            const { profile: newProfile } = responseData;
            if (newProfile) {
              console.log("[SellPage] Profile created successfully, refreshing...");
              // Odśwież profil w kontekście
              await refreshProfile();
              
              // Poczekaj chwilę, aby profil został załadowany
              await new Promise(resolve => setTimeout(resolve, 500));
              
              console.log("[SellPage] Profile refresh completed");
            } else {
              throw new Error("Failed to create profile - no profile returned");
            }
          } else {
            const errorText = await response.text();
            console.error("[SellPage] Failed to create profile:", response.status, errorText);
            throw new Error(`Failed to create profile: ${response.status} ${errorText}`);
          }
        } catch (profileError) {
          console.error("[SellPage] Error creating profile:", profileError);
          toast({
            title: t('sell.failedToCreate'),
            description: "Unable to create user profile. Please try again or contact support.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      } else {
        console.log("[SellPage] Profile exists:", profile.id);
      }

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

      // Mapowanie listing_type: frontend używa "bin", baza danych wymaga "fixed" lub "auction"
      const dbListingType = listingType === "bin" ? "fixed" : listingType === "auction" ? "auction" : "fixed";

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
        language: selectedLanguage || null,
        first_edition: firstEdition,
        shadowless: shadowless,
        holo: holo,
        reverse_holo: reverseHolo,
        pokemon_center_edition: pokemonCenterEdition,
        prerelease: prerelease,
        staff: staff,
        tournament_card: tournamentCard,
        error_card: errorCard,
        images: uploadedImages.length > 0 ? uploadedImages : null,
        price: price,
        currency: "USD",
        listing_type: dbListingType,
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

      console.log("[SellPage] Creating slab with data:", {
        seller_id: slabData.seller_id,
        user_id: user.id,
        profile_id: profile?.id,
        listing_type: slabData.listing_type,
        card_id: slabData.card_id,
        card_number: slabData.card_number,
        name: slabData.name,
        set_name: slabData.set_name,
      });

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

              {/* Grade nie jest wymagany do weryfikacji – uzupełnimy z odpowiedzi */}

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
                    if (!gradingCompany || !certNumber) {
                      toast({
                        title: t('sell.missingInfo'),
                        description: t('sell.certificateNumberRequired'),
                        variant: "destructive",
                      });
                      return;
                    }

                    try {
                      
                      // Verify certificate using Edge Function and auto-fill details
                      const response = await certificateService.verifyAndGetData(
                        gradingCompany,
                        certNumber
                      );
                      
                      
                      setCertVerified(response.verified && response.valid);
                      
                      // Sprawdź, czy mamy dane do uzupełnienia (nie tylko podstawowe pola)
                      const hasUsefulData = response.data && (
                        response.data.card_name || 
                        response.data.set_name || 
                        response.data.year || 
                        response.data.card_number ||
                        response.data.image_url
                      );
                      
                      if (hasUsefulData && response.data) {
                        const d = response.data;
                        
                        // Ustaw Set - najpierw spróbuj znaleźć po slug, potem po nazwie
                        if (d.set_name) {
                          // Normalizuj nazwę setu - usuń "POKEMON" z początku, jeśli jest (PSA zwraca "POKEMON SKYRIDGE", ale w bazie jest "Skyridge")
                          let normalizedSetName = d.set_name.trim();
                          if (normalizedSetName.toUpperCase().startsWith('POKEMON ')) {
                            normalizedSetName = normalizedSetName.substring(8).trim(); // Usuń "POKEMON "
                          }
                          
                          let foundSlug = null;
                          
                          // Sprawdź, czy sets są już załadowane
                          if (sets.length > 0 && !setsLoading) {
                            // Najpierw sprawdź, czy Edge Function zwrócił slug i czy istnieje w bazie
                            if (d.set_slug) {
                              const slugExists = sets.find((s) => s.slug === d.set_slug);
                              if (slugExists) {
                                foundSlug = d.set_slug;
                              } else {
                              }
                            }
                            
                            // Jeśli nie znaleziono po slug, szukaj po nazwie
                            if (!foundSlug) {
                              // Spróbuj znaleźć set po nazwie - najpierw dokładne dopasowanie, potem częściowe
                              const exactMatch = sets.find((s) => 
                                s.name.toUpperCase() === normalizedSetName.toUpperCase()
                              );
                              
                              if (exactMatch) {
                                foundSlug = exactMatch.slug;
                              } else {
                                // Spróbuj znaleźć set, którego nazwa jest zawarta w normalizedSetName lub odwrotnie
                                const partialMatch = sets.find((s) => 
                                  s.name.toUpperCase().includes(normalizedSetName.toUpperCase()) ||
                                  normalizedSetName.toUpperCase().includes(s.name.toUpperCase())
                                );
                                
                                if (partialMatch) {
                                  foundSlug = partialMatch.slug;
                                } else {
                                  // Jeśli nie znaleziono, spróbuj stworzyć slug z normalizedSetName i znaleźć pasujący
                                  const derivedSlug = slugify(`english-${normalizedSetName}`);
                                  
                                  // Sprawdź, czy slug istnieje w bazie
                                  const exactSlugMatch = sets.find((s) => s.slug === derivedSlug);
                                  if (exactSlugMatch) {
                                    foundSlug = derivedSlug;
                                  } else {
                                    // Spróbuj znaleźć slug, który zawiera część normalizedSetName (np. "skyridge")
                                    const slugPart = normalizedSetName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                    const fuzzySlugMatch = sets.find((s) => 
                                      s.slug.includes(slugPart) ||
                                      slugPart.includes(s.slug.replace('english-', ''))
                                    );
                                    if (fuzzySlugMatch) {
                                      foundSlug = fuzzySlugMatch.slug;
                                    }
                                  }
                                }
                              }
                            }
                            
                            if (foundSlug) {
                              setSelectedSetSlug(foundSlug);
                            } else {
                              // Zapisz jako pending - useEffect spróbuje znaleźć po załadowaniu sets
                              setPendingSetName(normalizedSetName);
                            }
                          } else {
                            // Sets nie są jeszcze załadowane - zapisz jako pending
                            setPendingSetName(normalizedSetName);
                            // Nie ustawiamy slug, jeśli sets nie są załadowane - poczekamy na useEffect
                          }
                        }
                        
                        // Ustaw Card Name
                        if (d.card_name) {
                          setCardName(d.card_name);
                        }
                        
                        // Ustaw Year
                        if (d.year) {
                          setYear(d.year);
                        }
                        
                        // Ustaw Grade - normalizuj, aby wyciągnąć tylko numer (np. "GEM MT 10" -> "10")
                        if (d.grade) {
                          // Wyciągnij tylko numer z grade (np. "GEM MT 10" -> "10", "MINT 9" -> "9")
                          const gradeMatch = d.grade.match(/(\d+(?:\.\d)?)/);
                          const normalizedGrade = gradeMatch ? gradeMatch[1] : d.grade;
                          setGrade(normalizedGrade);
                        }
                        
                        // Ustaw Card Number - zapisz do użycia w useEffect gdy cards się załadują
                        if (d.card_number) {
                          setVerifiedCardNumber(d.card_number);
                        }
                        
                        // Ustaw Image URL
                        if (d.image_url) {
                          setUploadedImages((prev) => {
                            if (prev.includes(d.image_url as string)) return prev;
                            return [...prev, d.image_url as string];
                          });
                        }
                        
                        toast({
                          title: response.verified && response.valid ? "Certyfikat zweryfikowany" : "Dane z certyfikatu odczytane",
                          description: response.verified && response.valid
                            ? "Dane karty wstępnie uzupełnione"
                            : "Uzupełniłem pola na podstawie certyfikatu (bez pełnej weryfikacji).",
                        });
                      } else {
                        // Brak użytecznych danych - pokaż komunikat i pozwól kontynuować ręcznie
                        const errorMsg = response.error || "Nie udało się zweryfikować certyfikatu";
                        toast({
                          title: "Weryfikacja nieudana",
                          description: `${errorMsg}. Możesz kontynuować i uzupełnić dane ręcznie.`,
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

              <div className="space-y-2">
                <Label htmlFor="grade">{t('sell.grade')}</Label>
                <Input
                  id="grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g., 10"
                />
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Grade from the grading certificate
                </p>
              </div>

              {/* Language Selection */}
              {selectedCardId && availableLanguages.length > 0 && (
                <div className="space-y-2">
                  <Label>Language</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableLanguages.map((lang) => {
                      const flagEmoji: Record<string, string> = {
                        english: '🇬🇧',
                        polish: '🇵🇱',
                        japanese: '🇯🇵',
                        french: '🇫🇷',
                        german: '🇩🇪',
                        spanish: '🇪🇸',
                        italian: '🇮🇹',
                        portuguese: '🇵🇹',
                        korean: '🇰🇷',
                        chinese: '🇨🇳',
                      };
                      return (
                        <label
                          key={lang}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors cursor-pointer ${
                            selectedLanguage === lang
                              ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-900 dark:text-blue-100'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Checkbox
                            checked={selectedLanguage === lang}
                            onCheckedChange={(checked) => {
                              setSelectedLanguage(checked ? lang : null);
                            }}
                          />
                          <span>{flagEmoji[lang] || '🌐'}</span>
                          <span className="capitalize">{lang}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Variant Selection - show all variants when card is selected */}
              {selectedCardId && (
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
                          id="holo"
                          checked={holo}
                          onCheckedChange={(checked) => setHolo(checked === true)}
                        />
                        <Label htmlFor="holo" className="font-normal cursor-pointer">Holo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="reverseHolo"
                          checked={reverseHolo}
                          onCheckedChange={(checked) => setReverseHolo(checked === true)}
                        />
                        <Label htmlFor="reverseHolo" className="font-normal cursor-pointer">Reverse</Label>
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
              )}

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
                      {(url.includes("psacard.com") || url.includes("images.psacard.com")) && (
                        <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">
                          Źródło: PSA
                        </span>
                      )}
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="price">{t('sell.priceUSD')}</Label>
                  {cardName && grade && gradingCompany && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          setLoadingRecommendation(true);
                          setShowRecommendation(true);
                          const recommendation = await priceRecommendationService.getPriceRecommendation({
                            name: cardName,
                            set_name: selectedSetSlug ? sets.find(s => s.slug === selectedSetSlug)?.name : null,
                            grade: grade,
                            grading_company_id: gradingCompany,
                            currentPrice: price || undefined,
                          });
                          setPriceRecommendation(recommendation);
                          // Optionally auto-fill recommended price
                          if (recommendation.recommendedPrice > 0 && !price) {
                            setPrice(recommendation.recommendedPrice);
                          }
                        } catch (error) {
                          console.error("Error getting price recommendation:", error);
                          toast({
                            title: "Error",
                            description: "Failed to get price recommendation",
                            variant: "destructive",
                          });
                        } finally {
                          setLoadingRecommendation(false);
                        }
                      }}
                      disabled={loadingRecommendation || !cardName || !grade || !gradingCompany}
                    >
                      {loadingRecommendation ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Get Price Recommendation
                        </>
                      )}
                    </Button>
                  )}
                </div>
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

              {/* Price Recommendation Card */}
              {showRecommendation && priceRecommendation && (
                <Card className={`border-2 ${
                  priceRecommendation.confidence === "high" 
                    ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20"
                    : priceRecommendation.confidence === "medium"
                    ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                }`}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                      Price Recommendation
                      <Badge variant={priceRecommendation.confidence === "high" ? "default" : "secondary"}>
                        {priceRecommendation.confidence} confidence
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-blue-600">
                        ${priceRecommendation.recommendedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">recommended</span>
                      {priceRecommendation.currentPrice && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 dark:text-slate-400">
                            Current: ${priceRecommendation.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Market Data Summary */}
                    {priceRecommendation.marketData.listingCount > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg">
                        <div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Average</div>
                          <div className="font-semibold">${priceRecommendation.marketData.averagePrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Median</div>
                          <div className="font-semibold">${priceRecommendation.marketData.medianPrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Range</div>
                          <div className="font-semibold text-sm">
                            ${priceRecommendation.marketData.minPrice.toLocaleString()} - ${priceRecommendation.marketData.maxPrice.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Listings</div>
                          <div className="font-semibold">{priceRecommendation.marketData.listingCount}</div>
                        </div>
                      </div>
                    )}

                    {/* Reasoning */}
                    <div>
                      <h4 className="font-semibold mb-2">Analysis:</h4>
                      <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                        {priceRecommendation.reasoning.map((reason, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Competitive Advice */}
                    {priceRecommendation.competitiveAdvice.lowestCompetitor && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2">
                          <DollarSign className="h-4 w-4 mt-0.5 text-blue-600" />
                          <div className="flex-1">
                            <div className="font-semibold text-sm mb-1">Competitive Analysis</div>
                            <div className="text-sm text-slate-700 dark:text-slate-300">
                              Lowest competitor: ${priceRecommendation.competitiveAdvice.lowestCompetitor.toLocaleString()}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {priceRecommendation.competitiveAdvice.recommendation}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Trend */}
                    {priceRecommendation.trend.direction !== "unknown" && (
                      <div className={`p-3 rounded-lg border ${
                        priceRecommendation.trend.direction === "up"
                          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                          : priceRecommendation.trend.direction === "down"
                          ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      }`}>
                        <div className="flex items-center gap-2">
                          {priceRecommendation.trend.direction === "up" ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : priceRecommendation.trend.direction === "down" ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : (
                            <Package className="h-4 w-4 text-slate-600" />
                          )}
                          <div className="flex-1">
                            <div className="font-semibold text-sm capitalize">
                              Market trend: {priceRecommendation.trend.direction}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {priceRecommendation.trend.changePercent > 0 ? "+" : ""}
                              {priceRecommendation.trend.changePercent.toFixed(1)}% change | {priceRecommendation.trend.recentSales} recent sales
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setPrice(priceRecommendation.recommendedPrice);
                      }}
                    >
                      Use Recommended Price
                    </Button>
                  </CardContent>
                </Card>
              )}
              
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
