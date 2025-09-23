"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ProfileImageUpload } from '@/components/ui/profile-image-upload';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Settings } from 'lucide-react';
import { User, Level, levels, levelLabels, levelRates, subLevels } from '@/lib/types';

const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().optional(),
  address: z.string().optional(),
  number: z.string().optional(),
  profilePicture: z.string().optional(),
});

const pricingSchema = z.object({
  P: z.number().min(1, { message: "Primaire rate must be at least 1 MAD." }),
  C: z.number().min(1, { message: "Collège rate must be at least 1 MAD." }),
  L: z.number().min(1, { message: "Lycée rate must be at least 1 MAD." }),
  S: z.number().min(1, { message: "Supérieur rate must be at least 1 MAD." }),
  E: z.number().min(100, { message: "Spéciale minimum rate must be at least 100 MAD." }),
});

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isPricingLoading, setIsPricingLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      address: '',
      number: '',
      profilePicture: '',
    },
    mode: 'onChange',
  });

  const pricingForm = useForm<z.infer<typeof pricingSchema>>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      P: levelRates.P || 130,
      C: levelRates.C || 150,
      L: levelRates.L || 180,
      S: levelRates.S || 220,
      E: 100, // Default minimum for variable rate
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (session?.user?.id) {
      const fetchData = async () => {
        setIsFetching(true);
        try {
          // Fetch user data
          const userResponse = await fetch(`/api/users/${session.user.id}`);
          if (userResponse.ok) {
            const userData: User = await userResponse.json();
            form.reset({
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              username: userData.username || '',
              email: userData.email || '',
              address: userData.address || '',
              number: userData.number || '',
              profilePicture: userData.profilePicture || '',
            });
          }

          // Fetch pricing data
          const pricingResponse = await fetch('/api/settings/pricing');
          if (pricingResponse.ok) {
            const pricingData = await pricingResponse.json();
            pricingForm.reset({
              P: pricingData.P || 130,
              C: pricingData.C || 150,
              L: pricingData.L || 180,
              S: pricingData.S || 220,
              E: pricingData.E || 100,
            });
          }

          if (!userResponse.ok) {
            toast({
              title: 'Error',
              description: 'Failed to fetch user data.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: 'An unexpected error occurred.',
            variant: 'destructive',
          });
        } finally {
          setIsFetching(false);
        }
      };
      fetchData();
    }
  }, [session, form, pricingForm, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user?.id) return;
    setIsLoading(true);

    const updateData: any = {
      firstName: values.firstName,
      lastName: values.lastName,
      username: values.username,
      email: values.email,
      profilePicture: values.profilePicture,
    };

    // Only admin can update address and number
    if (session?.user?.role === 'admin') {
      updateData.address = values.address;
      updateData.number = values.number;
    }

    if (values.password) {
      updateData.password = values.password;
    }

    try {
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Your profile has been updated.',
        });
        // Update the session to reflect the changes
        await update({
          ...session,
          user: {
            ...session.user,
            firstName: values.firstName,
            lastName: values.lastName,
            username: values.username,
            email: values.email,
            profilePicture: values.profilePicture,
          }
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error updating profile',
          description: errorData.message || 'An error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileImageChange = (imageUrl: string) => {
    form.setValue('profilePicture', imageUrl);
  };

  const onPricingSubmit = async (values: z.infer<typeof pricingSchema>) => {
    if (session?.user?.role !== 'admin') return;
    setIsPricingLoading(true);

    try {
      const response = await fetch('/api/settings/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Pricing settings have been updated.',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error updating pricing',
          description: errorData.message || 'An error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsPricingLoading(false);
    }
  };

  if (isFetching || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="information" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="information">
            <Settings className="mr-2 h-4 w-4" />
            Information
          </TabsTrigger>
          <TabsTrigger value="pricing">
            Pricing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="information">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>Update your personal information here.</CardDescription>
            </CardHeader>
            <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-4 pb-6 border-b">
                <FormField
                  control={form.control}
                  name="profilePicture"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center space-y-2">
                      <FormLabel>Profile Picture</FormLabel>
                      <FormControl>
                        <ProfileImageUpload
                          currentImage={field.value}
                          onImageChange={handleProfileImageChange}
                          size="lg"
                          fallbackInitials={`${(form.watch('firstName') || '').charAt(0).toUpperCase()}${(form.watch('lastName') || '').charAt(0).toUpperCase()}`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Personal Information Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your phone number" 
                          {...field} 
                          disabled={session?.user?.role !== 'admin'}
                        />
                      </FormControl>
                      {session?.user?.role !== 'admin' && (
                        <p className="text-xs text-muted-foreground">Only administrators can edit this field</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your address" 
                          {...field} 
                          disabled={session?.user?.role !== 'admin'}
                        />
                      </FormControl>
                      {session?.user?.role !== 'admin' && (
                        <p className="text-xs text-muted-foreground">Only administrators can edit this field</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Password Section */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Change Password</h3>
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                  <div className="w-full md:w-1/2">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Leave blank to keep current password"
                                {...field}
                                className="pr-10"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-1"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} size="lg" className="w-full md:w-auto">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Pricing Management</CardTitle>
                <span className="text-red-500 text-sm">(MAD currency rates per hour)</span>
              </div>
              <CardDescription>Update education level pricing rates. Only administrators can modify these settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...pricingForm}>
                <form onSubmit={pricingForm.handleSubmit(onPricingSubmit)} className="space-y-6">
                  {session?.user?.role === 'admin' ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(levelLabels).map(([key, label]) => (
                          <FormField
                            key={key}
                            control={pricingForm.control}
                            name={key as keyof z.infer<typeof pricingSchema>}
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center gap-2">
                                  <FormLabel>{key}-({subLevels[key as Level]?.length || 0}) {label}</FormLabel>
                                  <span className="text-red-500 text-xs">({key === 'E' ? 'Variable rate with minimum' : 'Fixed rate'})</span>
                                </div>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      placeholder={key === 'E' ? "Minimum rate" : "Fixed rate"}
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      className="pr-12"
                                      value={field.value || ''}
                                    />
                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                                      MAD
                                    </span>
                                  </div>
                                </FormControl>
                                {key === 'E' && (
                                  <p className="text-xs text-muted-foreground">
                                    This is the minimum rate for Spéciale level. Actual rate can vary per assignment.
                                  </p>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>

                      <div className="flex justify-end pt-6 border-t">
                        <Button type="submit" disabled={isPricingLoading} size="lg">
                          {isPricingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Update Pricing
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Only administrators can modify pricing settings.</p>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
