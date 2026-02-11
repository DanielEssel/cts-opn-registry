"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Calendar, BarChart, PieChart, TrendingUp } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Analytics</h1>
          <p className="text-slate-500">Detailed reporting and data export for MMDCE decision making.</p>
        </div>
        <Button variant="outline" className="h-11">
          <Download className="mr-2 h-4 w-4" /> Export Full Report (.CSV)
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Registration Rate */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium uppercase text-slate-500 tracking-wider">Permit Validity</CardTitle>
            <PieChart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500"/> Active</span>
                    <span className="font-bold">88%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-amber-500"/> Expiring Soon</span>
                    <span className="font-bold">7%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-500"/> Expired</span>
                    <span className="font-bold">5%</span>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Growth Metric */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase text-slate-500 tracking-wider">Town Performance (Registrations)</CardTitle>
          </CardHeader>
          <CardContent className="h-40 flex flex-col justify-end gap-2">
            {/* Simple Bar Chart Placeholder with CSS */}
            <div className="flex items-end justify-between h-full gap-4 pt-4">
                <div className="w-full bg-blue-600 rounded-t-md" style={{height: '90%'}}><p className="text-[10px] text-center text-white mt-1">Kumasi</p></div>
                <div className="w-full bg-blue-500 rounded-t-md" style={{height: '75%'}}><p className="text-[10px] text-center text-white mt-1">Accra</p></div>
                <div className="w-full bg-blue-400 rounded-t-md" style={{height: '45%'}}><p className="text-[10px] text-center text-white mt-1">Tamale</p></div>
                <div className="w-full bg-blue-300 rounded-t-md" style={{height: '30%'}}><p className="text-[10px] text-center text-white mt-1">Tema</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Goals Section */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
            <CardTitle>Regional Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold">Most Active Region</p>
                        <p className="text-lg font-bold">Ashanti (KS)</p>
                    </div>
                    <TrendingUp className="text-green-500 h-8 w-8" />
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold">Critical Renewal Zone</p>
                        <p className="text-lg font-bold">Greater Accra (AC)</p>
                    </div>
                    <Calendar className="text-amber-500 h-8 w-8" />
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}