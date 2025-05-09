import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "@/hooks/use-auth";

// Custom color palette for charts
const COLORS = [
  "#FF6B6B", // red
  "#4ECDC4", // teal
  "#FFD166", // yellow
  "#6B5CA5", // purple
  "#72B01D", // green
  "#3A86FF", // blue
  "#F72585", // pink
  "#FFBD00", // amber
];

const dateRanges = [
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "90days", label: "Last 90 Days" },
  { value: "year", label: "This Year" },
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("30days");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/analytics", dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics?range=${dateRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      return response.json();
    },
    enabled: !!user && user.role === "admin",
  });

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
          The analytics dashboard is only available to administrators.
        </p>
      </div>
    );
  }

  // Format and prepare data from the API
  const revenueData = analyticsData?.revenue || [];
  const categoryData = analyticsData?.categoryDistribution?.map((cat: any) => ({
    name: cat.category,
    value: cat.orders,
    revenue: cat.revenue,
  })) || [];
  
  const userData = analyticsData?.userActivity || [];
  
  const subscriptionData = analyticsData?.subscriptionStats?.map((sub: any) => ({
    name: sub.type,
    value: sub.count,
    revenue: sub.revenue,
  })) || [];
  
  const topMealsData = analyticsData?.topMeals || [];
  
  const orderTimeData = analyticsData?.orderTimeDistribution || [];
  
  // Stats cards
  const stats = [
    {
      title: "Total Revenue",
      value: `₹${analyticsData?.totalRevenue?.toLocaleString() || 0}`,
      change: `${analyticsData?.revenueGrowth > 0 ? '+' : ''}${analyticsData?.revenueGrowth?.toFixed(1) || 0}%`,
      trend: analyticsData?.revenueGrowth > 0 ? "up" : "down",
    },
    {
      title: "Active Subscriptions",
      value: analyticsData?.activeSubscriptions?.toString() || "0",
      change: "+0%", // We could calculate this if we had historical data
      trend: "up",
    },
    {
      title: "Total Orders",
      value: analyticsData?.totalOrders?.toString() || "0",
      change: "+0%", // We could calculate this if we had historical data
      trend: "up",
    },
    {
      title: "New Customers",
      value: analyticsData?.newCustomers?.toString() || "0", 
      change: "+0%", // We could calculate this if we had historical data
      trend: "up",
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Business intelligence and insights for your millet food service
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            defaultValue={dateRange}
            onValueChange={(value) => setDateRange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {dateRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-2xl font-bold">{stat.value}</h3>
                      <span
                        className={`text-sm font-medium ${
                          stat.trend === "up"
                            ? "text-green-600"
                            : "text-destructive"
                        }`}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Revenue Trend */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Weekly Revenue</CardTitle>
                <CardDescription>
                  Sales performance over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={revenueData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#8884d8"
                      name="Daily Revenue"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>
                  Orders by millet category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Order Times */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Peak Order Times</CardTitle>
                <CardDescription>
                  Distribution of orders by time of day
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={orderTimeData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timeSlot" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="count"
                      fill="#FF6B6B"
                      name="Number of Orders"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Meals */}
            <Card>
              <CardHeader>
                <CardTitle>Top Meals</CardTitle>
                <CardDescription>Most ordered items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topMealsData.map((meal: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{index + 1}.</span>
                        <span className="text-sm">{meal.name}</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {meal.orders} orders
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue by Subscription Type */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Subscription</CardTitle>
                <CardDescription>
                  Distribution of revenue across subscription types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={subscriptionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {subscriptionData.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Average Order Value */}
            <Card>
              <CardHeader>
                <CardTitle>Average Order Value</CardTitle>
                <CardDescription>
                  Current average order value: ₹{analyticsData?.averageOrderValue?.toFixed(2) || 0}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="flex flex-col items-center justify-center h-[300px]">
                  <div className="text-4xl font-bold">
                    ₹{analyticsData?.averageOrderValue?.toFixed(2) || 0}
                  </div>
                  <p className="text-muted-foreground mt-2">Average Spend Per Order</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth</CardTitle>
              <CardDescription>
                Growth over the selected period: {analyticsData?.revenueGrowth?.toFixed(1) || 0}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-[300px]">
                <div className={`text-4xl font-bold ${analyticsData?.revenueGrowth > 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {analyticsData?.revenueGrowth > 0 ? '+' : ''}{analyticsData?.revenueGrowth?.toFixed(1) || 0}%
                </div>
                <p className="text-muted-foreground mt-2">Revenue Growth Rate</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>
                  Orders by millet category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Meals */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Meals</CardTitle>
                <CardDescription>Most ordered items by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topMealsData.map((meal: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{index + 1}.</span>
                        <span className="text-sm">{meal.name}</span>
                      </div>
                      <span className="text-sm font-semibold">
                        ₹{meal.revenue?.toLocaleString() || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* User Activity */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>
                  New and active users over time
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={userData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="newUsers"
                      stroke="#FF6B6B"
                      name="New Users"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="activeUsers"
                      stroke="#4ECDC4"
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Location Data */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Distribution</CardTitle>
              <CardDescription>
                Customers by location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.locationData?.map((location: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{location.location}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold">
                        {location.customers} customers
                      </span>
                      <span className="text-sm">
                        {location.orders} orders
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}