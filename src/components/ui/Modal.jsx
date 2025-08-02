import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={closeOnOverlayClick ? onClose : () => {}}
        {...props}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={clsx(
                  'w-full transform overflow-hidden rounded-2xl bg-gradient-to-br from-dark-800 to-dark-700 border border-primary-500/30 p-6 text-left align-middle shadow-xl transition-all',
                  sizes[size],
                  className
                )}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      {title && (
                        <Dialog.Title
                          as="h3"
                          className="text-xl font-bold text-gradient"
                        >
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description
                          as="p"
                          className="mt-2 text-sm text-dark-300"
                        >
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="ml-4 p-2 rounded-lg bg-dark-600/50 hover:bg-dark-500/50 text-dark-300 hover:text-white transition-colors duration-200 group"
                      >
                        <XMarkIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="relative">
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-pulse" />
                  
                  <div className="relative z-10">
                    {children}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Modal Header Component
const ModalHeader = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('mb-4', className)}
      {...props}
    >
      {children}
    </div>
  );
});

ModalHeader.displayName = 'ModalHeader';

// Modal Content Component
const ModalContent = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('', className)}
      {...props}
    >
      {children}
    </div>
  );
});

ModalContent.displayName = 'ModalContent';

// Modal Footer Component
const ModalFooter = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('flex justify-end gap-3 mt-6', className)}
      {...props}
    >
      {children}
    </div>
  );
});

ModalFooter.displayName = 'ModalFooter';

// Game Result Modal Component
const GameResultModal = ({
  isOpen,
  onClose,
  onPlayAgain,
  steps,
  chain,
  isWin = true,
  ...props
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isWin ? "🎉 You've reached the target!" : "🎯 Keep trying!"}
      description={isWin ? `Completed in ${steps} steps` : "Try to find a shorter path"}
      size="lg"
      {...props}
    >
      <ModalContent>
        <div className="space-y-4">
          {/* Result Stats */}
          <div className="flex justify-center items-center space-x-8 py-4">
            <div className="text-center">
              <div className="step-counter">{steps}</div>
              <div className="text-sm text-dark-300">Steps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-cyan">🎬</div>
              <div className="text-sm text-dark-300">Movies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-pink">👤</div>
              <div className="text-sm text-dark-300">Actors</div>
            </div>
          </div>

          {/* Movie Chain */}
          {chain && chain.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-white">Your Path:</h4>
              <div className="space-y-2">
                {chain.map((item, index) => (
                  <div key={index} className="chain-item">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="movie-title">{item.movie?.title}</div>
                        {item.actor && (
                          <div className="actor-name text-sm">via {item.actor.name}</div>
                        )}
                      </div>
                    </div>
                    {index < chain.length - 1 && (
                      <div className="chain-arrow">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ModalContent>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {isWin && (
          <Button onClick={onPlayAgain}>
            Play Again
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

GameResultModal.displayName = 'GameResultModal';

Modal.Header = ModalHeader;
Modal.Content = ModalContent;
Modal.Footer = ModalFooter;
Modal.GameResult = GameResultModal;

export default Modal; 