"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { UserPlus, Shield, Building2, Mail, MoreVertical, Trash2 } from "lucide-react"

// Mock data for Admin Users
const adminUsers = [
  { id: 1, name: "Admin One", email: "admin@cts.com", role: "Super Admin", entity: "CTS Firm", status: "Active" },
  { id: 2, name: "Kofi Mensah", email: "k.mensah@mmdce.gov.gh", role: "District Admin", entity: "Kumasi MMDCE", status: "Active" },
  { id: 3, name: "Ama Serwaa", email: "a.serwaa@mmdce.gov.gh", role: "Operator", entity: "Accra MMDCE", status: "Inactive" },
]

export default function UserManagement() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-slate-500">Manage administrative access levels for CTS and MMDCE staff.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 h-11">
          <UserPlus className="mr-2 h-4 w-4" /> Add New Admin
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Role Overview Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-slate-900 text-white border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">CTS Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4 Users</div>
              <p className="text-[10px] text-slate-500 mt-1">Full System Control</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">MMDCE Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12 Users</div>
              <p className="text-[10px] text-slate-500 mt-1">District-level access</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">System Operators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45 Users</div>
              <p className="text-[10px] text-slate-500 mt-1">Registration only</p>
            </CardContent>
          </Card>
        </div>

        {/* User Table */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg">Administrative Accounts</CardTitle>
            <CardDescription>A list of all users with access to the PermitTrack dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Information</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Assigned Entity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className={`h-4 w-4 ${user.role === 'Super Admin' ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="text-sm">{user.role}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 className="h-4 w-4" /> {user.entity}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'Active' ? 'default' : 'secondary'} className={
                        user.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-100 shadow-none' : ''
                      }>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}