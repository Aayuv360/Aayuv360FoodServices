import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
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
  const categoryData = analyticsData?.categoryDistribution.map(cat => ({
    name: cat.category,
    value: cat.orders,
    revenue: cat.revenue,
  })) || [];
  
  const userData = analyticsData?.userActivity || [];
  
  const subscriptionData = analyticsData?.subscriptionStats.map(sub => ({
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
      value: `₹${analyticsData?.totalRevenue.toLocaleString() || 0}`,
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
                  Sales performance over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={mockSalesData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#8884d8"
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
                        data={mockCategoryData}
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
                        {mockCategoryData.map((entry, index) => (
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
                    data={mockOrderTimesData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="orders"
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
                  {mockTopMeals.map((meal, index) => (
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
                        data={mockSubscriptions}
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
                        {mockSubscriptions.map((entry, index) => (
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

            {/* Monthly Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>
                  Revenue trend over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { month: "Jan", revenue: 35000 },
                      { month: "Feb", revenue: 42000 },
                      { month: "Mar", revenue: 38000 },
                      { month: "Apr", revenue: 45000 },
                      { month: "May", revenue: 50000 },
                      { month: "Jun", revenue: 58000 },
                    ]}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`₹${value}`, "Revenue"]}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#4ECDC4"
                      name="Revenue (₹)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Average Order Value</CardTitle>
              <CardDescription>
                Average order value trend by month
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={[
                    { month: "Jan", aov: 420 },
                    { month: "Feb", aov: 438 },
                    { month: "Mar", aov: 445 },
                    { month: "Apr", aov: 452 },
                    { month: "May", aov: 468 },
                    { month: "Jun", aov: 475 },
                  ]}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value}`, "AOV"]} />
                  <Line
                    type="monotone"
                    dataKey="aov"
                    stroke="#FF6B6B"
                    activeDot={{ r: 8 }}
                    name="Average Order Value (₹)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Most Popular Products */}
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Meals</CardTitle>
                <CardDescription>
                  Top 10 most ordered meals
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    layout="vertical"
                    data={[
                      { name: "Ragi Dosa", orders: 245 },
                      { name: "Jowar Roti", orders: 186 },
                      { name: "Bajra Khichdi", orders: 165 },
                      { name: "Foxtail Upma", orders: 140 },
                      { name: "Ragi Mudde", orders: 123 },
                      { name: "Ragi Idli", orders: 110 },
                      { name: "Jowar Uttapam", orders: 98 },
                      { name: "Pearl Millet Porridge", orders: 92 },
                      { name: "Little Millet Pulao", orders: 85 },
                      { name: "Foxtail Millet Dosa", orders: 78 },
                    ].reverse()}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 100,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar
                      dataKey="orders"
                      fill="#6B5CA5"
                      name="Number of Orders"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Product Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>
                  Distribution of meals by millet type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={mockCategoryData}
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
                        {mockCategoryData.map((entry, index) => (
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

          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>
                Orders vs Revenue for top products
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: "Ragi Dosa",
                      orders: 245,
                      revenue: 24500,
                    },
                    {
                      name: "Jowar Roti",
                      orders: 186,
                      revenue: 18600,
                    },
                    {
                      name: "Bajra Khichdi",
                      orders: 165,
                      revenue: 18150,
                    },
                    {
                      name: "Foxtail Upma",
                      orders: 140,
                      revenue: 15400,
                    },
                    {
                      name: "Ragi Mudde",
                      orders: 123,
                      revenue: 12300,
                    },
                  ]}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, "dataMax"]}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="orders"
                    fill="#72B01D"
                    name="Orders"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="revenue"
                    fill="#3A86FF"
                    name="Revenue (₹)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* User Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Growth</CardTitle>
                <CardDescription>
                  New and active users by month
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={mockUserData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="newUsers"
                      stroke="#FF6B6B"
                      activeDot={{ r: 8 }}
                      name="New Users"
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

            {/* Customer Retention */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Retention</CardTitle>
                <CardDescription>
                  Monthly retention rates by cohort
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={[
                      { month: "Month 1", retention: 100 },
                      { month: "Month 2", retention: 65 },
                      { month: "Month 3", retention: 48 },
                      { month: "Month 4", retention: 42 },
                      { month: "Month 5", retention: 38 },
                      { month: "Month 6", retention: 35 },
                    ]}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, "Retention"]} />
                    <Line
                      type="monotone"
                      dataKey="retention"
                      stroke="#FFD166"
                      activeDot={{ r: 8 }}
                      name="Retention Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Customer Geographic Distribution</CardTitle>
              <CardDescription>
                Distribution of customers by area in Hyderabad
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { area: "Gachibowli", customers: 145 },
                    { area: "Hitech City", customers: 112 },
                    { area: "Madhapur", customers: 98 },
                    { area: "Kondapur", customers: 86 },
                    { area: "Jubilee Hills", customers: 72 },
                    { area: "Banjara Hills", customers: 68 },
                    { area: "Kukatpally", customers: 54 },
                    { area: "Ameerpet", customers: 42 },
                  ]}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="customers"
                    fill="#F72585"
                    name="Number of Customers"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}