
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart } from "@/components/ui/chart";

const Analytics = () => {
  // Sample data for charts
  const barChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Announcements',
        data: [65, 59, 80, 81, 56, 55],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Engagement',
        data: [28, 48, 40, 19, 86, 27],
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      },
    ],
  };

  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Community Growth',
        data: [12, 19, 25, 32, 45, 60],
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Announcement Performance</CardTitle>
            <CardDescription>Monthly announcements and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={barChartData} height={300} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Community Growth</CardTitle>
            <CardDescription>Monthly community member growth</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart data={lineChartData} height={300} />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
          <CardDescription>Overall platform metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
