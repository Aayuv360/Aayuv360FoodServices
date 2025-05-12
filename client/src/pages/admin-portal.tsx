import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, PlusCircle, Edit, Trash2, Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import MealCurryOptionsModal from "@/components/admin/MealCurryOptionsModal";

export default function AdminPortalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [mealTypeFilter, setMealTypeFilter] = useState("all");
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isMealDialogOpen, setIsMealDialogOpen] = useState(false);
  const [isCurryDialogOpen, setIsCurryDialogOpen] = useState(false);
  const [isMealCurryOptionsModalOpen, setIsMealCurryOptionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [selectedCurry, setSelectedCurry] = useState<any>(null);
  const [selectedMealForCurryOptions, setSelectedMealForCurryOptions] = useState<any>(null);

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }
      return await res.json();
    },
    enabled: user?.role === "admin" || user?.role === "manager",
  });

  // Fetch meals
  const { data: meals, isLoading: isLoadingMeals } = useQuery({
    queryKey: ["/api/admin/meals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/meals");
      if (!res.ok) {
        throw new Error("Failed to fetch meals");
      }
      return await res.json();
    },
    enabled: user?.role === "admin" || user?.role === "manager",
  });

  // Fetch curry options
  const { data: curryOptions, isLoading: isLoadingCurryOptions } = useQuery({
    queryKey: ["/api/admin/curry-options"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/curry-options");
      if (!res.ok) {
        throw new Error("Failed to fetch curry options");
      }
      return await res.json();
    },
    enabled: user?.role === "admin" || user?.role === "manager",
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest("POST", "/api/admin/users", userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create user");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsUserDialogOpen(false);
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number; userData: any }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${id}`, userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update user");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsUserDialogOpen(false);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Create meal mutation
  const createMealMutation = useMutation({
    mutationFn: async (mealData: any) => {
      const res = await apiRequest("POST", "/api/admin/meals", mealData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create meal");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meals"] });
      setIsMealDialogOpen(false);
      toast({
        title: "Success",
        description: "Meal created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create meal",
        variant: "destructive",
      });
    },
  });

  // Update meal mutation
  const updateMealMutation = useMutation({
    mutationFn: async ({ id, mealData }: { id: number; mealData: any }) => {
      const res = await apiRequest("PUT", `/api/admin/meals/${id}`, mealData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update meal");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meals"] });
      setIsMealDialogOpen(false);
      toast({
        title: "Success",
        description: "Meal updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update meal",
        variant: "destructive",
      });
    },
  });

  // Delete meal mutation
  const deleteMealMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/meals/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete meal");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meals"] });
      toast({
        title: "Success",
        description: "Meal deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meal",
        variant: "destructive",
      });
    },
  });

  // Create curry option mutation
  const createCurryOptionMutation = useMutation({
    mutationFn: async (curryData: any) => {
      const res = await apiRequest("POST", "/api/admin/curry-options", curryData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create curry option");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/curry-options"] });
      setIsCurryDialogOpen(false);
      toast({
        title: "Success",
        description: "Curry option created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create curry option",
        variant: "destructive",
      });
    },
  });

  // Update curry option mutation
  const updateCurryOptionMutation = useMutation({
    mutationFn: async ({ id, curryData }: { id: string; curryData: any }) => {
      const res = await apiRequest("PUT", `/api/admin/curry-options/${id}`, curryData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update curry option");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/curry-options"] });
      setIsCurryDialogOpen(false);
      toast({
        title: "Success",
        description: "Curry option updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update curry option",
        variant: "destructive",
      });
    },
  });

  // Delete curry option mutation
  const deleteCurryOptionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/curry-options/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete curry option");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/curry-options"] });
      toast({
        title: "Success",
        description: "Curry option deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete curry option",
        variant: "destructive",
      });
    },
  });

  // Bulk price update mutation
  const bulkUpdatePricesMutation = useMutation({
    mutationFn: async (data: { percentage: number }) => {
      const res = await apiRequest("POST", "/api/admin/meals/bulk-update-prices", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update prices");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meals"] });
      toast({
        title: "Success",
        description: "Meal prices updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update prices",
        variant: "destructive",
      });
    },
  });

  // User form handlers
  const handleAddUser = () => {
    setSelectedUser(null);
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsUserDialogOpen(true);
  };

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const userData = {
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
    };

    // Only include password if it's provided
    const password = formData.get('password') as string;
    if (password) {
      userData['password'] = password;
    }

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

  const handleMealFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const mealData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      imageUrl: formData.get('imageUrl') as string,
      milletType: formData.get('milletType') as string,
      mealType: formData.get('mealType') as string,
      calories: parseInt(formData.get('calories') as string) || null,
      protein: parseInt(formData.get('protein') as string) || null,
      carbs: parseInt(formData.get('carbs') as string) || null,
      fat: parseInt(formData.get('fat') as string) || null,
      fiber: parseInt(formData.get('fiber') as string) || null,
      available: (formData.get('available') as string) === 'true',
      
      // Split and trim the comma-separated list
      dietaryPreferences: (formData.get('dietaryPreferences') as string)
        .split(',')
        .map(pref => pref.trim())
        .filter(Boolean),
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
  
  const handleAddCurryOptionForMeal = (mealId: number | undefined) => {
    if (mealId) {
      setSelectedCurry(null);
      setSelectedMealForCurryOptions(meals?.find((m: any) => m.id === mealId));
      setIsCurryDialogOpen(true);
    }
  };

  const handleEditCurryOption = (curry: any) => {
    setSelectedCurry(curry);
    setIsCurryDialogOpen(true);
  };

  const handleDeleteCurryOption = (curryId: string) => {
    deleteCurryOptionMutation.mutate(curryId);
  };
  
  // Meal curry options modal handler
  const handleManageMealCurryOptions = (meal: any) => {
    setSelectedMealForCurryOptions(meal);
    setIsMealCurryOptionsModalOpen(true);
  };

  const handleCurryFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Get the associated meal ID - it could come from the form or from selectedMealForCurryOptions
    let mealId: string | null = formData.get('mealId') as string;
    
    // If we're adding a curry option from a specific meal's modal, override with that meal's ID
    if (selectedMealForCurryOptions && !mealId) {
      mealId = selectedMealForCurryOptions.id.toString();
    }
    
    const curryData = {
      id: formData.get('id') as string,
      name: formData.get('name') as string,
      priceAdjustment: parseFloat(formData.get('priceAdjustment') as string),
      description: formData.get('description') as string,
      mealId: mealId && mealId !== "all" ? parseInt(mealId) : null,
    };

    if (selectedCurry) {
      updateCurryOptionMutation.mutate({ id: selectedCurry.id, curryData });
    } else {
      createCurryOptionMutation.mutate(curryData);
    }
  };

  // Filtered users based on role
  const filteredUsers = users?.filter((user: any) => {
    if (userRoleFilter === "all") return true;
    return user.role === userRoleFilter;
  });

  // Filtered meals based on type
  const filteredMeals = meals?.filter((meal: any) => {
    if (mealTypeFilter === "all") return true;
    return meal.mealType === mealTypeFilter;
  });

  // If user is not admin or manager, show access denied message
  if (user?.role !== "admin" && user?.role !== "manager") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  if (isLoadingUsers || isLoadingMeals || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Portal</h1>
        <div className="text-sm text-muted-foreground">
          Logged in as <span className="font-medium">{user.username}</span> ({user.role})
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="meals">Meal Management</TabsTrigger>
          <TabsTrigger value="curry-options">Curry Options</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Users</CardTitle>
              <div className="flex space-x-2">
                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                {user.role === "admin" && (
                  <Button onClick={handleAddUser}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.length > 0 ? (
                    filteredUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              user.role === "admin" 
                                ? "destructive" 
                                : user.role === "manager" 
                                  ? "default" 
                                  : "secondary"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditUser(user)}
                            disabled={user.role === "admin" && user.username !== "admin"}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* User form dialog */}
          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedUser ? "Edit User" : "Add User"}
                </DialogTitle>
                <DialogDescription>
                  {selectedUser 
                    ? "Update user information." 
                    : "Create a new user account."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUserFormSubmit}>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium">
                      Username
                    </label>
                    <Input 
                      id="username" 
                      name="username" 
                      defaultValue={selectedUser?.username} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      defaultValue={selectedUser?.email} 
                      required 
                    />
                  </div>
                  {!selectedUser && (
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium">
                        Password
                      </label>
                      <Input 
                        id="password" 
                        name="password" 
                        type="password" 
                        required={!selectedUser} 
                      />
                    </div>
                  )}
                  {selectedUser && (
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium">
                        New Password (leave blank to keep current)
                      </label>
                      <Input 
                        id="password" 
                        name="password" 
                        type="password" 
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium">
                      Role
                    </label>
                    <Select 
                      name="role" 
                      defaultValue={selectedUser?.role || "user"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        {user.role === "admin" && (
                          <SelectItem value="admin">Admin</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit">
                    {selectedUser ? "Update User" : "Create User"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="meals" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Meals</CardTitle>
              <div className="flex space-x-2">
                <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
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
                <Button onClick={handleAddMeal}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Meal
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">
                      Bulk Price Update
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Bulk Price Update</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will update the prices of all meals by the specified percentage.
                        Enter a positive number to increase prices or a negative number to decrease prices.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <form className="space-y-4 py-2">
                      <div className="space-y-2">
                        <label htmlFor="percentage" className="text-sm font-medium">
                          Percentage Change
                        </label>
                        <div className="flex items-center">
                          <Input
                            id="percentage"
                            name="percentage"
                            type="number"
                            placeholder="e.g. 10 or -5"
                            className="w-full"
                          />
                          <span className="ml-2">%</span>
                        </div>
                      </div>
                    </form>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => {
                          const percentageInput = document.getElementById('percentage') as HTMLInputElement;
                          const percentage = parseFloat(percentageInput.value);
                          
                          if (isNaN(percentage)) {
                            toast({
                              title: "Error",
                              description: "Please enter a valid percentage",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          try {
                            bulkUpdatePricesMutation.mutate({ percentage });
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error.message || "Failed to update prices",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMeals?.length > 0 ? (
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
                  <CardFooter className="flex flex-wrap justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-blue-600 border-blue-600"
                      onClick={() => handleManageMealCurryOptions(meal)}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="w-4 h-4 mr-1"
                      >
                        <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"></path>
                        <path d="M17.943 17.215a7.5 7.5 0 0 0 -10.415 -10.415"></path>
                        <path d="M12 8l1.5 2.5"></path>
                        <path d="M11 12.5l1.5 2.5"></path>
                        <path d="M16 14l0.5 3"></path>
                      </svg>
                      Curry Options
                    </Button>
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
                            onClick={() => deleteMealMutation.mutate(meal.id)}
                            className="bg-red-500 hover:bg-red-600"
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
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">No meals found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Meal form dialog */}
          <Dialog open={isMealDialogOpen} onOpenChange={setIsMealDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedMeal ? "Edit Meal" : "Add Meal"}
                </DialogTitle>
                <DialogDescription>
                  {selectedMeal 
                    ? "Update meal information." 
                    : "Create a new meal."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleMealFormSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                  <div className="space-y-2 col-span-full">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name
                    </label>
                    <Input 
                      id="name" 
                      name="name" 
                      defaultValue={selectedMeal?.name}
                      required 
                    />
                  </div>
                  <div className="space-y-2 col-span-full">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description
                    </label>
                    <Input 
                      id="description" 
                      name="description" 
                      defaultValue={selectedMeal?.description}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="price" className="text-sm font-medium">
                      Price (₹)
                    </label>
                    <Input 
                      id="price" 
                      name="price" 
                      type="number" 
                      defaultValue={selectedMeal?.price}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="imageUrl" className="text-sm font-medium">
                      Image URL
                    </label>
                    <Input 
                      id="imageUrl" 
                      name="imageUrl" 
                      defaultValue={selectedMeal?.imageUrl}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="milletType" className="text-sm font-medium">
                      Millet Type
                    </label>
                    <Select 
                      name="milletType" 
                      defaultValue={selectedMeal?.milletType || "finger_millet"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select millet type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="finger_millet">Finger Millet (Ragi)</SelectItem>
                        <SelectItem value="jowar">Jowar</SelectItem>
                        <SelectItem value="pearl_millet">Pearl Millet (Bajra)</SelectItem>
                        <SelectItem value="foxtail_millet">Foxtail Millet</SelectItem>
                        <SelectItem value="little_millet">Little Millet</SelectItem>
                        <SelectItem value="kodo_millet">Kodo Millet</SelectItem>
                        <SelectItem value="barnyard_millet">Barnyard Millet</SelectItem>
                        <SelectItem value="mixed">Mixed Millet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="mealType" className="text-sm font-medium">
                      Meal Type
                    </label>
                    <Select 
                      name="mealType" 
                      defaultValue={selectedMeal?.mealType || "dinner"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="calories" className="text-sm font-medium">
                      Calories
                    </label>
                    <Input 
                      id="calories" 
                      name="calories" 
                      type="number" 
                      defaultValue={selectedMeal?.calories}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="protein" className="text-sm font-medium">
                      Protein (g)
                    </label>
                    <Input 
                      id="protein" 
                      name="protein" 
                      type="number" 
                      defaultValue={selectedMeal?.protein}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="carbs" className="text-sm font-medium">
                      Carbs (g)
                    </label>
                    <Input 
                      id="carbs" 
                      name="carbs" 
                      type="number" 
                      defaultValue={selectedMeal?.carbs}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="fat" className="text-sm font-medium">
                      Fat (g)
                    </label>
                    <Input 
                      id="fat" 
                      name="fat" 
                      type="number" 
                      defaultValue={selectedMeal?.fat}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="fiber" className="text-sm font-medium">
                      Fiber (g)
                    </label>
                    <Input 
                      id="fiber" 
                      name="fiber" 
                      type="number" 
                      defaultValue={selectedMeal?.fiber}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="available" className="text-sm font-medium">
                      Availability
                    </label>
                    <Select 
                      name="available" 
                      defaultValue={selectedMeal?.available?.toString() || "true"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Available</SelectItem>
                        <SelectItem value="false">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-full">
                    <label htmlFor="dietaryPreferences" className="text-sm font-medium">
                      Dietary Preferences (comma-separated)
                    </label>
                    <Input 
                      id="dietaryPreferences" 
                      name="dietaryPreferences" 
                      defaultValue={selectedMeal?.dietaryPreferences?.join(', ') || "Vegetarian"}
                      required 
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit">
                    {selectedMeal ? "Update Meal" : "Create Meal"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="curry-options" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Curry Options</CardTitle>
              <Button onClick={handleAddCurryOption}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Curry Option
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingCurryOptions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : curryOptions?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {curryOptions.map((curry: any) => (
                    <Card key={curry.id} className="shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{curry.name}</CardTitle>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditCurryOption(curry)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteCurryOption(curry.id)}
                              className="h-8 w-8 text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>{curry.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            Price Adjustment: ₹{curry.priceAdjustment}
                          </span>
                          <Badge variant="outline" className={curry.mealId ? "" : "bg-blue-50"}>
                            {curry.mealId ? (
                              <>
                                Specific to{" "}
                                {(() => {
                                  const meal = meals?.find((m: any) => m.id === curry.mealId);
                                  return meal?.name || `Meal #${curry.mealId}`;
                                })()}
                              </>
                            ) : (
                              "Available for all meals"
                            )}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No curry options found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Curry option form dialog */}
          <Dialog open={isCurryDialogOpen} onOpenChange={setIsCurryDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedCurry ? "Edit Curry Option" : "Add Curry Option"}
                </DialogTitle>
                <DialogDescription>
                  {selectedCurry 
                    ? "Update curry option information." 
                    : "Create a new curry option."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCurryFormSubmit}>
                <div className="space-y-4 py-2">
                  {selectedCurry && (
                    <input type="hidden" name="id" value={selectedCurry.id} />
                  )}
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name
                    </label>
                    <Input 
                      id="name" 
                      name="name" 
                      defaultValue={selectedCurry?.name} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description
                    </label>
                    <Input 
                      id="description" 
                      name="description" 
                      defaultValue={selectedCurry?.description} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="priceAdjustment" className="text-sm font-medium">
                      Price Adjustment (₹)
                    </label>
                    <Input 
                      id="priceAdjustment" 
                      name="priceAdjustment" 
                      type="number" 
                      defaultValue={selectedCurry?.priceAdjustment || 0} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="mealId" className="text-sm font-medium">
                      Associated Meal
                    </label>
                    <Select 
                      name="mealId" 
                      defaultValue={selectedCurry?.mealId?.toString() || selectedMealForCurryOptions?.id?.toString() || "all"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Meals</SelectItem>
                        {meals?.map((meal: any) => (
                          <SelectItem key={meal.id} value={meal.id.toString()}>
                            {meal.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit">
                    {selectedCurry ? "Update Curry Option" : "Create Curry Option"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* Import MealCurryOptionsModal component */}
      <MealCurryOptionsModal 
        isOpen={isMealCurryOptionsModalOpen}
        onOpenChange={setIsMealCurryOptionsModalOpen}
        selectedMeal={selectedMealForCurryOptions}
        curryOptions={curryOptions || []}
        onEditCurryOption={handleEditCurryOption}
        onDeleteCurryOption={handleDeleteCurryOption}
        onAddCurryOption={handleAddCurryOptionForMeal}
      />
    </div>
  );
}