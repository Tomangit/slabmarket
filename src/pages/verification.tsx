// Verification guide page - How to spot fake slabs
import { useTranslations } from "next-intl";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, ExternalLink, Youtube, Search, Star, Ban, CreditCard, Flag, Lock, UserCheck, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function VerificationPage() {
  const t = useTranslations();

  const verificationImages = [
    {
      src: "https://i.ytimg.com/vi/qfFUV0EcgRI/maxresdefault.jpg",
      alt: "Fake PSA slab comparison",
      title: "Fake vs Real PSA Slab Comparison",
    },
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmJoPXTdMWfpU2TSmCNKQ1J6hP9LXp94Dya6n7xfC6d-LgTUDoZ5icHetHpwbdmNc1lfQ&usqp=CAU",
      alt: "Fake slab identification guide",
      title: "Visual Guide to Spot Fake Slabs",
    },
    {
      src: "https://external-preview.redd.it/a-close-up-look-at-the-fake-psa-slabs-that-have-been-v0-o4yoIYJ3iHCpdilwrFPOZZzApsq3DDTi46QaCWRD1ms.jpg?auto=webp&s=80cebbdd851660438fa835bf4b25b56a94c0e816",
      alt: "Close-up of fake PSA slabs",
      title: "Close-up View of Fake PSA Slabs",
    },
    {
      src: "https://i.redd.it/visual-guide-how-to-spot-fake-psa-slabs-2025-v0-te1hhpdpvjqe1.jpg?width=1211&format=pjpg&auto=webp&s=9d672bf2d3d7b530e596e356054026a93807d1bf",
      alt: "Visual guide how to spot fake PSA slabs 2025",
      title: "2025 Visual Guide: How to Spot Fake PSA Slabs",
    },
  ];

  const redFlags = [
    t("verification.redFlag1"),
    t("verification.redFlag2"),
    t("verification.redFlag3"),
    t("verification.redFlag4"),
    t("verification.redFlag5"),
    t("verification.redFlag6"),
    t("verification.redFlag7"),
    t("verification.redFlag8"),
  ];

  const verificationSteps = [
    {
      step: 1,
      title: t("verification.step1"),
      description: t("verification.step1Desc"),
      icon: Search,
    },
    {
      step: 2,
      title: t("verification.step2"),
      description: t("verification.step2Desc"),
      icon: CheckCircle2,
    },
    {
      step: 3,
      title: t("verification.step3"),
      description: t("verification.step3Desc"),
      icon: ShieldCheck,
    },
    {
      step: 4,
      title: t("verification.step4"),
      description: t("verification.step4Desc"),
      icon: CheckCircle2,
    },
    {
      step: 5,
      title: t("verification.step5"),
      description: t("verification.step5Desc"),
      icon: CheckCircle2,
    },
  ];

  const officialSites = [
    {
      name: "PSA",
      url: "https://www.psacard.com/cert/",
      description: t("verification.psaSite"),
    },
    {
      name: "BGS",
      url: "https://www.beckett.com/grading/card-lookup",
      description: t("verification.bgsSite"),
    },
    {
      name: "CGC",
      url: "https://www.cgccards.com/certlookup/",
      description: t("verification.cgcSite"),
    },
    {
      name: "SGC",
      url: "https://sgcgrading.com/",
      description: t("verification.sgcSite"),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader currentPage="verification" />

      <div className="container mx-auto px-4 py-10 flex-1 w-full max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold">{t("verification.title")}</h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl">
            {t("verification.subtitle")}
          </p>
        </div>

        {/* Platform Protection */}
        <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-6 w-6" />
              {t("verification.platformProtectionTitle")}
            </CardTitle>
            <CardDescription className="text-slate-700 dark:text-slate-300">
              {t("verification.platformProtectionDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="space-y-3 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold text-base">{t("verification.sellerRatings")}</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t("verification.sellerRatingsDesc")}
                </p>
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-base">{t("verification.scammerProtection")}</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t("verification.scammerProtectionDesc")}
                </p>
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-base">{t("verification.paymentProtection")}</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t("verification.paymentProtectionDesc")}
                </p>
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-base">{t("verification.reportSystem")}</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t("verification.reportSystemDesc")}
                </p>
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-base">{t("verification.escrowProtection")}</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t("verification.escrowProtectionDesc")}
                </p>
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-base">{t("verification.verifiedSellers")}</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t("verification.verifiedSellersDesc")}
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t("verification.disputeResolution")}
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                {t("verification.disputeResolutionDesc")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("verification.guideTitle")}</CardTitle>
            <CardDescription>{t("verification.guideSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {t("verification.introduction")}
            </p>
          </CardContent>
        </Card>

        {/* Verification Images */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Visual Examples</CardTitle>
            <CardDescription>
              Compare these images to identify fake slabs. Click on images to view in full size.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {verificationImages.map((image, index) => (
                <div key={index} className="space-y-2">
                  <a
                    href={image.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="relative w-full h-64 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors cursor-pointer">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ExternalLink className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </a>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {image.title}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Verification Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("verification.verificationSteps")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {verificationSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.step} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold">
                        {step.step}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">{step.title}</h3>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Key Points */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("verification.keyPoints")}</CardTitle>
            <CardDescription>
              Important features to check when verifying a graded slab
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-base">
                    {t("verification.certificateNumber")}
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm pl-7">
                  {t("verification.certificateNumberDesc")}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-base">
                    {t("verification.labelQuality")}
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm pl-7">
                  {t("verification.labelQualityDesc")}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-base">
                    {t("verification.slabMaterial")}
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm pl-7">
                  {t("verification.slabMaterialDesc")}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-base">
                    {t("verification.holograms")}
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm pl-7">
                  {t("verification.hologramsDesc")}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-base">
                    {t("verification.labelAlignment")}
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm pl-7">
                  {t("verification.labelAlignmentDesc")}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-base">
                    {t("verification.fontAndSpacing")}
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm pl-7">
                  {t("verification.fontAndSpacingDesc")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Red Flags */}
        <Card className="mb-8 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              {t("verification.redFlags")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {redFlags.map((flag, index) => (
                <li key={index} className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">{flag}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* YouTube Videos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-600" />
              Video Tutorials
            </CardTitle>
            <CardDescription>{t("verification.resources")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
                asChild
              >
                <a
                  href="https://www.youtube.com/watch?v=Wt02y3FjHaI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3"
                >
                  <Youtube className="h-6 w-6 text-red-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold">{t("verification.watchVideo1")}</div>
                    <div className="text-xs text-slate-500 mt-1">YouTube Tutorial</div>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto flex-shrink-0" />
                </a>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
                asChild
              >
                <a
                  href="https://www.youtube.com/watch?v=zoqpp2LK0uw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3"
                >
                  <Youtube className="h-6 w-6 text-red-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold">{t("verification.watchVideo2")}</div>
                    <div className="text-xs text-slate-500 mt-1">YouTube Tutorial</div>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto flex-shrink-0" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Official Verification Sites */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("verification.officialSites")}</CardTitle>
            <CardDescription>
              Always verify certificates on official grading company websites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {officialSites.map((site) => (
                <Button
                  key={site.name}
                  variant="outline"
                  className="w-full justify-between h-auto p-4"
                  asChild
                >
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3"
                  >
                    <div className="text-left">
                      <div className="font-semibold">{site.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{site.description}</div>
                    </div>
                    <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grading Company Specific Guides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("verification.psaSection")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                {t("verification.psaDescription")}
              </p>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>PSA labels have a distinctive blue and white design</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Certificate numbers are 8-10 digits</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>PSA hologram is present on authentic slabs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Label text is crisp and properly aligned</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("verification.bgsSection")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                {t("verification.bgsDescription")}
              </p>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>BGS labels have a black and gold design</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Subgrades are displayed for BGS slabs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>BGS hologram and security features are present</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Slab thickness and clarity match official specs</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("verification.cgcSection")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                {t("verification.cgcDescription")}
              </p>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>CGC labels have a distinctive design with clear branding</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Certificate numbers follow CGC format</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>CGC security features and holograms are present</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Label quality and alignment match official standards</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* How to Report */}
        <Card className="mb-8 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Flag className="h-5 w-5" />
              {t("verification.howToReport")}
            </CardTitle>
            <CardDescription>
              {t("verification.howToReportDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 font-bold text-sm">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 dark:text-slate-300">
                    {t("verification.reportStep1")}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 font-bold text-sm">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 dark:text-slate-300">
                    {t("verification.reportStep2")}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 font-bold text-sm">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 dark:text-slate-300">
                    {t("verification.reportStep3")}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 font-bold text-sm">
                    4
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 dark:text-slate-300">
                    {t("verification.reportStep4")}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 font-bold text-sm">
                    5
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 dark:text-slate-300 font-semibold">
                    {t("verification.reportStep5")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button className="w-full md:w-auto" asChild>
                <Link href="/support/disputes">
                  <Flag className="mr-2 h-4 w-4" />
                  {t("verification.reportFake")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Alert className="mb-8">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>{t("verification.needHelp")}</AlertTitle>
          <AlertDescription>
            <p className="mb-3">{t("verification.contactSupport")}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/support/disputes">
                  <Flag className="mr-2 h-4 w-4" />
                  {t("verification.reportFake")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://www.psacard.com/cert/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Verify PSA Certificate
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>

      <Footer />
    </div>
  );
}

