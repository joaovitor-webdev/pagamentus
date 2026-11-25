'use client';

import React from 'react';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Wallet,
  Users,
  Receipt,
  FileSpreadsheet,
  CalendarClock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { podeAcessarModulo, PapelUsuario } from '@/lib/permissoes';

export type ModuloId =
  | 'dashboard'
  | 'cadastros'
  | 'contabil'
  | 'financeiro'
  | 'folha'
  | 'fiscal'
  | 'obrigacoes'
  | 'parametros'
  | 'auditoria';

interface SidebarProps {
  moduloAtivo: ModuloId;
  onSelectModulo: (id: ModuloId) => void;
  recolhido: boolean;
  onToggleRecolher: () => void;
  mobileAberto: boolean;
  onFecharMobile: () => void;
  usuarioNome: string;
  usuarioPapel: string;
  onLogout: () => void;
}

const ITENS_MENU: Array<{
  id: ModuloId;
  label: string;
  grupo: string;
  icon: React.ElementType;
}> = [
  { id: 'dashboard', label: 'Visão Geral', grupo: 'Principal', icon: LayoutDashboard },
  { id: 'folha', label: 'Folha de Pagamento', grupo: 'Rotina Diária', icon: Users },
  { id: 'contabil', label: 'Contábil & Diário', grupo: 'Rotina Diária', icon: BookOpen },
  { id: 'financeiro', label: 'Contas a Pagar/Receber', grupo: 'Rotina Diária', icon: Wallet },
  { id: 'fiscal', label: 'Fiscal & Imposto de Renda', grupo: 'Tributário', icon: Receipt },
  { id: 'obrigacoes', label: 'Obrigações & Prazos', grupo: 'Tributário', icon: CalendarClock },
  { id: 'cadastros', label: 'Cadastros & Documentos', grupo: 'Gestão', icon: Building2 },
  { id: 'parametros', label: 'Parâmetros Legais', grupo: 'Governança', icon: FileSpreadsheet },
  { id: 'auditoria', label: 'Relatórios & Auditoria', grupo: 'Governança', icon: ShieldCheck },
];

export function Sidebar({
  moduloAtivo,
  onSelectModulo,
  recolhido,
  onToggleRecolher,
  mobileAberto,
  onFecharMobile,
  usuarioNome,
  usuarioPapel,
  onLogout,
}: SidebarProps) {
  return (
    <>
      {/* Backdrop Mobile */}
      {mobileAberto && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onFecharMobile}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out select-none',
          recolhido ? 'w-20' : 'w-64',
          mobileAberto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo + Botão Recolher */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
              PG
            </div>
            {!recolhido && (
              <div className="truncate">
                <span className="font-bold text-slate-900 text-base tracking-tight">
                  Pagamentus
                </span>
                <p className="text-[11px] text-slate-400 leading-none">Gestão Contábil</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleRecolher}
            aria-label={recolhido ? 'Expandir menu' : 'Recolher menu'}
            className="hidden lg:flex w-7 h-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {recolhido ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onFecharMobile}
            aria-label="Fechar menu"
            className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegação filtrada pelo papel real do usuário */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {ITENS_MENU.filter((item) =>
            podeAcessarModulo((usuarioPapel as PapelUsuario) || 'CLIENTE', item.id as never)
          ).map((item) => {
            const Icon = item.icon;
            const ativo = moduloAtivo === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectModulo(item.id);
                  onFecharMobile();
                }}
                title={recolhido ? item.label : undefined}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                  ativo
                    ? 'bg-blue-50 text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-0.5'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    ativo ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                {!recolhido && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Rodapé do Usuário */}
        <div className="p-3 border-t border-slate-100">
          <div
            className={cn(
              'flex items-center gap-2.5 p-2 rounded-lg bg-slate-50',
              recolhido && 'justify-center'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center shrink-0">
              {usuarioNome.slice(0, 2).toUpperCase()}
            </div>
            {!recolhido && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{usuarioNome}</p>
                <p className="text-[11px] text-blue-600 font-medium truncate">{usuarioPapel}</p>
              </div>
            )}
            <button
              type="button"
              onClick={onLogout}
              title="Sair do sistema"
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
