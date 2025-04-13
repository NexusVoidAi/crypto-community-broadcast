
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart as RechartsBarChart, 
  LineChart as RechartsLineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const Analytics = () => {
  // Sample data for charts
  const barChartData = [
    { month: 'Jan', Announcements: 65, Engagement: 28 },
    { month: 'Feb', Announcements: 59, Engagement: 48 },
    { month: 'Mar', Announcements: 80, Engagement: 40 },
    { month: 'Apr', Announcements: 81, Engagement: 19 },
    { month: 'May', Announcements: 56, Engagement: 86 },
    { month: 'Jun', Announcements: 55, Engagement: 27 },
  ];

  const lineChartData = [
    { month: 'Jan', Growth: 12 },
    { month: 'Feb', Growth: 19 },
    { month: 'Mar', Growth: 25 },
    { month: 'Apr', Growth: 32 },
    { month: 'May', Growth: 45 },
    { month: 'Jun', Growth: 60 },
  ];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Announcement Performance</CardTitle>
            <CardDescription>Monthly announcements and engagement</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={barChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Announcements" fill="rgba(75, 192, 192, 0.6)" />
                <Bar dataKey="Engagement" fill="rgba(153, 102, 255, 0.6)" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Community Growth</CardTitle>
            <CardDescription>Monthly community member growth</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={lineChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Growth" 
                  stroke="rgba(255, 99, 132, 1)" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  fill="rgba(255, 99, 132, 0.2)" 
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
          <CardDescription>Overall platform metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background p-4 rounded-md shadow">
              <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
              <p className="text-2xl font-bold">4,289</p>
              <p className="text-xs text-green-500">+12% from last month</p>
            </div>
            <div className="bg-background p-4 rounded-md shadow">
              <h3 className="text-sm font-medium text-muted-foreground">Announcements</h3>
              <p className="text-2xl font-bold">1,453</p>
              <p className="text-xs text-green-500">+8% from last month</p>
            </div>
            <div className="bg-background p-4 rounded-md shadow">
              <h3 className="text-sm font-medium text-muted-foreground">Communities</h3>
              <p className="text-2xl font-bold">243</p>
              <p className="text-xs text-green-500">+15% from last month</p>
            </div>
            <div className="bg-background p-4 rounded-md shadow">
              <h3 className="text-sm font-medium text-muted-foreground">Engagement Rate</h3>
              <p className="text-2xl font-bold">24.8%</p>
              <p className="text-xs text-red-500">-2% from last month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
