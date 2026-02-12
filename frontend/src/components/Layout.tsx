import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Users,
  Phone,
  Mail,
  BarChart3,
  Bell,
  Settings,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Calls', href: '/calls', icon: Phone },
  { name: 'Outreach', href: '/outreach', icon: Mail },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-primary-950 transform transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-primary-800">
          <div className="flex items-center justify-center w-8 h-8 bg-primary-500 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">GameTime AI</h1>
            <p className="text-xs text-primary-300">HawkRidge Systems</p>
          </div>
          <button
            className="ml-auto lg:hidden text-primary-300 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href ||
              (item.href !== '/' && router.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-800 text-white'
                    : 'text-primary-200 hover:bg-primary-900 hover:text-white'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">AJ</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Alex Johnson</p>
              <p className="text-xs text-primary-400">SDR</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <button
              className="lg:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 px-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {navigation.find((n) =>
                  n.href === '/'
                    ? router.pathname === '/'
                    : router.pathname.startsWith(n.href)
                )?.name || 'GameTime AI'}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
