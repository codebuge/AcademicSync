'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  TrendingUp,
  LogOut,
  GraduationCap,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Marks', href: '/marks', icon: BookOpen },
  { label: 'Transcript', href: '/transcript', icon: FileText },
  { label: 'Analysis', href: '/analysis', icon: TrendingUp },
];

interface SidebarProps {
  user: User | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onLogout?: () => void;
}

export default function Sidebar({
  user,
  collapsed = false,
  onToggleCollapse,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();

  const roleBadgeColor: Record<string, string> = {
    student: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    teacher: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    admin: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full',
        'bg-white/[0.03] backdrop-blur-xl border-r border-white/[0.06]',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/[0.06]">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2.5 overflow-hidden transition-all duration-300',
            collapsed && 'justify-center'
          )}
        >
          <GraduationCap className="h-7 w-7 text-teal-400 shrink-0" />
          {!collapsed && (
            <span className="text-lg font-semibold text-white tracking-tight whitespace-nowrap">
              AcademicSync
            </span>
          )}
        </Link>
        {onToggleCollapse && !collapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                'transition-all duration-200 ease-out',
                isActive
                  ? 'bg-teal-500/15 text-teal-300 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.2)]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0 transition-transform duration-200',
                  !isActive && 'group-hover:scale-110'
                )}
              />
              {!collapsed && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.6)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      {user && (
        <div className="border-t border-white/[0.06] p-3 space-y-2">
          <div
            className={cn(
              'flex items-center gap-3 px-2 py-2 rounded-lg',
              collapsed && 'justify-center px-0'
            )}
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {user.full_name
                  ? user.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : user.email[0].toUpperCase()}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">
                  {user.full_name || user.email}
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] px-1.5 py-0 h-4 capitalize',
                    roleBadgeColor[user.role] || 'border-white/20 text-white/50'
                  )}
                >
                  {user.role}
                </Badge>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'sm'}
            onClick={onLogout}
            className={cn(
              'w-full text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors',
              collapsed ? 'h-9 w-9 mx-auto' : 'justify-start gap-2'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Log out</span>}
          </Button>
        </div>
      )}
    </aside>
  );
}
