import { useState, useRef } from "react";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { bulkSlabService, type BulkImportResult } from "@/services/bulkSlabService";
import { Download, Upload, FileText, AlertCircle, CheckCircle2, XCircle, Loader2, DollarSign, Percent } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";

export default function BulkToolsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

  // Price update states
  const [priceUpdateCsv, setPriceUpdateCsv] = useState("");
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const [priceUpdateResult, setPriceUpdateResult] = useState<{
    success: number;
    failed: number;
    errors: Array<{ cert_number: string; error: string }>;
  } | null>(null);
  
  // Bulk price rule states
  const [priceRuleType, setPriceRuleType] = useState<"percentage" | "fixed">("percentage");
  const [priceRuleValue, setPriceRuleValue] = useState("");
  const [priceRuleStatus, setPriceRuleStatus] = useState("active");
  const [applyingRule, setApplyingRule] = useState(false);
  const [ruleResult, setRuleResult] = useState<{
    success: number;
    failed: number;
    errors: Array<{ cert_number: string; error: string }>;
  } | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    router.push("/auth/signin");
    return null;
  }

  const handleExport = async () => {
    if (!user) return;

    try {
      setExporting(true);
      const csv = await bulkSlabService.exportToCSV(user.id);

      // Create blob and download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `slabs-export-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Your slabs have been exported to CSV",
      });
    } catch (error) {
      console.error("Error exporting slabs:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export slabs",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!user || !csvContent) {
      toast({
        title: "Invalid input",
        description: "Please select a CSV file or paste CSV content",
        variant: "destructive",
      });
      return;
    }

    try {
      setImporting(true);
      const result = await bulkSlabService.importFromCSV(csvContent, user.id);
      setImportResult(result);

      if (result.success > 0) {
        toast({
          title: "Import successful",
          description: `Successfully imported ${result.success} slab(s)`,
        });
        // Clear CSV content after successful import
        setCsvContent("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }

      if (result.failed > 0) {
        toast({
          title: "Import completed with errors",
          description: `Failed to import ${result.failed} slab(s). Check errors below.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error importing slabs:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import slabs",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader currentPage="dashboard" />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/dashboard">← Back to Dashboard</Link>
          </Button>
          <h1 className="text-3xl font-bold mb-2">Bulk Tools</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Import or export multiple listings at once using CSV files
          </p>
        </div>

        <Tabs defaultValue="export" className="space-y-6">
          <TabsList>
            <TabsTrigger value="export">Export to CSV</TabsTrigger>
            <TabsTrigger value="import">Import from CSV</TabsTrigger>
            <TabsTrigger value="price-update">Bulk Price Update</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Listings to CSV</CardTitle>
                <CardDescription>
                  Download all your listings as a CSV file for backup or editing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button onClick={handleExport} disabled={exporting}>
                    {exporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export to CSV
                      </>
                    )}
                  </Button>
                </div>

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>CSV Format</AlertTitle>
                  <AlertDescription className="mt-2">
                    The exported CSV includes all listing fields:
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      <li>Certificate number, grade, grading company</li>
                      <li>Card name, set name, card number, year</li>
                      <li>Price, description, listing type, status</li>
                      <li>Edition variants (first edition, shadowless, etc.)</li>
                      <li>Subgrades (centering, corners, edges, surface)</li>
                      <li>Shipping options and protection settings</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Listings from CSV</CardTitle>
                <CardDescription>
                  Upload a CSV file or paste CSV content to create multiple listings at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-file">CSV File</Label>
                  <input
                    ref={fileInputRef}
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csv-content">Or paste CSV content</Label>
                  <Textarea
                    id="csv-content"
                    placeholder="Paste CSV content here..."
                    value={csvContent}
                    onChange={(e) => {
                      setCsvContent(e.target.value);
                      setImportResult(null);
                    }}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                <Button onClick={handleImport} disabled={importing || !csvContent.trim()}>
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Listings
                    </>
                  )}
                </Button>

                {importResult && (
                  <Alert
                    variant={importResult.failed === 0 ? "default" : "destructive"}
                  >
                    {importResult.failed === 0 ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {importResult.failed === 0
                        ? "Import Successful"
                        : "Import Completed with Errors"}
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Successfully imported: {importResult.success} listing(s)</span>
                        </div>
                        {importResult.failed > 0 && (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>Failed: {importResult.failed} listing(s)</span>
                          </div>
                        )}

                        {importResult.errors.length > 0 && (
                          <div className="mt-4">
                            <p className="font-semibold mb-2">Errors:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                              {importResult.errors.map((error, index) => (
                                <li key={index}>
                                  Row {error.row}: {error.error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Required Fields</AlertTitle>
                  <AlertDescription className="mt-2">
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>cert_number</strong> - Certificate number (required)</li>
                      <li><strong>grade</strong> - Grade (e.g., "10", "9.5") (required)</li>
                      <li><strong>grading_company</strong> - PSA, BGS, CGC, SGC, or ACE (required)</li>
                      <li><strong>name</strong> - Card name (required)</li>
                      <li><strong>set_name</strong> - Set name (required)</li>
                      <li><strong>price</strong> - Price in USD (required)</li>
                    </ul>
                    <p className="mt-2 text-sm">
                      All other fields are optional. Use "true"/"false" for boolean fields.
                    </p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="price-update" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Price Update</CardTitle>
                <CardDescription>
                  Update prices for multiple listings using CSV or percentage/fixed rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Option 1: CSV Price Update */}
                <div className="space-y-4 border-b pb-6">
                  <h3 className="text-lg font-semibold">Update from CSV</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Upload a CSV file with cert_number and price columns
                  </p>

                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          if (!user) return;
                          try {
                            setExporting(true);
                            const csv = await bulkSlabService.exportPriceUpdateTemplate(user.id);
                            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                            const link = document.createElement("a");
                            const url = URL.createObjectURL(blob);
                            link.setAttribute("href", url);
                            link.setAttribute("download", `price-update-template-${new Date().toISOString().split("T")[0]}.csv`);
                            link.style.visibility = "hidden";
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                            toast({
                              title: "Template exported",
                              description: "Price update template downloaded",
                            });
                          } catch (error) {
                            toast({
                              title: "Export failed",
                              description: error instanceof Error ? error.message : "Failed to export template",
                              variant: "destructive",
                            });
                          } finally {
                            setExporting(false);
                          }
                        }}
                        disabled={exporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price-csv-content">CSV Content (cert_number,price)</Label>
                      <Textarea
                        id="price-csv-content"
                        placeholder='cert_number,price\n"12345678",150.00\n"87654321",200.00'
                        value={priceUpdateCsv}
                        onChange={(e) => {
                          setPriceUpdateCsv(e.target.value);
                          setPriceUpdateResult(null);
                        }}
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </div>

                    <Button
                      onClick={async () => {
                        if (!user || !priceUpdateCsv.trim()) {
                          toast({
                            title: "Invalid input",
                            description: "Please paste CSV content",
                            variant: "destructive",
                          });
                          return;
                        }

                        try {
                          setUpdatingPrices(true);
                          const updates = bulkSlabService.parsePriceUpdateCSV(priceUpdateCsv);
                          if (updates.length === 0) {
                            toast({
                              title: "No valid updates",
                              description: "CSV file contains no valid price updates",
                              variant: "destructive",
                            });
                            return;
                          }

                          const result = await bulkSlabService.bulkUpdatePrices(updates, user.id);
                          setPriceUpdateResult(result);

                          if (result.success > 0) {
                            toast({
                              title: "Prices updated",
                              description: `Successfully updated ${result.success} price(s)`,
                            });
                            setPriceUpdateCsv("");
                          }

                          if (result.failed > 0) {
                            toast({
                              title: "Update completed with errors",
                              description: `Failed to update ${result.failed} price(s)`,
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Update failed",
                            description: error instanceof Error ? error.message : "Failed to update prices",
                            variant: "destructive",
                          });
                        } finally {
                          setUpdatingPrices(false);
                        }
                      }}
                      disabled={updatingPrices || !priceUpdateCsv.trim()}
                    >
                      {updatingPrices ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Update Prices from CSV
                        </>
                      )}
                    </Button>

                    {priceUpdateResult && (
                      <Alert
                        variant={priceUpdateResult.failed === 0 ? "default" : "destructive"}
                      >
                        {priceUpdateResult.failed === 0 ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>
                          {priceUpdateResult.failed === 0
                            ? "Update Successful"
                            : "Update Completed with Errors"}
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span>Successfully updated: {priceUpdateResult.success} price(s)</span>
                            </div>
                            {priceUpdateResult.failed > 0 && (
                              <>
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <span>Failed: {priceUpdateResult.failed} price(s)</span>
                                </div>
                                {priceUpdateResult.errors.length > 0 && (
                                  <div className="mt-2">
                                    <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                                      {priceUpdateResult.errors.map((error, index) => (
                                        <li key={index}>
                                          {error.cert_number}: {error.error}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                {/* Option 2: Rule-based Price Update */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Update by Rule</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Apply a percentage increase/decrease or fixed amount to all listings matching filters
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Update Type</Label>
                      <RadioGroup
                        value={priceRuleType}
                        onValueChange={(value) => setPriceRuleType(value as "percentage" | "fixed")}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="percentage" id="percentage" />
                          <Label htmlFor="percentage" className="cursor-pointer">
                            Percentage (%)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fixed" id="fixed" />
                          <Label htmlFor="fixed" className="cursor-pointer">
                            Fixed Amount ($)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rule-value">
                        {priceRuleType === "percentage" ? "Percentage Change" : "Fixed Amount"} 
                        {priceRuleType === "percentage" ? " (e.g., 10 for +10%, -5 for -5%)" : " (e.g., 10 for +$10, -5 for -$5)"}
                      </Label>
                      <Input
                        id="rule-value"
                        type="number"
                        step={priceRuleType === "percentage" ? "0.1" : "0.01"}
                        placeholder={priceRuleType === "percentage" ? "10" : "10.00"}
                        value={priceRuleValue}
                        onChange={(e) => setPriceRuleValue(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rule-status">Filter by Status</Label>
                      <Select value={priceRuleStatus} onValueChange={setPriceRuleStatus}>
                        <SelectTrigger id="rule-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active Listings</SelectItem>
                          <SelectItem value="pending">Pending Listings</SelectItem>
                          <SelectItem value="inactive">Inactive Listings</SelectItem>
                          <SelectItem value="all">All Listings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={async () => {
                        if (!user || !priceRuleValue.trim()) {
                          toast({
                            title: "Invalid input",
                            description: "Please enter a value",
                            variant: "destructive",
                          });
                          return;
                        }

                        const value = parseFloat(priceRuleValue);
                        if (isNaN(value)) {
                          toast({
                            title: "Invalid value",
                            description: "Please enter a valid number",
                            variant: "destructive",
                          });
                          return;
                        }

                        try {
                          setApplyingRule(true);
                          const result = await bulkSlabService.bulkUpdatePricesByRule(user.id, {
                            type: priceRuleType,
                            value,
                            filter: priceRuleStatus !== "all" ? { status: priceRuleStatus } : undefined,
                          });

                          setRuleResult(result);

                          if (result.success > 0) {
                            toast({
                              title: "Prices updated",
                              description: `Successfully updated ${result.success} listing(s)`,
                            });
                            setPriceRuleValue("");
                          }

                          if (result.failed > 0) {
                            toast({
                              title: "Update completed with errors",
                              description: `Failed to update ${result.failed} listing(s)`,
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Update failed",
                            description: error instanceof Error ? error.message : "Failed to update prices",
                            variant: "destructive",
                          });
                        } finally {
                          setApplyingRule(false);
                        }
                      }}
                      disabled={applyingRule || !priceRuleValue.trim()}
                      className="w-full"
                    >
                      {applyingRule ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Applying Rule...
                        </>
                      ) : (
                        <>
                          <Percent className="h-4 w-4 mr-2" />
                          Apply Price Rule
                        </>
                      )}
                    </Button>

                    {ruleResult && (
                      <Alert
                        variant={ruleResult.failed === 0 ? "default" : "destructive"}
                      >
                        {ruleResult.failed === 0 ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>
                          {ruleResult.failed === 0
                            ? "Update Successful"
                            : "Update Completed with Errors"}
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span>Successfully updated: {ruleResult.success} listing(s)</span>
                            </div>
                            {ruleResult.failed > 0 && (
                              <>
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <span>Failed: {ruleResult.failed} listing(s)</span>
                                </div>
                                {ruleResult.errors.length > 0 && (
                                  <div className="mt-2">
                                    <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                                      {ruleResult.errors.slice(0, 10).map((error, index) => (
                                        <li key={index}>
                                          {error.cert_number}: {error.error}
                                        </li>
                                      ))}
                                      {ruleResult.errors.length > 10 && (
                                        <li>... and {ruleResult.errors.length - 10} more errors</li>
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}

