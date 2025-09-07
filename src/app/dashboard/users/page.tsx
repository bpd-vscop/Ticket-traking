"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileImageUpload } from '@/components/ui/profile-image-upload';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, MoreHorizontal, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import { User } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from 'next-auth/react';

const userFormSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "user"]),
  password: z.string().optional(),
  address: z.string().optional(),
  number: z.string().optional(),
  profilePicture: z.string().optional(),
});

const UserDialog = ({ user, onSave, children }: { user?: User | null, onSave: () => void, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const isEditMode = !!user;

  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      id: user?.id || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      username: user?.username || '',
      email: user?.email || '',
      role: user?.role || 'user',
      password: '',
      address: user?.address || '',
      number: user?.number || '',
      profilePicture: user?.profilePicture || '',
    },
  });

  useEffect(() => {
    form.reset({
      id: user?.id || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      username: user?.username || '',
      email: user?.email || '',
      role: user?.role || 'user',
      password: '',
      address: user?.address || '',
      number: user?.number || '',
      profilePicture: user?.profilePicture || '',
    });
  }, [user, form]);

  const onSubmit = async (values: z.infer<typeof userFormSchema>) => {
    const apiUrl = isEditMode ? `/api/users/${values.id}` : '/api/users';
    const method = isEditMode ? 'PUT' : 'POST';

    // Don't send an empty password string on edit unless it's being changed
    const payload: any = { ...values };
    if (isEditMode && !values.password) {
      delete payload.password;
    } else if (!isEditMode && !values.password) {
        toast({ title: "Error", description: "Password is required for new users.", variant: "destructive" });
        return;
    }


    try {
      const response = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({ title: 'Success', description: `User ${isEditMode ? 'updated' : 'created'} successfully.` });
        onSave();
        setIsOpen(false);
      } else {
        const errorData = await response.json();
        toast({ title: 'Error', description: errorData.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
<DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit User' : 'Create New User'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the user details below.' : 'Fill in the form to create a new user.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Profile Picture and Username Section */}
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-center">
              {/* Profile Picture - Left Side */}
              <FormField
                control={form.control}
                name="profilePicture"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel className="sr-only">Profile Picture</FormLabel>
                    <FormControl>
                      <ProfileImageUpload
                        currentImage={field.value}
                        onImageChange={(imageUrl) => form.setValue('profilePicture', imageUrl)}
                        size="lg"
                        className="w-24 h-24 sm:w-32 sm:h-32"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Username Field - Right Side, Vertically Centered */}
              <div className="flex-1 w-full flex items-center">
                <FormField control={form.control} name="username" render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Username</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isEditMode ? 'Leave blank to keep current' : ''}
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
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )} />
            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
              <FormField control={form.control} name="number" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting}
                className="w-full sm:w-auto"
              >
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { data: session } = useSession();
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast({ title: 'Error', description: 'Failed to fetch users.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Success', description: 'User deleted successfully.' });
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast({ title: 'Error', description: errorData.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <UserDialog onSave={fetchUsers}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </UserDialog>
      </div>
      
      {/* Desktop Table View (md and up) */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No users found.</TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium flex items-center">
                    <Avatar className="h-8 w-8 mr-4">
                      <AvatarImage src={user.profilePicture} />
                      <AvatarFallback>{user.firstName?.charAt(0).toUpperCase()}{user.lastName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>{user.number}</TableCell>
                  <TableCell className="text-right">
                    <UserDialog user={user} onSave={fetchUsers}>
                       <Button variant="ghost" size="icon" className="mr-2">
                          <Edit className="h-4 w-4" />
                       </Button>
                    </UserDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" disabled={user.id === session?.user?.id} className="ml-2">
                          <Trash2 className="h-4 w-4 text-white" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user account.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(user.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View (below md) */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found.
          </div>
        ) : (
          users.map((user) => (
             <div key={user.id} className="bg-card border rounded-lg p-4 shadow-sm">
               <div className="flex gap-4">
                 {/* Profile Picture - 30% of card width */}
                 <div className="w-[30%] flex-shrink-0 flex items-center">
                   <Avatar className="w-full h-full aspect-square max-w-[80px] max-h-[80px]">
                     <AvatarImage src={user.profilePicture} className="object-cover" />
                     <AvatarFallback className="text-lg font-semibold">
                       {user.firstName?.charAt(0).toUpperCase()}{user.lastName?.charAt(0).toUpperCase()}
                     </AvatarFallback>
                   </Avatar>
                 </div>
                 
                 {/* Information Section - 70% of card width */}
                 <div className="flex-1 min-w-0">
                   <div className="flex items-start justify-between mb-3">
                     <div className="flex-1 min-w-0">
                       <h3 className="font-semibold text-foreground text-lg truncate">
                         {user.firstName} {user.lastName}
                       </h3>
                       <p className="text-sm text-muted-foreground truncate">
                         @{user.username}
                       </p>
                     </div>
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                           <MoreHorizontal className="h-4 w-4" />
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end">
                         <UserDialog user={user} onSave={fetchUsers}>
                           <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                             <Edit className="mr-2 h-4 w-4" />
                             Edit
                           </DropdownMenuItem>
                         </UserDialog>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <DropdownMenuItem 
                               onSelect={(e) => e.preventDefault()}
                               disabled={user.id === session?.user?.id}
                               className="text-destructive focus:text-destructive"
                             >
                               <Trash2 className="mr-2 h-4 w-4" />
                               Delete
                             </DropdownMenuItem>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                               <AlertDialogDescription>
                                 This action cannot be undone. This will permanently delete the user account.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancel</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleDelete(user.id)}>Delete</AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                       </DropdownMenuContent>
                     </DropdownMenu>
                   </div>
                   
                   {/* User Details */}
                   <div className="space-y-2">
                     <div className="flex items-center justify-between">
                       <span className="text-xs text-muted-foreground">First Name:</span>
                       <span className="text-sm font-medium truncate ml-2">{user.firstName}</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-xs text-muted-foreground">Last Name:</span>
                       <span className="text-sm font-medium truncate ml-2">{user.lastName}</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-xs text-muted-foreground">Email:</span>
                       <span className="text-sm font-medium truncate ml-2">{user.email}</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-xs text-muted-foreground">Role:</span>
                       <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                         user.role === 'admin' 
                           ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                           : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                       }`}>
                         {user.role}
                       </span>
                     </div>
                     {user.number && (
                       <div className="flex items-center justify-between">
                         <span className="text-xs text-muted-foreground">Phone:</span>
                         <span className="text-sm font-medium">{user.number}</span>
                       </div>
                     )}
                     {user.address && (
                       <div className="flex items-center justify-between">
                         <span className="text-xs text-muted-foreground">Address:</span>
                         <span className="text-sm font-medium truncate ml-2">{user.address}</span>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             </div>
           ))
        )}
      </div>
    </div>
  );
}