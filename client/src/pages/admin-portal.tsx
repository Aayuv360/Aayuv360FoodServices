import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, PlusCircle, Edit, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminPortalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [mealTypeFilter, setMealTypeFilter] = useState("all");
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isMealDialogOpen, setIsMealDialogOpen] = useState(false);
  const [isCurryDialogOpen, setIsCurryDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [selectedCurry, setSelectedCurry] = useState<any>(null);

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users data');
      }
      return response.json();
    },
    enabled: !!user && user.role === "admin",
  });

  // Fetch meals
  const { data: meals, isLoading: isLoadingMeals } = useQuery({
    queryKey: ["/api/admin/meals"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/meals`);
      if (!response.ok) {
        throw new Error('Failed to fetch meals data');
      }
      return response.json();
    },
    enabled: !!user && user.role === "admin",
  });

  // Fetch curry options
  const { data: curryOptions, isLoading: isLoadingCurryOptions } = useQuery({
    queryKey: ["/api/admin/curry-options"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/curry-options`);
      if (!response.ok) {
        throw new Error('Failed to fetch curry options data');
      }
      return response.json();
    },
    enabled: !!user && user.role === "admin",
  });

  // User CRUD mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/admin/users", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsUserDialogOpen(false);
      toast({
        title: "Success",
        description: "User has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number; userData: any }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${id}`, userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsUserDialogOpen(false);
      toast({
        title: "Success",
        description: "User has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Meal CRUD mutations
  const createMealMutation = useMutation({
    mutationFn: async (mealData: any) => {
      const response = await apiRequest("POST", "/api/admin/meals", mealData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meals"] });
      setIsMealDialogOpen(false);
      toast({
        title: "Success",
        description: "Meal has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create meal",
        variant: "destructive",
      });
    },
  });

  const updateMealMutation = useMutation({
    mutationFn: async ({ id, mealData }: { id: number; mealData: any }) => {
      const response = await apiRequest("PATCH", `/api/admin/meals/${id}`, mealData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meals"] });
      setIsMealDialogOpen(false);
      toast({
        title: "Success",
        description: "Meal has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update meal",
        variant: "destructive",
      });
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/meals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meals"] });
      toast({
        title: "Success",
        description: "Meal has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meal",
        variant: "destructive",
      });
    },
  });

  // Curry option CRUD mutations
  const createCurryOptionMutation = useMutation({
    mutationFn: async (curryData: any) => {
      const response = await apiRequest("POST", "/api/admin/curry-options", curryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/curry-options"] });
      setIsCurryDialogOpen(false);
      toast({
        title: "Success",
        description: "Curry option has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create curry option",
        variant: "destructive",
      });
    },
  });

  const updateCurryOptionMutation = useMutation({
    mutationFn: async ({ id, curryData }: { id: string; curryData: any }) => {
      const response = await apiRequest("PATCH", `/api/admin/curry-options/${id}`, curryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/curry-options"] });
      setIsCurryDialogOpen(false);
      toast({
        title: "Success",
        description: "Curry option has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update curry option",
        variant: "destructive",
      });
    },
  });

  const deleteCurryOptionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/curry-options/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/curry-options"] });
      toast({
        title: "Success",
        description: "Curry option has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete curry option",
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingUsers || isLoadingMeals || isLoadingCurryOptions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
        <p className="text-muted-foreground text-center">
          The admin portal is only available to administrators.
        </p>
      </div>
    );
  }

  // Filtered users based on role
  const filteredUsers = userRoleFilter === "all" 
    ? users 
    : users?.filter((u: any) => u.role === userRoleFilter);

  // Filtered meals based on type
  const filteredMeals = mealTypeFilter === "all" 
    ? meals 
    : meals?.filter((m: any) => m.mealType === mealTypeFilter);

  // User form handlers
  const handleAddUser = () => {
    setSelectedUser(null);
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsUserDialogOpen(true);
  };

  const handleDeleteUser = (userId: number) => {
    deleteUserMutation.mutate(userId);
  };

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const userData = {
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      email: formData.get('email') as string,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      role: formData.get('role') as string,
    };

    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, userData });
    } else {
      createUserMutation.mutate(userData);
    }
  };

  // Meal form handlers
  const handleAddMeal = () => {
    setSelectedMeal(null);
    setIsMealDialogOpen(true);
  };

  const handleEditMeal = (meal: any) => {
    setSelectedMeal(meal);
    setIsMealDialogOpen(true);
  };

  const handleDeleteMeal = (mealId: number) => {
    deleteMealMutation.mutate(mealId);
  };

  const handleMealFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const mealData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      mealType: formData.get('mealType') as string,
      imageUrl: formData.get('imageUrl') as string,
      milletType: formData.get('milletType') as string,
      calories: parseFloat(formData.get('calories') as string) || null,
      protein: parseFloat(formData.get('protein') as string) || null,
      carbs: parseFloat(formData.get('carbs') as string) || null,
      fat: parseFloat(formData.get('fat') as string) || null,
      fiber: parseFloat(formData.get('fiber') as string) || null,
      available: formData.get('available') === 'on',
      dietaryPreferences: Array.from(formData.getAll('dietaryPreferences') as string[]),
      allergens: Array.from(formData.getAll('allergens') as string[]),
    };

    if (selectedMeal) {
      updateMealMutation.mutate({ id: selectedMeal.id, mealData });
    } else {
      createMealMutation.mutate(mealData);
    }
  };

  // Curry option form handlers
  const handleAddCurryOption = () => {
    setSelectedCurry(null);
    setIsCurryDialogOpen(true);
  };

  const handleEditCurryOption = (curry: any) => {
    setSelectedCurry(curry);
    setIsCurryDialogOpen(true);
  };

  const handleDeleteCurryOption = (curryId: string) => {
    deleteCurryOptionMutation.mutate(curryId);
  };

  const handleCurryFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const curryData = {
      id: formData.get('id') as string,
      name: formData.get('name') as string,
      priceAdjustment: parseFloat(formData.get('priceAdjustment') as string),
      description: formData.get('description') as string,
    };

    if (selectedCurry) {
      updateCurryOptionMutation.mutate({ id: selectedCurry.id, curryData });
    } else {
      createCurryOptionMutation.mutate(curryData);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Portal</h1>
          <p className="text-muted-foreground">
            Manage users, menu items, and curry options
          </p>
        </div>
      </div>

      <Tabs 
        defaultValue="users" 
        className="space-y-6" 
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="meals">Menu Items</TabsTrigger>
          <TabsTrigger value="curry-options">Curry Options</TabsTrigger>
        </TabsList>

        {/* Users Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">User Management</h2>
              <Select
                defaultValue={userRoleFilter}
                onValueChange={(value) => setUserRoleFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddUser}>
              <PlusCircle className="w-4 h-4 mr-2" /> Add User
            </Button>
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers && filteredUsers.length > 0 ? (
                    filteredUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : user.role === 'manager'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  className="text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the
                                    user and all associated data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-red-500 text-white"
                                    onClick={() => handleDeleteUser(user.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        {userRoleFilter === "all" 
                          ? "No users found" 
                          : `No users with role '${userRoleFilter}' found`}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* User Dialog */}
          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
                <DialogDescription>
                  {selectedUser 
                    ? 'Update user details and permissions' 
                    : 'Create a new user account'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleUserFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="John Doe" 
                      defaultValue={selectedUser?.name || ''} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      name="username" 
                      placeholder="johndoe" 
                      defaultValue={selectedUser?.username || ''} 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    defaultValue={selectedUser?.email || ''} 
                    required 
                  />
                </div>
                {!selectedUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      placeholder="••••••••" 
                      required={!selectedUser}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    placeholder="+91 98765 43210" 
                    defaultValue={selectedUser?.phone || ''} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea 
                    id="address" 
                    name="address" 
                    placeholder="123 Main St, Hyderabad" 
                    defaultValue={selectedUser?.address || ''} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select defaultValue={selectedUser?.role || 'user'} name="role">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <DialogFooter>
                  <Button type="submit">
                    {selectedUser ? 'Update User' : 'Create User'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Menu Items Tab */}
        <TabsContent value="meals" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Menu Items</h2>
              <Select
                defaultValue={mealTypeFilter}
                onValueChange={(value) => setMealTypeFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddMeal}>
              <PlusCircle className="w-4 h-4 mr-2" /> Add Menu Item
            </Button>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMeals && filteredMeals.length > 0 ? (
              filteredMeals.map((meal: any) => (
                <Card key={meal.id} className="overflow-hidden">
                  {meal.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img 
                        src={meal.imageUrl} 
                        alt={meal.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{meal.name}</CardTitle>
                      <Badge 
                        className={
                          meal.available 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {meal.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                    <CardDescription className="flex flex-wrap gap-1">
                      <Badge variant="outline">{meal.mealType}</Badge>
                      <Badge variant="outline">{meal.milletType}</Badge>
                      {meal.dietaryPreferences && meal.dietaryPreferences.map((pref: string) => (
                        <Badge key={pref} variant="outline" className="text-xs">
                          {pref}
                        </Badge>
                      ))}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                      {meal.description}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold">₹{meal.price}</span>
                      {meal.calories && (
                        <span className="text-sm text-muted-foreground">
                          {meal.calories} cal
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditMeal(meal)}
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-500"
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this menu item.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-500 text-white"
                            onClick={() => handleDeleteMeal(meal.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                {mealTypeFilter === "all" 
                  ? "No menu items found" 
                  : `No ${mealTypeFilter} items found`}
              </div>
            )}
          </div>

          {/* Meal Dialog */}
          <Dialog open={isMealDialogOpen} onOpenChange={setIsMealDialogOpen}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedMeal ? 'Edit Menu Item' : 'Add New Menu Item'}
                </DialogTitle>
                <DialogDescription>
                  {selectedMeal 
                    ? 'Update menu item details' 
                    : 'Create a new menu item'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleMealFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Ragi Mudde" 
                      defaultValue={selectedMeal?.name || ''} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input 
                      id="price" 
                      name="price" 
                      type="number" 
                      placeholder="199" 
                      defaultValue={selectedMeal?.price || ''} 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Delicious millet dish..." 
                    defaultValue={selectedMeal?.description || ''}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mealType">Meal Type</Label>
                    <Select defaultValue={selectedMeal?.mealType || 'dinner'} name="mealType">
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="milletType">Millet Type</Label>
                    <Input 
                      id="milletType" 
                      name="milletType" 
                      placeholder="Ragi, Jowar, etc." 
                      defaultValue={selectedMeal?.milletType || ''} 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input 
                    id="imageUrl" 
                    name="imageUrl" 
                    placeholder="https://example.com/image.jpg" 
                    defaultValue={selectedMeal?.imageUrl || ''}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories">Calories</Label>
                    <Input 
                      id="calories" 
                      name="calories" 
                      type="number" 
                      placeholder="250" 
                      defaultValue={selectedMeal?.calories || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input 
                      id="protein" 
                      name="protein" 
                      type="number" 
                      placeholder="15" 
                      defaultValue={selectedMeal?.protein || ''}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input 
                      id="carbs" 
                      name="carbs" 
                      type="number" 
                      placeholder="30" 
                      defaultValue={selectedMeal?.carbs || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fat">Fat (g)</Label>
                    <Input 
                      id="fat" 
                      name="fat" 
                      type="number" 
                      placeholder="10" 
                      defaultValue={selectedMeal?.fat || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fiber">Fiber (g)</Label>
                    <Input 
                      id="fiber" 
                      name="fiber" 
                      type="number" 
                      placeholder="5" 
                      defaultValue={selectedMeal?.fiber || ''}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="available" 
                      name="available" 
                      defaultChecked={selectedMeal?.available !== false}
                    />
                    <Label htmlFor="available">Available</Label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit">
                    {selectedMeal ? 'Update Item' : 'Create Item'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Curry Options Tab */}
        <TabsContent value="curry-options" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Curry Options</h2>
            <Button onClick={handleAddCurryOption}>
              <PlusCircle className="w-4 h-4 mr-2" /> Add Curry Option
            </Button>
          </div>

          {/* Curry Options Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price Adjustment</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {curryOptions && curryOptions.length > 0 ? (
                    curryOptions.map((curry: any) => (
                      <TableRow key={curry.id}>
                        <TableCell className="font-medium">{curry.id}</TableCell>
                        <TableCell>{curry.name}</TableCell>
                        <TableCell>
                          {curry.priceAdjustment >= 0 
                            ? `+₹${curry.priceAdjustment}` 
                            : `-₹${Math.abs(curry.priceAdjustment)}`}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{curry.description}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleEditCurryOption(curry)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  className="text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this curry option.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-red-500 text-white"
                                    onClick={() => handleDeleteCurryOption(curry.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No curry options found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Curry Option Dialog */}
          <Dialog open={isCurryDialogOpen} onOpenChange={setIsCurryDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedCurry ? 'Edit Curry Option' : 'Add New Curry Option'}
                </DialogTitle>
                <DialogDescription>
                  {selectedCurry 
                    ? 'Update curry option details' 
                    : 'Create a new curry option'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCurryFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="id">ID</Label>
                  <Input 
                    id="id" 
                    name="id" 
                    placeholder="regular" 
                    defaultValue={selectedCurry?.id || ''} 
                    required 
                  />
                  <p className="text-xs text-muted-foreground">
                    Use a unique identifier like 'regular', 'spicy', etc.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="Regular Curry" 
                    defaultValue={selectedCurry?.name || ''} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceAdjustment">Price Adjustment (₹)</Label>
                  <Input 
                    id="priceAdjustment" 
                    name="priceAdjustment" 
                    type="number" 
                    placeholder="0" 
                    defaultValue={selectedCurry?.priceAdjustment || '0'} 
                    required 
                  />
                  <p className="text-xs text-muted-foreground">
                    Use positive values for price additions and negative for discounts
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Medium spicy traditional curry..." 
                    defaultValue={selectedCurry?.description || ''}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit">
                    {selectedCurry ? 'Update Option' : 'Create Option'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}