"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  BarChart3, 
  LogOut, 
  ShieldCheck,
  UserPlus
} from "lucide-react"
import { cn } from "@/lib/utils"

// Define the navigation items
const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Rider Registry", href: "/riders", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "User Management", href: "/settings", icon: UserPlus }, // For Multi-admin access
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex w-64 bg-slate-900 h-full flex-col text-slate-300">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
          <ShieldCheck className="text-white h-6 w-6" />
        </div>
        <div>
          <span className="font-bold text-lg text-white block leading-none">PermitTrack</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Admin Portal</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1.5">
        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
          Main Menu
        </p>
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-colors", 
                isActive ? "text-white" : "text-slate-400 group-hover:text-white"
              )} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer / User Profile Area */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3 px-3 py-3 mb-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            AD
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">CTS Admin</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Super Administrator</p>
          </div>
        </div>
        
        <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-950/20 hover:text-red-400 transition-all">
          <LogOut className="h-5 w-5" /> 
          Logout
        </button>
      </div>
    </div>
  )
}