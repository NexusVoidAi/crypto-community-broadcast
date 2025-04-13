
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus } from "lucide-react";

const Users = () => {
  const users = [
    {
      id: 1,
      name: "Alex Johnson",
      email: "alex.johnson@example.com",
      role: "admin",
      status: "active",
      joined: "Mar 12, 2025",
      communities: 8
    },
    {
      id: 2,
      name: "Samantha Lee",
      email: "samantha.lee@example.com",
      role: "moderator",
      status: "active",
      joined: "Jan 28, 2025",
      communities: 5
    },
    {
      id: 3,
      name: "David Chen",
      email: "david.chen@example.com",
      role: "user",
      status: "inactive",
      joined: "Apr 5, 2025",
      communities: 3
    },
    {
      id: 4,
      name: "Emma Wilson",
      email: "emma.wilson@example.com",
      role: "user",
      status: "active",
      joined: "Feb 17, 2025",
      communities: 6
    },
    {
      id: 5,
      name: "Michael Brown",
      email: "michael.brown@example.com",
      role: "moderator",
      status: "active",
      joined: "Mar 30, 2025",
      communities: 4
    },
  ];

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'moderator': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'user': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return '';
    }
  };

  const getStatusClass = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search users..."
              className="pl-8 w-full sm:w-[250px]"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Add User
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full mt-4">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 pl-4">User</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Joined</th>
                  <th className="pb-3">Communities</th>
                  <th className="pb-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-4 pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`https://i.pravatar.cc/40?u=${user.id}`} />
                          <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge className={getRoleBadgeClass(user.role)}>{user.role}</Badge>
                    </td>
                    <td>
                      <Badge className={getStatusClass(user.status)}>{user.status}</Badge>
                    </td>
                    <td>{user.joined}</td>
                    <td>{user.communities}</td>
                    <td className="text-right pr-4">
                      <Button variant="outline" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
