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
import AdminMealCard from "@/components/admin/AdminMealCard";

export default function AdminPortalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [mealTypeFilter, setMealTypeFilter] = useState("all");
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isMealDialogOpen, setIsMealDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  
  // Function to parse and validate curry options string
  // Format should be: id1,name1,price1;id2,name2,price2
  const parseAndValidateCurryOptions = (optionsStr: string): [string, string, number][] | undefined => {
    if (!optionsStr.trim()) return undefined;
    
    try {
      // Split by semicolons to get each option
      const optionsArray = optionsStr.split(';')
        .map(option => option.trim())
        .filter(option => !!option);
      
      return optionsArray.map(option => {
        // Split each option by commas
        const [id, name, priceStr] = option.split(',').map(part => part.trim());
        const price = parseFloat(priceStr);
        
        if (!id || !name || isNaN(price)) {
          throw new Error(`Invalid curry option format: ${option}`);
        }
        
        return [id, name, price];
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Invalid curry options format. Use format: id1,name1,price1;id2,name2,price2`,
        variant: "destructive",
      });
      return undefined;
    }
  };

  // Query to fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch users");
      }
      return await res.json();
    },
  });

  // Query to fetch meals
  const { data: meals, isLoading: isLoadingMeals } = useQuery({
    queryKey: ["/api/admin/meals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/meals");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch meals");
      }
      return await res.json();
    },
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
      return await res.json();
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

  // Curry option mutations removed

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

    // Only include password if it's provided and non-empty
    const password = formData.get('password') as string;
    if (password) {
      (userData as any).password = password;
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
    
    // Parse curry options
    const curryOptionsString = formData.get('curryOptions') as string;
    const curryOptions = parseAndValidateCurryOptions(curryOptionsString);
    if (curryOptionsString && !curryOptions) return; // Stop if validation failed
    
    const mealData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      servingSize: formData.get('servingSize') as string,
      available: formData.get('available') === 'true',
      milletType: formData.get('milletType') as string,
      mealType: formData.get('mealType') as string,
      imageUrl: formData.get('imageUrl') as string,
      
      // Parse nutritional data
      calories: parseInt(formData.get('calories') as string, 10),
      protein: parseInt(formData.get('protein') as string, 10),
      carbs: parseInt(formData.get('carbs') as string, 10),
      fat: parseInt(formData.get('fat') as string, 10),
      fiber: parseInt(formData.get('fiber') as string, 10),
      
      // Split and trim the comma-separated list
      dietaryPreferences: (formData.get('dietaryPreferences') as string)
        .split(',')
        .map(pref => pref.trim())
        .filter(Boolean),
      
      // Add curry options if provided
      ...(curryOptions && { curryOptions }),
    };

    if (selectedMeal) {
      updateMealMutation.mutate({ id: selectedMeal.id, mealData });
    } else {
      createMealMutation.mutate(mealData);
    }
  };

  // Curry option handlers removed

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

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Portal</h1>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="meals">Meals</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
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
                <Button onClick={handleAddUser}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredUsers?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-xs">{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={
                            user.role === "admin" ? "bg-red-500" : 
                            user.role === "manager" ? "bg-blue-500" : 
                            "bg-green-500"
                          }>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex justify-center py-8 text-muted-foreground">
                  No users found.
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* User Edit/Add Dialog */}
          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedUser ? "Edit User" : "Add User"}
                </DialogTitle>
                <DialogDescription>
                  {selectedUser 
                    ? "Update user information and role." 
                    : "Create a new user account."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUserFormSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="username" className="text-right text-sm font-medium">
                      Username
                    </label>
                    <Input
                      id="username"
                      name="username"
                      defaultValue={selectedUser?.username}
                      required
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="email" className="text-right text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={selectedUser?.email}
                      required
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="password" className="text-right text-sm font-medium">
                      Password
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder={selectedUser ? "Leave blank to keep unchanged" : ""}
                      className="col-span-3"
                      {...(selectedUser ? {} : { required: true })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="role" className="text-right text-sm font-medium">
                      Role
                    </label>
                    <Select
                      name="role"
                      defaultValue={selectedUser?.role || "user"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
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
                    <SelectItem value="Breakfast">Breakfast</SelectItem>
                    <SelectItem value="Lunch">Lunch</SelectItem>
                    <SelectItem value="Dinner">Dinner</SelectItem>
                    <SelectItem value="Snack">Snack</SelectItem>
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
                    <div className="py-4">
                      <div className="space-y-2">
                        <label htmlFor="percentage" className="text-sm font-medium">
                          Percentage
                        </label>
                        <Input
                          id="percentage"
                          type="number"
                          placeholder="e.g., 5 for 5% increase"
                          className="col-span-3"
                          defaultValue={5}
                        />
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          const input = document.getElementById("percentage") as HTMLInputElement;
                          const value = parseFloat(input.value);
                          if (!isNaN(value)) {
                            bulkUpdatePricesMutation.mutate({ percentage: value });
                          }
                        }}
                      >
                        Update Prices
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingMeals ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredMeals?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMeals.map((meal: any) => (
                    <AdminMealCard 
                      key={meal.id} 
                      meal={meal} 
                      onEditMeal={handleEditMeal}
                      onDeleteMeal={(mealId) => deleteMealMutation.mutate(mealId)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex justify-center py-8 text-muted-foreground">
                  No meals found.
                </div>
              )}
            </CardContent>
          </Card>

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
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="name" className="text-right text-sm font-medium">
                      Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={selectedMeal?.name}
                      required
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="description" className="text-right text-sm font-medium">
                      Description
                    </label>
                    <Input
                      id="description"
                      name="description"
                      defaultValue={selectedMeal?.description}
                      required
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="price" className="text-right text-sm font-medium">
                      Price (₹)
                    </label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={selectedMeal?.price || 199}
                      required
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="servingSize" className="text-right text-sm font-medium">
                      Serving Size
                    </label>
                    <Input
                      id="servingSize"
                      name="servingSize"
                      defaultValue={selectedMeal?.servingSize || "1 bowl (250g)"}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="available" className="text-right text-sm font-medium">
                      Available
                    </label>
                    <Select
                      name="available"
                      defaultValue={selectedMeal?.available === false ? "false" : "true"}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Is this meal available?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="milletType" className="text-right text-sm font-medium">
                      Millet Type
                    </label>
                    <Select
                      name="milletType"
                      defaultValue={selectedMeal?.milletType || "Pearl Millet"}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a millet type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pearl Millet">Pearl Millet (Bajra)</SelectItem>
                        <SelectItem value="Finger Millet">Finger Millet (Ragi)</SelectItem>
                        <SelectItem value="Sorghum">Sorghum (Jowar)</SelectItem>
                        <SelectItem value="Foxtail Millet">Foxtail Millet (Kangni)</SelectItem>
                        <SelectItem value="Little Millet">Little Millet (Kutki)</SelectItem>
                        <SelectItem value="Barnyard Millet">Barnyard Millet (Sanwa)</SelectItem>
                        <SelectItem value="Kodo Millet">Kodo Millet</SelectItem>
                        <SelectItem value="Mixed Millet">Mixed Millet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="mealType" className="text-right text-sm font-medium">
                      Meal Type
                    </label>
                    <Select
                      name="mealType"
                      defaultValue={selectedMeal?.mealType || "Dinner"}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a meal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Breakfast">Breakfast</SelectItem>
                        <SelectItem value="Lunch">Lunch</SelectItem>
                        <SelectItem value="Dinner">Dinner</SelectItem>
                        <SelectItem value="Snack">Snack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="imageUrl" className="text-right text-sm font-medium">
                      Image URL
                    </label>
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      defaultValue={selectedMeal?.imageUrl || "/meal-placeholder.jpg"}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="calories" className="text-right text-sm font-medium">
                      Calories
                    </label>
                    <Input
                      id="calories"
                      name="calories"
                      type="number"
                      defaultValue={selectedMeal?.calories || 350}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="protein" className="text-right text-sm font-medium">
                      Protein (g)
                    </label>
                    <Input
                      id="protein"
                      name="protein"
                      type="number"
                      defaultValue={selectedMeal?.protein || 12}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="carbs" className="text-right text-sm font-medium">
                      Carbs (g)
                    </label>
                    <Input
                      id="carbs"
                      name="carbs"
                      type="number"
                      defaultValue={selectedMeal?.carbs || 45}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="fat" className="text-right text-sm font-medium">
                      Fat (g)
                    </label>
                    <Input
                      id="fat"
                      name="fat"
                      type="number"
                      defaultValue={selectedMeal?.fat || 15}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="fiber" className="text-right text-sm font-medium">
                      Fiber (g)
                    </label>
                    <Input
                      id="fiber"
                      name="fiber"
                      type="number"
                      defaultValue={selectedMeal?.fiber || 8}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="dietaryPreferences" className="text-right text-sm font-medium">
                      Dietary Preferences
                    </label>
                    <Input
                      id="dietaryPreferences"
                      name="dietaryPreferences"
                      defaultValue={selectedMeal?.dietaryPreferences?.join(', ') || "Vegetarian"}
                      placeholder="Comma-separated, e.g.: Vegetarian, Non-Vegetarian"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="curryOptions" className="text-right text-sm font-medium">
                      Curry Options
                    </label>
                    <Input 
                      id="curryOptions" 
                      name="curryOptions" 
                      defaultValue={selectedMeal?.curryOptions ? 
                        selectedMeal.curryOptions.map((option: any) => 
                          `${option[0]},${option[1]},${option[2]}`
                        ).join(';') 
                        : 
                        "regular,Regular Curry,0;spicy,Spicy Curry,25"
                      }
                      placeholder="id,name,price; separated by semicolons"
                      className="col-span-3"
                    />
                  </div>
                  <div className="col-span-full px-4 text-xs text-muted-foreground">
                    Format: id,name,price; Multiple options separated by semicolons
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {selectedMeal ? "Update Meal" : "Create Meal"}
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