// src/app/admin/settings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSettingsStore, useIsSettingsStoreHydrated, getAppSettings } from '@/stores/settings-store'; // Import getAppSettings
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator'; // Import Separator

// --- Zod Schemas ---

const generalSettingsSchema = z.object({
  appName: z.string().min(3, { message: "App name must be at least 3 characters" }),
  defaultCurrency: z.enum(['INR', 'USD', 'EUR']),
  timezone: z.string().min(1, { message: "Timezone is required" }), // Basic check, real validation is complex
});
type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;

const notificationSettingsSchema = z.object({
  enableEmail: z.boolean(),
  enableSMS: z.boolean(),
  adminEmail: z.string().email({ message: "Invalid admin email address" }),
  twilioSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioPhoneNumber: z.string().optional(),
  sendgridApiKey: z.string().optional(),
});
type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;

const pricingSettingsSchema = z.object({
  baseRateKg: z.preprocess((val) => Number(val), z.number().positive({ message: "Rate must be positive" })),
  baseRateM3: z.preprocess((val) => Number(val), z.number().positive({ message: "Rate must be positive" })),
  distanceMultiplier: z.preprocess((val) => Number(val), z.number().min(1, { message: "Multiplier must be >= 1" })),
  multiItemSurcharge: z.preprocess((val) => Number(val), z.number().nonnegative({ message: "Surcharge cannot be negative" })),
  perishableSurchargePercent: z.preprocess((val) => Number(val), z.number().nonnegative({ message: "Percentage cannot be negative" }).max(100)),
  hazardousSurchargePercent: z.preprocess((val) => Number(val), z.number().nonnegative({ message: "Percentage cannot be negative" }).max(100)),
  fragileSurchargePercent: z.preprocess((val) => Number(val), z.number().nonnegative({ message: "Percentage cannot be negative" }).max(100)),
  oversizedSurchargePercent: z.preprocess((val) => Number(val), z.number().nonnegative({ message: "Percentage cannot be negative" }).max(100)),
});
type PricingSettingsFormValues = z.infer<typeof pricingSettingsSchema>;

const roleSettingsSchema = z.object({
  adminCanDeleteBookings: z.boolean(),
  customerCanCancelPending: z.boolean(),
});
type RoleSettingsFormValues = z.infer<typeof roleSettingsSchema>;


export default function AdminSettingsPage() {
  const { toast } = useToast();
  const isHydrated = useIsSettingsStoreHydrated();

  // Actions from the store
  const updateGeneralSettings = useSettingsStore((state) => state.updateGeneralSettings);
  const updateNotificationSettings = useSettingsStore((state) => state.updateNotificationSettings);
  const updatePricingSettings = useSettingsStore((state) => state.updatePricingSettings);
  const updateRoleSettings = useSettingsStore((state) => state.updateRoleSettings);

  // Loading states for each form
  const [isGeneralLoading, setIsGeneralLoading] = useState(false);
  const [isNotifyLoading, setIsNotifyLoading] = useState(false);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [isRolesLoading, setIsRolesLoading] = useState(false);

  // --- Form Hooks ---
  // Initialize forms with empty defaults, they will be reset by useEffect
  const generalForm = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: { appName: '', defaultCurrency: 'INR', timezone: '' },
  });
  const notificationForm = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: { enableEmail: false, enableSMS: false, adminEmail: '', twilioSid: '', twilioAuthToken: '', twilioPhoneNumber: '', sendgridApiKey: '' },
  });
  const pricingForm = useForm<PricingSettingsFormValues>({
    resolver: zodResolver(pricingSettingsSchema),
    defaultValues: { baseRateKg: 0, baseRateM3: 0, distanceMultiplier: 1, multiItemSurcharge: 0, perishableSurchargePercent: 0, hazardousSurchargePercent: 0, fragileSurchargePercent: 0, oversizedSurchargePercent: 0},
  });
  const roleForm = useForm<RoleSettingsFormValues>({
    resolver: zodResolver(roleSettingsSchema),
    defaultValues: { adminCanDeleteBookings: false, customerCanCancelPending: false },
  });

  // Effect to reset forms when settings data is hydrated/loaded
  useEffect(() => {
    // Only run the reset logic *once* when the component mounts and the store is hydrated.
    if (isHydrated) {
      const currentSettings = getAppSettings(); // Get latest state directly using utility function
      generalForm.reset(currentSettings.general);
      notificationForm.reset(currentSettings.notifications);
      pricingForm.reset(currentSettings.pricing);
      roleForm.reset(currentSettings.roles);
      console.log("Settings forms reset with hydrated data.");
    }
  // Run only once on mount after hydration is potentially true.
  // isHydrated ensures we wait for the store data.
  // The form instances are stable references, so they are okay as dependencies.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]); // Removed form instances from dependencies as they are stable

  // --- Submit Handlers ---
  const onGeneralSubmit: SubmitHandler<GeneralSettingsFormValues> = async (data) => {
    setIsGeneralLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    updateGeneralSettings(data);
    toast({ title: "Success", description: "General settings saved." });
    setIsGeneralLoading(false);
    generalForm.reset(data); // Update default values after save to clear dirty state
  };

  const onNotificationSubmit: SubmitHandler<NotificationSettingsFormValues> = async (data) => {
    setIsNotifyLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    updateNotificationSettings(data);
    toast({ title: "Success", description: "Notification settings saved." });
    setIsNotifyLoading(false);
    notificationForm.reset(data); // Update default values after save
  };

  const onPricingSubmit: SubmitHandler<PricingSettingsFormValues> = async (data) => {
    setIsPricingLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
     // Ensure percentages are handled correctly if needed before saving
    updatePricingSettings(data);
    toast({ title: "Success", description: "Pricing settings saved." });
    setIsPricingLoading(false);
    pricingForm.reset(data); // Update default values after save
  };

   const onRolesSubmit: SubmitHandler<RoleSettingsFormValues> = async (data) => {
    setIsRolesLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    updateRoleSettings(data);
    toast({ title: "Success", description: "Role & Permission settings saved." });
    setIsRolesLoading(false);
    roleForm.reset(data); // Update default values after save
  };


   if (!isHydrated) {
    return (
       <div className="space-y-6">
         <h1 className="text-3xl font-bold">System Settings</h1>
          <div className="space-y-4">
            {/* Skeleton loaders for each card */}
            <Card><CardHeader><CardTitle>General Settings</CardTitle></CardHeader><CardContent><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
            <Card><CardHeader><CardTitle>Notification Settings</CardTitle></CardHeader><CardContent><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
            <Card><CardHeader><CardTitle>Pricing Engine Settings</CardTitle></CardHeader><CardContent><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
            <Card><CardHeader><CardTitle>User Roles & Permissions</CardTitle></CardHeader><CardContent><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
          </div>
       </div>
    );
   }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Settings</h1>

      {/* General Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure general application settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...generalForm}>
            <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-4">
              <FormField
                control={generalForm.control}
                name="appName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Name</FormLabel>
                    <FormControl>
                      <Input placeholder="PICK PACK SERVICES" {...field} disabled={isGeneralLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={generalForm.control}
                name="defaultCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Currency</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value} disabled={isGeneralLoading}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue placeholder="Select currency" />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
                         <SelectItem value="USD">USD (US Dollar)</SelectItem>
                         <SelectItem value="EUR">EUR (Euro)</SelectItem>
                       </SelectContent>
                     </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={generalForm.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                     {/* TODO: Replace with a proper timezone select component */}
                     <FormControl>
                       <Input placeholder="e.g., Asia/Kolkata" {...field} disabled={isGeneralLoading} />
                     </FormControl>
                     <FormDescription>Enter a valid IANA timezone identifier.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isGeneralLoading || !generalForm.formState.isDirty}>
                {isGeneralLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save General Settings
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Notification Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Configure email and SMS notification settings (API Keys etc.).</CardDescription>
        </CardHeader>
        <CardContent>
           <Form {...notificationForm}>
             <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                   control={notificationForm.control}
                   name="enableEmail"
                   render={({ field }) => (
                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                       <div className="space-y-0.5">
                         <FormLabel className="text-base">Enable Email Notifications</FormLabel>
                         <FormDescription>Send booking and status updates via email.</FormDescription>
                       </div>
                       <FormControl>
                         <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isNotifyLoading} />
                       </FormControl>
                     </FormItem>
                   )}
                 />
                  <FormField
                   control={notificationForm.control}
                   name="enableSMS"
                   render={({ field }) => (
                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                       <div className="space-y-0.5">
                         <FormLabel className="text-base">Enable SMS Notifications</FormLabel>
                         <FormDescription>Send critical updates via SMS.</FormDescription>
                       </div>
                       <FormControl>
                         <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isNotifyLoading} />
                       </FormControl>
                     </FormItem>
                   )}
                 />
               </div>
                <FormField
                 control={notificationForm.control}
                 name="adminEmail"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Admin Notification Email</FormLabel>
                     <FormControl>
                       <Input type="email" placeholder="admin@pickpack.example.com" {...field} disabled={isNotifyLoading} />
                     </FormControl>
                     <FormDescription>Email address to receive administrative alerts.</FormDescription>
                     <FormMessage />
                   </FormItem>
                 )}
               />
                {/* API Key Fields */}
                <FormField control={notificationForm.control} name="sendgridApiKey" render={({ field }) => (<FormItem><FormLabel>SendGrid API Key <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel><FormControl><Input type="password" placeholder="Enter SendGrid API Key" {...field} value={field.value ?? ''} disabled={isNotifyLoading} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={notificationForm.control} name="twilioSid" render={({ field }) => (<FormItem><FormLabel>Twilio SID <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel><FormControl><Input placeholder="Enter Twilio Account SID" {...field} value={field.value ?? ''} disabled={isNotifyLoading} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={notificationForm.control} name="twilioAuthToken" render={({ field }) => (<FormItem><FormLabel>Twilio Auth Token <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel><FormControl><Input type="password" placeholder="Enter Twilio Auth Token" {...field} value={field.value ?? ''} disabled={isNotifyLoading} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={notificationForm.control} name="twilioPhoneNumber" render={({ field }) => (<FormItem><FormLabel>Twilio Phone Number <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel><FormControl><Input type="tel" placeholder="Enter Twilio Phone Number" {...field} value={field.value ?? ''} disabled={isNotifyLoading} /></FormControl><FormMessage /></FormItem>)} />

               <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isNotifyLoading || !notificationForm.formState.isDirty}>
                  {isNotifyLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Notification Settings
               </Button>
             </form>
           </Form>
        </CardContent>
      </Card>

      {/* Pricing Engine Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Engine Settings</CardTitle>
           <CardDescription>Configure dynamic pricing rules, taxes, and discounts.</CardDescription>
        </CardHeader>
        <CardContent>
           <Form {...pricingForm}>
             <form onSubmit={pricingForm.handleSubmit(onPricingSubmit)} className="space-y-4">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <FormField control={pricingForm.control} name="baseRateKg" render={({ field }) => (<FormItem><FormLabel>Base Rate (/kg)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="50" {...field} disabled={isPricingLoading}/></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={pricingForm.control} name="baseRateM3" render={({ field }) => (<FormItem><FormLabel>Base Rate (/m³)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="2000" {...field} disabled={isPricingLoading}/></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={pricingForm.control} name="distanceMultiplier" render={({ field }) => (<FormItem><FormLabel>Distance Multiplier</FormLabel><FormControl><Input type="number" step="0.01" placeholder="1.1" {...field} disabled={isPricingLoading}/></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={pricingForm.control} name="multiItemSurcharge" render={({ field }) => (<FormItem><FormLabel>Multi-Item Surcharge</FormLabel><FormControl><Input type="number" step="1" placeholder="50" {...field} disabled={isPricingLoading}/></FormControl><FormMessage /></FormItem>)} />
               </div>
                <Separator className="my-4" />
                <h4 className="font-medium">Cargo Type Surcharges (%)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField control={pricingForm.control} name="perishableSurchargePercent" render={({ field }) => (<FormItem><FormLabel>Perishable (%)</FormLabel><FormControl><Input type="number" step="1" placeholder="20" {...field} disabled={isPricingLoading}/></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={pricingForm.control} name="hazardousSurchargePercent" render={({ field }) => (<FormItem><FormLabel>Hazardous (%)</FormLabel><FormControl><Input type="number" step="1" placeholder="50" {...field} disabled={isPricingLoading}/></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={pricingForm.control} name="fragileSurchargePercent" render={({ field }) => (<FormItem><FormLabel>Fragile (%)</FormLabel><FormControl><Input type="number" step="1" placeholder="15" {...field} disabled={isPricingLoading}/></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={pricingForm.control} name="oversizedSurchargePercent" render={({ field }) => (<FormItem><FormLabel>Oversized (%)</FormLabel><FormControl><Input type="number" step="1" placeholder="30" {...field} disabled={isPricingLoading}/></FormControl><FormMessage /></FormItem>)} />
                </div>

               <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isPricingLoading || !pricingForm.formState.isDirty}>
                 {isPricingLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                 Save Pricing Settings
               </Button>
             </form>
           </Form>
        </CardContent>
      </Card>

      {/* User Roles & Permissions Card */}
      <Card>
        <CardHeader>
          <CardTitle>User Roles &amp; Permissions</CardTitle>
          <CardDescription>Manage basic roles (Admin, Customer) and their permissions.</CardDescription>
        </CardHeader>
        <CardContent>
           <Form {...roleForm}>
             <form onSubmit={roleForm.handleSubmit(onRolesSubmit)} className="space-y-4">
                <FormField
                  control={roleForm.control}
                  name="adminCanDeleteBookings"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Admin Booking Deletion</FormLabel>
                        <FormDescription>Allow administrators to delete rejected booking records.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isRolesLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={roleForm.control}
                  name="customerCanCancelPending"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Customer Cancellation</FormLabel>
                        <FormDescription>Allow customers to cancel their own bookings if still 'Pending'.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isRolesLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />
               <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isRolesLoading || !roleForm.formState.isDirty}>
                 {isRolesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                 Save Permissions
               </Button>
             </form>
           </Form>
        </CardContent>
      </Card>
    </div>
  );
}
