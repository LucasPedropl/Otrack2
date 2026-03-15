import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
	isOpen: boolean;
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel: () => void;
	confirmText?: string;
	cancelText?: string;
	isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
	isOpen,
	title,
	message,
	onConfirm,
	onCancel,
	confirmText = 'Confirmar',
	cancelText = 'Cancelar',
	isDestructive = true,
}) => {
	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
			onClick={onCancel}
		>
			<div
				className="w-full max-w-sm rounded-xl shadow-2xl border p-6 text-center animate-in zoom-in-95 duration-200 bg-white border-gray-200"
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onCancel}
					className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
				>
					<X size={20} className="text-gray-500" />
				</button>

				<div
					className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDestructive ? 'bg-red-100' : 'bg-blue-100'}`}
				>
					<AlertTriangle
						className={`h-6 w-6 ${isDestructive ? 'text-red-600' : 'text-blue-600'}`}
					/>
				</div>

				<h3 className="text-lg font-bold mb-2 text-gray-900">
					{title}
				</h3>
				<p className="text-sm mb-6 text-gray-600">{message}</p>

				<div className="flex gap-3 justify-center">
					<Button
						variant="secondary"
						onClick={onCancel}
						className="w-full"
					>
						{cancelText}
					</Button>
					<Button
						variant={isDestructive ? 'danger' : 'primary'}
						onClick={() => {
							onConfirm();
							onCancel();
						}}
						className="w-full"
					>
						{confirmText}
					</Button>
				</div>
			</div>
		</div>
	);
};
