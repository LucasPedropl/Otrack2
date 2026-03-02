import React from 'react';
import { LayoutDashboard, Users, LogOut, Settings } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLayout() {
	const { logout } = useAuth();
	const isActive = (path: string) => {
		return location.pathname === path
			? 'bg-gray-800 text-white'
			: 'text-gray-400 hover:bg-gray-800 hover:text-white';
	};

	return (
		<div className="flex h-screen bg-gray-100 font-sans">
			{/* Sidebar */}
			<aside className="w-64 bg-gray-900 text-white flex flex-col">
				<div className="p-6">
					<h1 className="text-2xl font-bold tracking-wider">
						Super Admin
					</h1>
					<p className="text-xs text-gray-400 mt-1">
						Gestão de Instâncias
					</p>
				</div>

				<nav className="flex-1 px-4 space-y-2 mt-6">
					<Link
						to="/"
						className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/')}`}
					>
						<LayoutDashboard size={20} />
						<span className="font-medium">Dashboard</span>
					</Link>

					{/* Future sections */}
					<div className="pt-4 pb-2">
						<p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
							Sistema
						</p>
					</div>

					<button className="flex w-full items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
						<Settings size={20} />
						<span className="font-medium">Configurações</span>
					</button>
				</nav>

				<div className="p-4 border-t border-gray-800">
					<button
						onClick={logout}
						className="flex w-full items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-lg transition-colors"
					>
						<LogOut size={20} />
						<span className="font-medium">Sair</span>
					</button>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 overflow-auto">
				<header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
					<h2 className="text-xl font-semibold text-gray-800">
						Painel de Controle
					</h2>
				</header>
				<div className="p-8 max-w-7xl mx-auto">
					<Outlet />
				</div>
			</main>
		</div>
	);
}
