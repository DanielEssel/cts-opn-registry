import Sidebar from "@/app/components/layout/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - The navigation we built earlier */}
      <Sidebar /> 

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b bg-white flex items-center justify-end px-8">
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-600 tracking-tight">Tuesday, 10 Feb 2026</span>
                <div className="h-8 w-8 rounded-full bg-blue-600" />
            </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}