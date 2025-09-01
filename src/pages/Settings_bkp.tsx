import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { User, CreditCard, Save, Info, Settings2, Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useTaxSettings } from "@/hooks/useTaxSettings";
import { useCategorization, CategorizationRule } from "@/hooks/useCategorization";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation } from "react-router-dom";
import { TaxSettingsTab } from "@/components/TaxSettingsTab";
import { createClient } from "@supabase/supabase-js";

// Extend the Window interface to include Plaid
declare global {
  interface Window {
    Plaid?: any;
  }
}

const categoryMappings = {
  business_income: {
    categories: ['OHIP', 'Fee for Service/Locum', 'Honoraria', 'AFP Funding', 'ER/On-Call Coverage', 'Recruiting Bonus', 'Stipend', 'CMPA Reimbursements', 'Other'],
    subcategories: {}
  },
  business_expense: {
    categories: ['CME', 'Fees & Insurance', 'Office Expenses or Supplies', 'Auto Expense', 'Parking'],
    subcategories: {
      'CME': ['Books, Subscriptions, Journals', 'Professional Development/CME', 'Travel & Conference', 'Meals & Entertainment'],
      'Fees & Insurance': ['CMPA Insurance', 'Insurance - Prof Overhead Expense', 'Professional Association Fees', 'Private Health Plan Premiums', 'Accounting & Legal', 'Bank Fees or Interest', 'Insurance - Home Office'],
      'Office Expenses or Supplies': ['Capital Assets (Computer, Desk etc)', 'Office Supplies', 'Salary to Secretary', 'Shared Overhead', 'Patient Medical/Drug Supplies', 'Gifts for Staff/Colleagues', 'Office - Telecom', 'Office - Internet', 'Meals & Entertainment GATE', 'Insurance - Office'],
      'Auto Expense': ['Gas', 'Repairs', 'Insurance (Auto)', 'Licensing Fees', 'Finance/Lease Payment'],
      'Parking': ['Parking']
    }
  },
  personal_expense: {
    categories: ['Shared Business', 'Personal', 'Parking'],
    subcategories: {
      'Shared Business': ['Rent/Mortgage', 'Hydro', 'Gas (Utilities)', 'Hot Water Heater', 'Property Tax', 'Water', 'Home Insurance', 'Cleaning Service', 'Other'],
      'Personal': ['Other'],
      'Parking': ['Parking']
    }
  }
};

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { taxSettings, updateTaxSettings } = useTaxSettings();
  const { rules, createRule, updateRule, deleteRule } = useCategorization();
  const { transactions, updateTransaction } = useTransactions();
  const location = useLocation();
  
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    province: "ontario",
  });

  const [newRule, setNewRule] = useState({
    type: 'business_expense' as const,
    match_type: 'contains' as const,
    match_text: '',
    category: '',
    subcategory: ''
  });

  const [editingRule, setEditingRule] = useState<CategorizationRule | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isPlaidDialogOpen, setIsPlaidDialogOpen] = useState(false);
  const [plaidLinkToken, setPlaidLinkToken] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [supabase, setSupabase] = useState<any>(null); // State to hold Supabase client

  const getActiveTab = () => {
    const hash = location.hash.slice(1);
    if (hash === 'automations') return 'automations';
    if (hash === 'tax-settings') return 'tax-settings';
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  // Initialize Supabase client when component mounts
  useEffect(() => {
    const initSupabase = () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (supabaseUrl && supabaseKey) {
        setSupabase(createClient(supabaseUrl, supabaseKey));
      } else {
        toast({
          title: "Error",
          description: "Supabase configuration is missing. Check environment variables.",
          variant: "destructive",
        });
      }
    };
    initSupabase();
  }, [toast]);

  useEffect(() => {
    const fetchConnectedAccounts = async () => {
      if (!user || !supabase) return;
      
      setIsLoadingAccounts(true);
      const { data, error } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load connected accounts.",
          variant: "destructive",
        });
      } else {
        setConnectedAccounts(data || []);
      }
      setIsLoadingAccounts(false);
    };

    fetchConnectedAccounts();
  }, [user, toast, supabase]);

  const fetchPlaidLinkToken = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    try {
      if (!supabase) throw new Error("Supabase client not initialized");
      const { data, error } = await supabase.functions.invoke('create_link_token', {
        body: { user_id: user?.id },
      });

      if (error) throw error;

      setPlaidLinkToken(data.link_token);
    } catch (error) {
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        await fetchPlaidLinkToken(retryCount + 1);
      } else {
        toast({
          title: "Error",
          description: "Failed to initialize Plaid Link after multiple attempts. Check Supabase Edge Function setup or contact support.",
          variant: "destructive",
        });
      }
    }
  }, [toast, user?.id, supabase]);

  const initializePlaidLink = useCallback(() => {
    if (!plaidLinkToken || !window.Plaid) {
      toast({
        title: "Error",
        description: "Plaid Link token or library not available. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const plaid = window.Plaid.create({
      token: plaidLinkToken,
      onSuccess: (publicToken: string, metadata: any) => handlePlaidSuccess(publicToken, metadata),
      onExit: (err: any, metadata: any) => {
        if (err) {
          toast({
            title: "Error",
            description: "Failed to connect account. Please try again.",
            variant: "destructive",
          });
        }
        setIsPlaidDialogOpen(false);
      },
      onEvent: (eventName: string, metadata: any) => console.log("Plaid Link Event:", eventName, metadata),
    });

    plaid.open();
  }, [plaidLinkToken, toast]);

  const handlePlaidSuccess = async (publicToken: string, metadata: any) => {
    try {
      if (!supabase) throw new Error("Supabase client not initialized");
      const { data, error } = await supabase.functions.invoke('exchange_public_token', {
        body: { public_token: publicToken, metadata },
      });

      if (error) throw error;

      const { data: accounts, error: fetchError } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setConnectedAccounts(accounts || []);

      setIsPlaidDialogOpen(false);

      toast({
        title: "Account Connected",
        description: `Successfully connected ${metadata.institution.name} account.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect account.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isPlaidDialogOpen) {
      if (window.Plaid) {
        fetchPlaidLinkToken();
      } else {
        const script = document.createElement("script");
        script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
        script.async = true;
        script.onload = () => fetchPlaidLinkToken();
        script.onerror = () => toast({
          title: "Error",
          description: "Failed to load Plaid library. Check network or CSP.",
          variant: "destructive",
        });
        document.head.appendChild(script);
      }
    }

    return () => setPlaidLinkToken(null);
  }, [isPlaidDialogOpen, fetchPlaidLinkToken, toast]);

  useEffect(() => {
    if (user) setUserInfo(prev => ({ ...prev, email: user.email || "" }));
  }, [user]);

  useEffect(() => {
    if (profile) setUserInfo(prev => ({ ...prev, name: profile.name || "" }));
  }, [profile]);

  useEffect(() => {
    if (taxSettings) setUserInfo(prev => ({ ...prev, province: taxSettings.province === 'ON' ? 'ontario' : taxSettings.province }));
  }, [taxSettings]);

  useEffect(() => setActiveTab(getActiveTab()), [location.hash]);

  const handleSaveProfile = async () => {
    try {
      if (profile && userInfo.name !== profile.name) {
        await updateProfile.mutateAsync({ name: userInfo.name });
      }

      toast({
        title: "Profile Updated",
        description: "Your profile settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile settings.",
        variant: "destructive",
      });
    }
  };

  const handleAddRule = async () => {
    if (!newRule.match_text || !newRule.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createRule.mutateAsync(newRule);
      setNewRule({ type: 'business_expense', match_type: 'contains', match_text: '', category: '', subcategory: '' });
      setIsAddDialogOpen(false);
      toast({
        title: "Rule Added",
        description: "Categorization rule has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create categorization rule.",
        variant: "destructive",
      });
    }
  };

  const handleEditRule = async () => {
    if (!editingRule) return;

    try {
      await updateRule.mutateAsync(editingRule);
      setEditingRule(null);
      setIsEditDialogOpen(false);
      toast({
        title: "Rule Updated",
        description: "Categorization rule has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update categorization rule.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteRule.mutateAsync(id);
      toast({
        title: "Rule Deleted",
        description: "Categorization rule has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete categorization rule.",
        variant: "destructive",
      });
    }
  };

  const getAvailableCategories = (type: string) => categoryMappings[type as keyof typeof categoryMappings]?.categories || [];
  const getAvailableSubcategories = (type: string, category: string) => categoryMappings[type as keyof typeof categoryMappings]?.subcategories[category] || [];

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedRules(checked ? new Set(rules.map(rule => rule.id)) : new Set());
  };

  const handleSelectRule = (ruleId: string, checked: boolean) => {
    const newSelected = new Set(selectedRules);
    checked ? newSelected.add(ruleId) : newSelected.delete(ruleId);
    setSelectedRules(newSelected);
    setSelectAll(newSelected.size === rules.length && rules.length > 0);
  };

  const handleApplySelectedRules = async () => {
    if (selectedRules.size === 0) return;

    try {
      const selectedRuleObjects = rules.filter(rule => selectedRules.has(rule.id));
      const uncategorizedTransactions = transactions.filter(transaction => 
        !transaction.expense_category && !transaction.expense_subcategory && !transaction.income_source
      );

      let updatedCount = 0;

      for (const transaction of uncategorizedTransactions) {
        if (!transaction.description) continue;

        const description = transaction.description.toLowerCase();
        
        for (const rule of selectedRuleObjects) {
          const matchText = rule.match_text.toLowerCase();
          let isMatch = false;

          if (rule.match_type === 'contains') isMatch = description.includes(matchText);
          else if (rule.match_type === 'equals') isMatch = description === matchText;

          if (isMatch) {
            const updates: any = {};
            
            if (rule.type === 'business_expense') {
              updates.expense_type = 'business';
              updates.expense_category = rule.category;
              if (rule.subcategory) updates.expense_subcategory = rule.subcategory;
            } else if (rule.type === 'personal_expense') {
              updates.expense_type = 'personal';
              updates.expense_category = rule.category;
              if (rule.subcategory) updates.expense_subcategory = rule.subcategory;
            } else if (rule.type === 'business_income') {
              updates.income_source = rule.category;
            }

            await updateTransaction.mutateAsync({ id: transaction.id, updates });
            updatedCount++;
            break;
          }
        }
      }

      toast({
        title: "Rules Applied Successfully",
        description: `Updated ${updatedCount} transaction${updatedCount !== 1 ? 's' : ''} using ${selectedRules.size} selected rule${selectedRules.size !== 1 ? 's' : ''}.`,
      });

      setSelectedRules(new Set());
      setSelectAll(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply categorization rules.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your profile and automations</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          <TabsTrigger value="tax-settings">Tax Settings</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userInfo.email}
                    disabled
                    className="border-blue-200 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                
                <div>
                  <Label htmlFor="province">Province</Label>
                  <Select value={userInfo.province} onValueChange={(value) => setUserInfo(prev => ({ ...prev, province: value }))}>
                    <SelectTrigger className="border-blue-200 focus:border-blue-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ontario">Ontario</SelectItem>
                      <SelectItem value="british-columbia">British Columbia</SelectItem>
                      <SelectItem value="alberta">Alberta</SelectItem>
                      <SelectItem value="quebec">Quebec</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleSaveProfile}
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                  disabled={updateProfile.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfile.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-teal-200">
              <CardHeader>
                <CardTitle className="text-teal-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Connected Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingAccounts ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 mx-auto animate-spin text-teal-600" />
                    <p className="text-sm text-gray-600 mt-2">Loading accounts...</p>
                  </div>
                ) : connectedAccounts.length === 0 ? (
                  <div className="text-center py-4 text-gray-600">
                    <p>No connected accounts yet.</p>
                  </div>
                ) : (
                  connectedAccounts.map((account) => (
                    <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{account.institution}</h4>
                          <p className="text-sm text-gray-600">{account.account_type}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {account.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">Last sync: {new Date(account.last_sync).toLocaleString()}</p>
                    </div>
                  ))
                )}
                
                <Dialog open={isPlaidDialogOpen} onOpenChange={setIsPlaidDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-teal-300 text-teal-600 hover:bg-teal-50">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Add New Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Connect a Bank Account</DialogTitle>
                      <DialogDescription>
                        Securely connect your bank account using Plaid to access financial data and transactions.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Button 
                        className="w-full bg-teal-600 hover:bg-teal-700"
                        onClick={initializePlaidLink}
                        disabled={!plaidLinkToken || !window.Plaid}
                      >
                        {plaidLinkToken && window.Plaid ? "Connect with Plaid" : "Loading Plaid..."}
                      </Button>
                    </div>
                    <DialogFooter>
                      <p className="text-xs text-gray-500">
                        By connecting, you agree to Plaid's{' '}
                        <a 
                          href="https://plaid.com/legal/#end-user-privacy-policy" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Privacy Policy
                        </a>.
                      </p>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tax-settings" className="space-y-6">
          <TaxSettingsTab />
        </TabsContent>

        <TabsContent value="automations" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-900 flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Transaction Categorization Rules
              </CardTitle>
              <p className="text-sm text-gray-600">
                Automatically categorize transactions based on description patterns
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-900">Active Rules ({rules.length})</h4>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rule
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Add Categorization Rule</DialogTitle>
                      <DialogDescription>
                        Create a rule to automatically categorize transactions based on their description.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="match_text" className="text-right">Transaction Description</Label>
                        <Input
                          id="match_text"
                          value={newRule.match_text}
                          onChange={(e) => setNewRule(prev => ({ ...prev, match_text: e.target.value }))}
                          className="col-span-3"
                          placeholder="e.g., Tim Hortons, Gas Station"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="match_type" className="text-right">Match Type</Label>
                        <Select value={newRule.match_type} onValueChange={(value: any) => setNewRule(prev => ({ ...prev, match_type: value }))}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="equals">Equals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">Type</Label>
                        <Select value={newRule.type} onValueChange={(value: any) => setNewRule(prev => ({ ...prev, type: value, category: '', subcategory: '' }))}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="business_income">Business Income</SelectItem>
                            <SelectItem value="business_expense">Business Expense</SelectItem>
                            <SelectItem value="personal_expense">Personal Expense</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Category</Label>
                        <Select value={newRule.category} onValueChange={(value) => setNewRule(prev => ({ ...prev, category: value, subcategory: '' }))}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableCategories(newRule.type).map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {((newRule.type === 'business_expense') || (newRule.type === 'personal_expense' && newRule.category !== 'Personal')) && getAvailableSubcategories(newRule.type, newRule.category).length > 0 && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="subcategory" className="text-right">Subcategory</Label>
                          <Select value={newRule.subcategory} onValueChange={(value) => setNewRule(prev => ({ ...prev, subcategory: value }))}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select subcategory (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableSubcategories(newRule.type, newRule.category).map(subcat => (
                                <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleAddRule} disabled={createRule.isPending}>
                        {createRule.isPending ? "Creating..." : "Create Rule"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {selectedRules.size > 0 && (
                <div className="mb-4">
                  <Button 
                    variant="default" 
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleApplySelectedRules}
                    disabled={updateTransaction.isPending}
                  >
                    {updateTransaction.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {updateTransaction.isPending ? "Applying Rules..." : `Apply Selected Rules (${selectedRules.size})`}
                  </Button>
                </div>
              )}

              {rules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No categorization rules configured yet.</p>
                  <p className="text-sm">Create your first rule to start automating transaction categorization.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all rules"
                        />
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Subcategory</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRules.has(rule.id)}
                            onCheckedChange={(checked) => handleSelectRule(rule.id, checked as boolean)}
                            aria-label={`Select rule for ${rule.match_text}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {rule.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">{rule.match_text}</span>
                            <div className="text-xs text-gray-500">({rule.match_type})</div>
                          </div>
                        </TableCell>
                        <TableCell>{rule.category}</TableCell>
                        <TableCell>{rule.subcategory || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Dialog open={isEditDialogOpen && editingRule?.id === rule.id} onOpenChange={(open) => {
                              setIsEditDialogOpen(open);
                              if (!open) setEditingRule(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingRule(rule)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[525px]">
                                <DialogHeader>
                                  <DialogTitle>Edit Categorization Rule</DialogTitle>
                                  <DialogDescription>
                                    Update the rule for automatic transaction categorization.
                                  </DialogDescription>
                                </DialogHeader>
                                {editingRule && (
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="edit_type" className="text-right">Type</Label>
                                      <Select value={editingRule.type} onValueChange={(value: any) => setEditingRule(prev => prev ? { ...prev, type: value, category: '', subcategory: '' } : null)}>
                                        <SelectTrigger className="col-span-3">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="business_income">Business Income</SelectItem>
                                          <SelectItem value="business_expense">Business Expense</SelectItem>
                                          <SelectItem value="personal_expense">Personal Expense</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="edit_match_type" className="text-right">Match Type</Label>
                                      <Select value={editingRule.match_type} onValueChange={(value: any) => setEditingRule(prev => prev ? { ...prev, match_type: value } : null)}>
                                        <SelectTrigger className="col-span-3">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="contains">Contains</SelectItem>
                                          <SelectItem value="equals">Equals</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="edit_match_text" className="text-right">Match Text</Label>
                                      <Input
                                        id="edit_match_text"
                                        value={editingRule.match_text}
                                        onChange={(e) => setEditingRule(prev => prev ? { ...prev, match_text: e.target.value } : null)}
                                        className="col-span-3"
                                      />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="edit_category" className="text-right">Category</Label>
                                      <Select value={editingRule.category} onValueChange={(value) => setEditingRule(prev => prev ? { ...prev, category: value, subcategory: '' } : null)}>
                                        <SelectTrigger className="col-span-3">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {getAvailableCategories(editingRule.type).map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    {(editingRule.type === 'business_expense' || editingRule.type === 'personal_expense') && getAvailableSubcategories(editingRule.type, editingRule.category).length > 0 && (
                                      <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="edit_subcategory" className="text-right">Subcategory</Label>
                                        <Select value={editingRule.subcategory || ''} onValueChange={(value) => setEditingRule(prev => prev ? { ...prev, subcategory: value } : null)}>
                                          <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select subcategory (optional)" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {getAvailableSubcategories(editingRule.type, editingRule.category).map(subcat => (
                                              <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button type="submit" onClick={handleEditRule} disabled={updateRule.isPending}>
                                    {updateRule.isPending ? "Updating..." : "Update Rule"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRule(rule.id)}
                              disabled={deleteRule.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;