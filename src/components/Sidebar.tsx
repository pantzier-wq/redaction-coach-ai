import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { 
  LayoutDashboard, 
  PenTool, 
  History, 
  Sparkles, 
  BookOpen, 
  Zap, 
  Menu, 
  X,
  LogOut,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  profile: any;
  activeSection: string;
  setActiveSection: (section: string) => void;
  onLogout: () => void;
}

export function Sidebar({ profile, activeSection, setActiveSection, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { 
      id: "dashboard", 
      label: "Início", 
      icon: LayoutDashboard,
      color: "text-foreground"
    },
    { 
      id: "correcao", 
      label: "Nova Correção", 
      icon: PenTool,
      color: "text-primary"
    },
    { 
      id: "historico", 
      label: "Minhas Redações", 
      icon: History,
      color: "text-foreground"
    },
    { 
      id: "repertorios", 
      label: "Biblioteca de Repertórios", 
      icon: BookOpen,
      color: "text-secondary"
    },
    { 
      id: "conectivos", 
      label: "Biblioteca de Conectivos", 
      icon: Zap,
      color: "text-primary"
    },
    { 
      id: "upgrade", 
      label: "Plano PRO", 
      icon: Sparkles,
      color: "text-secondary"
    },
  ];

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 left-6 z-[60] md:hidden p-3 bg-card/90 backdrop-blur-md border border-border/50 rounded-2xl shadow-xl hover:bg-muted transition-all active:scale-95 group"
      >
        {isOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[50] md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed top-0 left-0 z-[55] h-screen w-64 bg-card border-r border-border transition-transform duration-300 md:translate-x-0 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Section */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2" onClick={closeSidebar}>
            <span className="text-2xl font-black italic tracking-tighter">
              CORRIGE<span className="text-primary">AI</span>
            </span>
          </Link>
          <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black truncate">{profile?.full_name?.split(' ')[0] || 'Estudante'}</p>
              <p className="text-[10px] text-primary font-black uppercase tracking-tighter">
                {profile?.has_full_access ? "PRO COMPLETO" : profile?.is_pro ? "PRO BÁSICO" : "VIP FREE"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                // Bloqueio de acesso para quem não tem acesso total
                if ((item.id === "repertorios" || item.id === "conectivos") && !profile?.has_full_access) {
                  setActiveSection("upgrade");
                } else if (item.id === "historico" && !profile?.is_pro) {
                  setActiveSection("upgrade");
                } else {
                  setActiveSection(item.id);
                }
                closeSidebar();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group",
                activeSection === item.id 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeSection === item.id ? "text-primary" : item.color)} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-border">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </button>
        </div>
      </aside>
    </>
  );
}
