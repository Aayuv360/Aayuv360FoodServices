import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MakeAdminPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || "user");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    
    try {
      // Use the updateUser function from useAuth
      if (updateUser) {
        await updateUser({ role: selectedRole });
        
        toast({
          title: "Role Updated",
          description: `Your role has been updated to ${selectedRole}`,
        });
      } else {
        // Fallback to direct API call if updateUser is not available
        await apiRequest("PATCH", `/api/users/${user.id}`, { role: selectedRole });
        
        // Refresh the page to update the user state
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Update Your Role</CardTitle>
          <CardDescription>
            Change your account role for testing admin and manager features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p>Current role: <span className="font-bold">{user?.role || "Not logged in"}</span></p>
            <p className="text-sm text-muted-foreground">
              Select a role to access different features:
              <br />
              - <strong>User:</strong> Regular user access
              <br />
              - <strong>Manager:</strong> Access to Order Management page
              <br />
              - <strong>Admin:</strong> Full access to Admin Portal and analytics
            </p>
          </div>
          
          <div className="space-y-4">
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
              disabled={!user || isUpdating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleRoleChange} 
              disabled={!user || isUpdating || selectedRole === user?.role}
              className="w-full"
            >
              {isUpdating ? "Updating..." : "Update Role"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}