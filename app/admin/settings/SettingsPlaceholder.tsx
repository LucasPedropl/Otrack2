import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Settings } from 'lucide-react';

const SettingsPlaceholder: React.FC = () => {
	const { currentTheme } = useTheme();

	return (
		<div className="flex flex-col items-center justify-center p-8 h-full opacity-50 text-center">
			<Settings
				size={64}
				style={{ color: currentTheme.colors.textSecondary }}
			/>
			<h2
				className="mt-4 text-xl font-semibold"
				style={{ color: currentTheme.colors.text }}
			>
				Configurações do Sistema
			</h2>
			<p
				className="mt-2 max-w-sm"
				style={{ color: currentTheme.colors.textSecondary }}
			>
				Selecione uma opção no menu lateral para gerenciar.
			</p>
		</div>
	);
};

export default SettingsPlaceholder;
