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
  User,
  TrendingUp,
  MessageCircle
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
      color: "text-[var(--ink-3)]"
    },
    { 
      id: "correcao", 
      label: "Nova Correção", 
      icon: PenTool,
      color: "text-[var(--red)]"
    },
    { 
      id: "historico", 
      label: "Minhas Redações", 
      icon: History,
      color: "text-[var(--ink-2)]"
    },
    { 
      id: "progresso", 
      label: "Meu Progresso", 
      icon: TrendingUp,
      color: "text-green-600"
    },
    { 
      id: "repertorios", 
      label: "Biblioteca de Repertórios", 
      icon: BookOpen,
      color: "text-amber-600"
    },
    { 
      id: "conectivos", 
      label: "Biblioteca de Conectivos", 
      icon: Zap,
      color: "text-[var(--red)]"
    },
    { 
      id: "upgrade", 
      label: "Plano PRO", 
      icon: Sparkles,
      color: "text-amber-500"
    },
  ];

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 left-6 z-[60] md:hidden p-3 bg-[var(--paper)]/90 backdrop-blur-md border border-[var(--line)] rounded-2xl shadow-xl hover:bg-[var(--paper-2)] transition-all active:scale-95 group"
      >
        {isOpen ? <X className="w-6 h-6 text-[var(--red)]" /> : <Menu className="w-6 h-6 text-[var(--red)] group-hover:scale-110 transition-transform" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[var(--paper)]/80 backdrop-blur-sm z-[50] md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed top-0 left-0 z-[55] h-screen w-64 bg-[var(--paper)] border-r border-[var(--line)] transition-transform duration-300 md:translate-x-0 flex flex-col shadow-sm",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Section */}
        <div className="p-6 border-b border-[var(--line)]">
          <Link to="/" className="flex items-center gap-2" onClick={closeSidebar}>
            <span className="font-['Fraunces'] text-2xl font-black italic tracking-tighter text-[var(--ink)]">
              CORRIGE<span className="text-[var(--red)]">AI</span>
            </span>
          </Link>
          <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-[var(--paper-2)] border border-[var(--line)] shadow-inner">
            <div className="h-8 w-8 rounded-full bg-[var(--red)]/10 border border-[var(--red)]/20 flex items-center justify-center text-[var(--red)] font-bold shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black truncate text-[var(--ink)]">{profile?.full_name?.split(' ')[0] || 'Estudante'}</p>
              <p className="text-[10px] text-[var(--red)] font-black uppercase tracking-widest">
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
                // Histórico detalhado continua restrito; bibliotecas têm prévia liberada
                if ((item.id === "historico" || item.id === "progresso") && !profile?.is_pro) {
                  setActiveSection("upgrade");
                } else {
                  setActiveSection(item.id);
                }
                closeSidebar();
              }}

              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group",
                activeSection === item.id 
                  ? "bg-[var(--paper-2)] text-[var(--ink)] border border-[var(--line)] shadow-sm" 
                  : "text-[var(--ink-3)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)] border border-transparent"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", activeSection === item.id ? "text-[var(--red)]" : item.color)} />
              <span className="text-left leading-tight tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-[var(--line)] space-y-2">
          <a 
            href="https://wa.me/5548996736743"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black text-[#25D366] hover:bg-[#25D366]/5 transition-colors border border-transparent hover:border-[#25D366]/20"
          >
            <MessageCircle className="w-5 h-5 fill-[#25D366]/10" />
            Suporte WhatsApp
          </a>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black text-[var(--red)] hover:bg-[var(--red)]/5 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </button>
        </div>
      </aside>
    </>
  );
}
