import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import { authService } from '../../../services/authService';

const WorkspaceSwitcher: React.FC = () => {
	const user = authService.getCurrentUser();
	const navigate = useNavigate();

	if (!user) {
		navigate('/');
		return null;
	}

	// Se já selecionou um ativo, ou se só tem um, tenta redirecionar para fora daqui
	React.useEffect(() => {
		if (user?.activeWorkspaceId) {
			navigate('/app/dashboard');
		} else if (user?.workspaces?.length === 1) {
			const selected = authService.applyActiveWorkspace(
				user,
				user.workspaces[0].companyId,
			);
			const isSession = !!sessionStorage.getItem('obralog_user');
			const storage = isSession ? sessionStorage : localStorage;
			storage.setItem('obralog_user', JSON.stringify(selected));
			navigate('/app/dashboard');
		}
	}, [user, navigate]);

	const handleSelectWorkspace = (companyId: string) => {
		authService.switchWorkspace(companyId);
	};

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<h2 className="mt-6 text-center text-3xl font-extrabold text-brand-primary">
					Olá, {user.name?.split(' ')[0] || 'Usuário'}
				</h2>
				<p className="mt-2 text-center text-sm text-gray-600">
					Selecione a operação (empresa) que deseja acessar agora.
				</p>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					<div className="space-y-4">
						{user.workspaces?.length > 0 ? (
							user.workspaces.map((ws) => (
								<button
									key={ws.companyId}
									onClick={() =>
										handleSelectWorkspace(ws.companyId)
									}
									className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-brand-primary hover:bg-brand-primary/5 transition-colors group"
								>
									<div className="flex items-center gap-4">
										<div className="p-2 bg-gray-100 rounded-md group-hover:bg-white transition-colors">
											<Building2 className="w-6 h-6 text-gray-600 group-hover:text-brand-primary" />
										</div>
										<div className="text-left">
											<p className="font-medium text-gray-900">
												{ws.companyName}
											</p>
											<p className="text-sm text-gray-500 capitalize">
												{ws.role}
											</p>
										</div>
									</div>
									<ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
								</button>
							))
						) : (
							<div className="text-center py-6">
								<p className="text-gray-500">
									Você ainda não possui acesso a nenhuma
									empresa.
								</p>
								<button
									onClick={() => authService.logout()}
									className="mt-4 text-brand-primary hover:text-brand-primary/80 font-medium"
								>
									Voltar para o Login
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default WorkspaceSwitcher;
