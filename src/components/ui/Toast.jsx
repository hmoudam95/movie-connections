import React, { Fragment, useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

// Toast Context
const ToastContext = React.createContext();

// Toast Provider
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (toast) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { id, ...toast };
        setToasts(prev => [...prev, newToast]);

        // Auto remove after duration
        if (toast.duration !== 0) {
            setTimeout(() => {
                removeToast(id);
            }, toast.duration || 5000);
        }

        return id;
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const success = (message, options = {}) => {
        return addToast({ type: 'success', message, ...options });
    };

    const error = (message, options = {}) => {
        return addToast({ type: 'error', message, ...options });
    };

    const warning = (message, options = {}) => {
        return addToast({ type: 'warning', message, ...options });
    };

    const info = (message, options = {}) => {
        return addToast({ type: 'info', message, ...options });
    };

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

// Hook to use toast
export const useToast = () => {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Individual Toast Component
const Toast = ({ toast, onRemove }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleRemove = () => {
        setIsVisible(false);
        setTimeout(() => {
            onRemove(toast.id);
        }, 300);
    };

    const icons = {
        success: CheckCircleIcon,
        error: XCircleIcon,
        warning: ExclamationTriangleIcon,
        info: InformationCircleIcon,
    };

    const variants = {
        success: {
            icon: 'text-green-400',
            bg: 'bg-gradient-to-r from-green-900/90 to-emerald-900/90',
            border: 'border-green-500/30',
            glow: 'shadow-neon-green',
        },
        error: {
            icon: 'text-red-400',
            bg: 'bg-gradient-to-r from-red-900/90 to-pink-900/90',
            border: 'border-red-500/30',
            glow: 'shadow-neon-red',
        },
        warning: {
            icon: 'text-yellow-400',
            bg: 'bg-gradient-to-r from-yellow-900/90 to-orange-900/90',
            border: 'border-yellow-500/30',
            glow: 'shadow-neon-yellow',
        },
        info: {
            icon: 'text-cyan-400',
            bg: 'bg-gradient-to-r from-cyan-900/90 to-blue-900/90',
            border: 'border-cyan-500/30',
            glow: 'shadow-neon-cyan',
        },
    };

    const IconComponent = icons[toast.type];
    const variant = variants[toast.type];

    return (
        <Transition
            show={isVisible}
            as={Fragment}
            enter="transform ease-out duration-300 transition"
            enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            <div
                className={clsx(
                    'w-full max-w-sm bg-white/10 backdrop-blur-md rounded-xl border p-4 shadow-lg',
                    variant.bg,
                    variant.border,
                    variant.glow,
                    'relative overflow-hidden'
                )}
            >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />

                <div className="relative z-10 flex items-start">
                    <div className="flex-shrink-0">
                        <IconComponent
                            className={clsx('h-6 w-6', variant.icon)}
                            aria-hidden="true"
                        />
                    </div>

                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-white">
                            {toast.message}
                        </p>
                        {toast.description && (
                            <p className="mt-1 text-sm text-dark-300">
                                {toast.description}
                            </p>
                        )}
                    </div>

                    <div className="ml-4 flex flex-shrink-0">
                        <button
                            type="button"
                            className={clsx(
                                'inline-flex rounded-lg p-1.5 text-dark-300 hover:text-white',
                                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900',
                                'transition-colors duration-200'
                            )}
                            onClick={handleRemove}
                        >
                            <span className="sr-only">Close</span>
                            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    );
};

// Toast Container
const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-4">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    toast={toast}
                    onRemove={removeToast}
                />
            ))}
        </div>
    );
};

// Game-specific Toast Components
export const GameToast = {
    // Success toasts
    connectionFound: (steps) => ({
        type: 'success',
        message: 'Connection found!',
        description: `Path completed in ${steps} steps`,
        duration: 4000,
    }),

    movieAdded: (title) => ({
        type: 'success',
        message: 'Movie added to chain!',
        description: title,
        duration: 3000,
    }),

    actorSelected: (name) => ({
        type: 'success',
        message: 'Actor selected!',
        description: `Now choose a movie with ${name}`,
        duration: 3000,
    }),

    // Error toasts
    noConnection: () => ({
        type: 'error',
        message: 'No connection found',
        description: 'Try a different path or actor',
        duration: 4000,
    }),

    movieAlreadyInChain: () => ({
        type: 'warning',
        message: 'Movie already in chain',
        description: 'Choose a different movie',
        duration: 3000,
    }),

    apiError: (message) => ({
        type: 'error',
        message: 'API Error',
        description: message || 'Failed to fetch data',
        duration: 5000,
    }),

    // Info toasts
    hintAvailable: () => ({
        type: 'info',
        message: 'Hint available!',
        description: 'Click the hint button for help',
        duration: 3000,
    }),

    shortestPath: (steps) => ({
        type: 'info',
        message: 'Shortest path found',
        description: `Optimal solution: ${steps} steps`,
        duration: 4000,
    }),
};

// Default export
export default Toast; 