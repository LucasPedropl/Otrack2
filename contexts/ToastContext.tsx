import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Toast } from '../components/ui/Toast';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
}

interface ToastContextData {
	addToast: (type: ToastType, message: string, duration?: number) => void;
	success: (message: string, duration?: number) => void;
	error: (message: string, duration?: number) => void;
	info: (message: string, duration?: number) => void;
	removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextData | undefined>(undefined);

let toastIdCounter = 0;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [toasts, setToasts] = useState<ToastMessage[]>([]);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const addToast = useCallback(
		(type: ToastType, message: string, duration = 4000) => {
			const id = `toast_${++toastIdCounter}`;
			setToasts((prev) => [...prev, { id, type, message, duration }]);
		},
		[],
	);

	const success = useCallback(
		(message: string, duration?: number) =>
			addToast('success', message, duration),
		[addToast],
	);
	const error = useCallback(
		(message: string, duration?: number) =>
			addToast('error', message, duration),
		[addToast],
	);
	const info = useCallback(
		(message: string, duration?: number) =>
			addToast('info', message, duration),
		[addToast],
	);

	return (
		<ToastContext.Provider
			value={{ addToast, success, error, info, removeToast }}
		>
			{children}
			<div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
				{toasts.map((t) => (
					<Toast
						key={t.id}
						toast={t}
						onClose={() => removeToast(t.id)}
					/>
				))}
			</div>
		</ToastContext.Provider>
	);
};

export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within a ToastProvider');
	}
	return context;
};
