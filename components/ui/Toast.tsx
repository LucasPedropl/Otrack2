import React, { useEffect, useState, useRef } from 'react';
import type { ToastMessage } from '../../contexts/ToastContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
	toast: ToastMessage;
	onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
	const [progress, setProgress] = useState(0);
	const [isHovered, setIsHovered] = useState(false);
	const duration = toast.duration || 4000;
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const startTimeRef = useRef<number>(Date.now());
	const remainingTimeRef = useRef<number>(duration);

	const startTimer = () => {
		const updateInterval = 10; // Update every 10ms for smooth progress
		startTimeRef.current = Date.now();

		intervalRef.current = setInterval(() => {
			const elapsed = Date.now() - startTimeRef.current;
			const newProgress =
				((duration - remainingTimeRef.current + elapsed) / duration) *
				100;

			if (newProgress >= 100) {
				clearInterval(intervalRef.current!);
				setProgress(100);
				setTimeout(onClose, 150); // slight delay to show 100%
			} else {
				setProgress(newProgress);
			}
		}, updateInterval);
	};

	const pauseTimer = () => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			remainingTimeRef.current -= Date.now() - startTimeRef.current;
		}
	};

	useEffect(() => {
		if (!isHovered) {
			startTimer();
		} else {
			pauseTimer();
		}
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [isHovered]);

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		onClose();
	};

	const getColors = () => {
		switch (toast.type) {
			case 'success':
				return {
					bg: 'bg-green-50',
					border: 'border-green-200',
					text: 'text-green-800',
					bar: 'bg-green-500',
					icon: (
						<CheckCircle
							className="text-green-500 shrink-0"
							size={20}
						/>
					),
				};
			case 'error':
				return {
					bg: 'bg-red-50',
					border: 'border-red-200',
					text: 'text-red-800',
					bar: 'bg-red-500',
					icon: (
						<AlertCircle
							className="text-red-500 shrink-0"
							size={20}
						/>
					),
				};
			default:
				return {
					bg: 'bg-blue-50',
					border: 'border-blue-200',
					text: 'text-blue-800',
					bar: 'bg-blue-500',
					icon: <Info className="text-blue-500 shrink-0" size={20} />,
				};
		}
	};

	const colors = getColors();

	return (
		<div
			className={`relative flex items-center p-4 pr-8 rounded-lg shadow-lg border ${colors.bg} ${colors.border} animate-in slide-in-from-right fade-in duration-300 w-80 group overflow-hidden cursor-default`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onContextMenu={handleContextMenu}
		>
			<div className="flex items-center gap-3">
				{colors.icon}
				<p className={`text-sm font-medium ${colors.text}`}>
					{toast.message}
				</p>
			</div>

			{/* Progress Bar Background */}
			<div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5" />
			{/* Progress Bar Fill */}
			<div
				className={`absolute bottom-0 left-0 h-1 transition-all ease-linear ${colors.bar}`}
				style={{ width: `${100 - progress}%` }}
			/>

			{/* Close Button X (shows on hover) */}
			<button
				onClick={onClose}
				className="absolute top-1/2 -translate-y-1/2 right-2 p-1 text-gray-400 hover:text-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
			>
				<X size={16} />
			</button>
		</div>
	);
};
