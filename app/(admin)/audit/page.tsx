"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { History, ShieldAlert, User, Terminal, Globe } from "lucide-react"

const logs = [
  { id: 1, type: "RENEW", admin: "Kofi Mensah", action: "Renewed OPN KS-1001", target: "Kwesi Mensah", ip: "192.168.1.1", date: "2026-02-10 14:30" },
  { id: 2, type: "AUTH", admin: "System", action: "Failed login attempt (x3)", target: "Admin Login Page", ip: "41.215.11.90", date: "2026-02-10 13:15" },
  { id: 3, type: "EXPORT", admin: "Admin One", action: "Downloaded Rider List CSV", target: "System Data", ip: "192.168.1.5", date: "2026-02-10 11:00" },
]

export default function AuditLog() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Audit Trail</h1>
          <p className="text-slate-500">Immutable forensic record of all administrative activities.</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 h-8">
             <ShieldAlert className="w-3 h-3 mr-2" /> Live Monitoring Active
           </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
         <Card className="p-4 bg-slate-900 text-white border-none">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Actions (24h)</p>
            <p className="text-2xl font-bold">1,244</p>
         </Card>
         {['System Auth', 'Permit Renewals', 'Data Exports'].map((stat, i) => (
           <Card key={stat} className="p-4 border-slate-200">
             <p className="text-[10px] uppercase font-bold text-slate-500">{stat}</p>
             <p className="text-2xl font-bold">{[45, 892, 12][i]}</p>
           </Card>
         ))}
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead>Time & Origin</TableHead>
              <TableHead>Administrator</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead className="text-right">Risk Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} className="text-sm">
                <TableCell>
                  <div className="font-mono text-xs text-slate-500">{log.date}</div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <Globe className="h-2 w-2" /> {log.ip}
                  </div>
                </TableCell>
                <TableCell className="font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <User className="h-3 w-3 text-slate-600" />
                  </div>
                  {log.admin}
                </TableCell>
                <TableCell>
                  <span className="font-medium text-slate-800">{log.action}</span>
                  <span className="text-slate-400 text-xs block italic">Target: {log.target}</span>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={
                    log.type === 'AUTH' ? 'border-red-200 text-red-600 bg-red-50' : 
                    log.type === 'EXPORT' ? 'border-amber-200 text-amber-600 bg-amber-50' : 
                    'border-slate-200 text-slate-500'
                  }>
                    {log.type}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}