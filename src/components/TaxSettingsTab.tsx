import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Save, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTaxSettings } from "@/hooks/useTaxSettings";
import { useProfile } from "@/hooks/useProfile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const TaxSettingsTab = () => {
  const { toast } = useToast();
  const { taxSettings, updateTaxSettings } = useTaxSettings();
  const { profile, updateProfile } = useProfile();
  
  const [settings, setSettings] = useState({
    province: "ON",
    personalTaxCredit: 15705,
    homeOfficePercentage: 0,
    otherCredits: 0,
    instalmentMethod: "not_required" as 'safe_harbour' | 'estimate' | 'not_required',
    safeHarbourTotalTaxLastYear: 0,
  });

  // Update local state when tax settings and profile are loaded
  useEffect(() => {
    if (taxSettings) {
      setSettings(prev => ({
        ...prev,
        province: taxSettings.province || "ON",
        personalTaxCredit: taxSettings.personal_tax_credit_amount || 15705,
        otherCredits: (taxSettings as any).other_credits || 0,
        instalmentMethod: taxSettings.instalment_method || 'not_required',
        safeHarbourTotalTaxLastYear: taxSettings.safe_harbour_total_tax_last_year || 0,
      }));
    }
  }, [taxSettings]);

  useEffect(() => {
    if (profile) {
      setSettings(prev => ({
        ...prev,
        homeOfficePercentage: profile.home_office_percentage || 0,
      }));
    }
  }, [profile]);

  const handleSaveTaxSettings = async () => {
    try {
      // Update tax settings
      await updateTaxSettings.mutateAsync({
        province: settings.province,
        personal_tax_credit_amount: settings.personalTaxCredit,
        instalment_method: settings.instalmentMethod,
        safe_harbour_total_tax_last_year: settings.instalmentMethod === 'safe_harbour' ? settings.safeHarbourTotalTaxLastYear : null,
        other_credits: settings.otherCredits,
      } as any);

      // Update profile for home office percentage
      if (profile && settings.homeOfficePercentage !== profile.home_office_percentage) {
        await updateProfile.mutateAsync({
          home_office_percentage: settings.homeOfficePercentage
        });
      }

      toast({
        title: "Tax Settings Updated",
        description: "Your tax settings and home office percentage have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tax settings.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tax Configuration */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Tax Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="province">Province/Territory</Label>
              <Select 
                value={settings.province} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, province: value }))}
              >
                <SelectTrigger className="border-green-200 focus:border-green-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ON">Ontario</SelectItem>
                  <SelectItem value="BC">British Columbia</SelectItem>
                  <SelectItem value="AB">Alberta</SelectItem>
                  <SelectItem value="QC">Quebec</SelectItem>
                  <SelectItem value="SK">Saskatchewan</SelectItem>
                  <SelectItem value="MB">Manitoba</SelectItem>
                  <SelectItem value="NB">New Brunswick</SelectItem>
                  <SelectItem value="NS">Nova Scotia</SelectItem>
                  <SelectItem value="PE">Prince Edward Island</SelectItem>
                  <SelectItem value="NL">Newfoundland and Labrador</SelectItem>
                  <SelectItem value="YT">Yukon</SelectItem>
                  <SelectItem value="NT">Northwest Territories</SelectItem>
                  <SelectItem value="NU">Nunavut</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Used for calculating provincial tax rates</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="personalTaxCredit">Basic Personal Amount</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The basic personal amount is a non-refundable tax credit that reduces the amount of income tax you pay. This amount varies by province and tax year.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="personalTaxCredit"
                type="number"
                value={settings.personalTaxCredit}
                onChange={(e) => setSettings(prev => ({ ...prev, personalTaxCredit: Number(e.target.value) }))}
                className="border-green-200 focus:border-green-400"
              />
              <p className="text-xs text-gray-500 mt-1">Current year basic personal amount for tax calculations</p>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="otherCredits">Other Tax Credits</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Additional tax credits such as RRSP contributions, charitable donations, or other eligible deductions.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="otherCredits"
                type="number"
                min="0"
                step="0.01"
                value={settings.otherCredits}
                onChange={(e) => setSettings(prev => ({ ...prev, otherCredits: Number(e.target.value) }))}
                className="border-green-200 focus:border-green-400"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">Additional credits (RRSP, charitable donations, etc.)</p>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="homeOfficePercentage">% of Home Used as Office</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the percentage of your home that's used as an office. This is applied to Shared Expenses (e.g. rent, utilities) in tax deductions.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="homeOfficePercentage"
                type="number"
                min="0"
                max="100"
                value={settings.homeOfficePercentage}
                onChange={(e) => setSettings(prev => ({ ...prev, homeOfficePercentage: Math.min(100, Math.max(0, Number(e.target.value))) }))}
                className="border-green-200 focus:border-green-400"
              />
              <p className="text-xs text-gray-500 mt-1">Percentage (0-100%)</p>
            </div>
          </CardContent>
        </Card>

        {/* Tax Instalment Settings */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-900 flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Tax Instalment Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="instalmentMethod">Tax Instalment Method</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Safe Harbour is best if you expect to earn more than last year. The CRA won't charge interest if you pay ¼ of last year's tax in each quarter.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select 
                value={settings.instalmentMethod} 
                onValueChange={(value: 'safe_harbour' | 'estimate' | 'not_required') => 
                  setSettings(prev => ({ ...prev, instalmentMethod: value }))
                }
              >
                <SelectTrigger className="border-orange-200 focus:border-orange-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_required">Not Required</SelectItem>
                  <SelectItem value="safe_harbour">Safe Harbour (Prior Year)</SelectItem>
                  <SelectItem value="estimate">Current Year Estimate</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Method for calculating quarterly tax instalments</p>
            </div>

            {settings.instalmentMethod === 'safe_harbour' && (
              <div>
                <Label htmlFor="safeHarbourAmount">Enter the total tax you owed last year (from your Notice of Assessment)</Label>
                <Input
                  id="safeHarbourAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.safeHarbourTotalTaxLastYear}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    safeHarbourTotalTaxLastYear: Number(e.target.value) 
                  }))}
                  className="border-orange-200 focus:border-orange-400 mt-1"
                  placeholder="Enter total tax amount"
                />
                <p className="text-xs text-gray-500 mt-1">This amount will be used to calculate quarterly instalments</p>
              </div>
            )}

            <Button 
              onClick={handleSaveTaxSettings}
              className="bg-green-600 hover:bg-green-700 w-full"
              disabled={updateTaxSettings.isPending || updateProfile.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {(updateTaxSettings.isPending || updateProfile.isPending) ? "Saving..." : "Save Tax Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 text-sm">Tax Calculation Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>• Tax calculations are estimates based on current rates and may not reflect all applicable deductions or credits.</p>
            <p>• Provincial tax rates and basic personal amounts are updated annually.</p>
            <p>• Consult with a tax professional for comprehensive tax planning.</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-900 text-sm">Instalment Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>• Instalments are typically required if you owe more than $3,000 in tax.</p>
            <p>• Safe harbour method uses 25% of prior year's total tax per quarter.</p>
            <p>• Current year estimate method uses projected current year tax liability.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};