import { useState, useEffect } from 'react';
import { Database, HardDrive, AlertCircle, RefreshCw } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function UsageStats() {
	const [stats, setStats] = useState({
		companiesCount: 0,
		totalUsers: 0,
		totalProjects: 0,
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadStats();
	}, []);

	const loadStats = async () => {
		setLoading(true);
		try {
			// Consultas básicas para ter uma estimativa do uso em documentos
			const companiesSnap = await getDocs(collection(db, 'companies'));
			const usersSnap = await getDocs(collection(db, 'users'));
			const projectsSnap = await getDocs(
				collection(db, 'construction_sites'),
			);

			setStats({
				companiesCount: companiesSnap.size,
				totalUsers: usersSnap.size,
				totalProjects: projectsSnap.size,
			});
		} catch (error) {
			console.error('Erro ao carregar estátisticas', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-6xl mx-auto py-8 px-4">
			<div className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 mb-2">
						Uso de Dados do Firebase
					</h1>
					<p className="text-gray-600">
						Visão geral do consumo do banco de dados e arquivos.
					</p>
				</div>
				<button
					onClick={loadStats}
					disabled={loading}
					className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
				>
					<RefreshCw
						size={18}
						className={loading ? 'animate-spin' : ''}
					/>
					Atualizar
				</button>
			</div>

			{/* Alerta de Limitação Técnica */}
			<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-8 flex gap-3">
				<AlertCircle className="text-yellow-600 shrink-0" />
				<div className="text-sm text-yellow-800">
					<p className="font-bold mb-1">
						Limitações de Leitura de Gigabytes
					</p>
					<p>
						O SDK Client do Firebase não fornece os dados exatos em{' '}
						<strong>GBs</strong> do Firestore e Storage por motivos
						de segurança. Para ver os Gigabytes exatos utilizados e
						o custo real, você deve acessar o{' '}
						<a
							href="https://console.firebase.google.com/"
							target="_blank"
							rel="noopener noreferrer"
							className="underline font-semibold hover:text-yellow-900"
						>
							Console do Firebase
						</a>{' '}
						na aba "Uso e Faturamento". Abaixo, apresentamos uma
						estimativa do volume através da quantidade de
						documentos.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
				{/* Storage / Arquivos */}
				<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
					<div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
						<HardDrive size={24} />
					</div>
					<div>
						<h3 className="text-gray-500 text-sm font-medium">
							Uso do Storage (Imagens e Anexos)
						</h3>
						<p className="text-2xl font-bold text-gray-900 mt-1">
							Ver Console
						</p>
						<p className="text-xs text-gray-400 mt-1">
							Requer Google Cloud API
						</p>
					</div>
				</div>

				{/* Empresas (Tenants) */}
				<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
					<div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
						<Database size={24} />
					</div>
					<div>
						<h3 className="text-gray-500 text-sm font-medium">
							Total de Empresas Cadastradas
						</h3>
						{loading ? (
							<p className="h-8 bg-gray-100 rounded w-16 mt-1 animate-pulse"></p>
						) : (
							<p className="text-2xl font-bold text-gray-900 mt-1">
								{stats.companiesCount}
							</p>
						)}
					</div>
				</div>

				{/* Documentos Gerais */}
				<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
					<div className="p-3 bg-green-100 text-green-600 rounded-lg">
						<Database size={24} />
					</div>
					<div>
						<h3 className="text-gray-500 text-sm font-medium">
							Soma Básica de Documentos
						</h3>
						{loading ? (
							<p className="h-8 bg-gray-100 rounded w-16 mt-1 animate-pulse"></p>
						) : (
							<div className="mt-1">
								<p className="text-2xl font-bold text-gray-900">
									{stats.totalUsers + stats.totalProjects}
								</p>
								<p className="text-xs text-gray-400 mt-1">
									Usuários: {stats.totalUsers} | Obras:{' '}
									{stats.totalProjects}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
