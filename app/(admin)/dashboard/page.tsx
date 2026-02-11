"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdvancedDashboard() {
  const recentActions = [
    { id: 1, admin: "Kofi M.", action: "Renewed OPN", target: "KS-1022", time: "2 mins ago" },
    { id: 2, admin: "System", action: "SMS Sent", target: "024XXXX90", time: "15 mins ago" },
    { id: 3, admin: "Ama S.", action: "New Registration", target: "AC-5066", time: "1 hour ago" },
  ]

  return (
    <div className="space-y-6">
      {/* Top Row: System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-600 text-white border-none shadow-blue-200 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm font-medium">Monthly Revenue Estimate</p>
                <h3 className="text-3xl font-bold mt-1">GH₵ 45,200</h3>
              </div>
              <div className="p-2 bg-blue-500/50 rounded-lg">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-blue-200 mt-4">+18% growth from Jan 2026</p>
          </CardContent>
        </Card>
        
        {/* District Performance Card */}
        <Card className="md:col-span-2 border-slate-200">
           <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Top Performing MMDCEs</CardTitle>
              <Badge variant="outline">Live Updates</Badge>
           </CardHeader>
           <CardContent className="grid grid-cols-3 gap-4 py-2">
              {['Kumasi', 'Accra', 'Tamale'].map((city, i) => (
                <div key={city} className="text-center border-r last:border-none">
                   <p className="text-xs text-slate-500">{city}</p>
                   <p className="text-xl font-bold">{[85, 72, 44][i]}%</p>
                   <p className="text-[10px] text-green-600 font-bold">Compliance</p>
                </div>
              ))}
           </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Activity Feed */}
        <Card className="lg:col-span-1 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-6">
                {recentActions.map((item) => (
                  <div key={item.id} className="flex gap-4 relative">
                    <div className="mt-1"><CheckCircle2 className="h-4 w-4 text-green-500" /></div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-800">
                        {item.admin} <span className="text-slate-500 font-normal">{item.action}</span>
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                         <Badge variant="secondary" className="text-[10px] py-0">{item.target}</Badge>
                         <span>•</span>
                         <span>{item.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* System Warnings/Alerts */}
        <Card className="lg:col-span-2 border-red-100 bg-red-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" /> System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-3">
                <div className="p-3 bg-white border border-red-100 rounded-lg flex justify-between items-center shadow-sm">
                   <p className="text-sm text-slate-700 font-medium">SMS Gateway Low Balance</p>
                   <Button size="sm" variant="destructive">Recharge</Button>
                </div>
                <div className="p-3 bg-white border border-red-100 rounded-lg flex justify-between items-center shadow-sm">
                   <p className="text-sm text-slate-700 font-medium">15 Permits Expiring within 24hrs</p>
                   <Button size="sm" variant="outline">Remind All</Button>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}