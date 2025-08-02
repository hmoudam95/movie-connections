import React, { useState } from 'react';
import {
  Button,
  Card,
  Modal,
  ToastProvider,
  useToast,
  GameToast,
  PlayIcon,
  StarIcon,
  TrophyIcon,
  SparklesIcon,
  FilmIcon,
  UserIcon,
  HomeIcon,
  CogIcon,
  SunIcon,
  MoonIcon,
} from './index';

const DesignSystemDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { success, error, warning, info } = useToast();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <ToastProvider>
      <div className={`min-h-screen p-8 transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gradient mb-4">
              Movie Connections Design System
            </h1>
            <p className="text-dark-300 text-lg">
              A complete UI component library with movie game aesthetics
            </p>
          </div>

          {/* Theme Toggle */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={toggleDarkMode}
              icon={isDarkMode ? SunIcon : MoonIcon}
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>

          {/* Buttons Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Buttons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="primary" icon={PlayIcon}>
                Primary
              </Button>
              <Button variant="secondary" icon={StarIcon}>
                Secondary
              </Button>
              <Button variant="accent" icon={SparklesIcon}>
                Accent
              </Button>
              <Button variant="outline" icon={TrophyIcon}>
                Outline
              </Button>
              <Button variant="ghost" icon={FilmIcon}>
                Ghost
              </Button>
              <Button variant="danger" icon={UserIcon}>
                Danger
              </Button>
              <Button variant="success" icon={HomeIcon}>
                Success
              </Button>
              <Button variant="warning" icon={CogIcon}>
                Warning
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button size="sm" variant="primary">
                Small
              </Button>
              <Button size="md" variant="primary">
                Medium
              </Button>
              <Button size="lg" variant="primary">
                Large
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button loading variant="primary">
                Loading
              </Button>
              <Button disabled variant="primary">
                Disabled
              </Button>
            </div>
          </section>

          {/* Cards Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Movie Card */}
              <Card.Movie
                poster="https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg"
                title="The Dark Knight"
                year="2008"
                rating="9.0"
                onClick={() => success('Movie card clicked!')}
              >
                <Card.Footer>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </Card.Footer>
              </Card.Movie>

              {/* Actor Card */}
              <Card.Actor
                photo="https://image.tmdb.org/t/p/w500/4SYTH5FdB0dAORV98Nwg3llgVnY.jpg"
                name="Christian Bale"
                character="Bruce Wayne"
                onClick={() => success('Actor card clicked!')}
              />

              {/* Regular Card */}
              <Card variant="glass" shimmer>
                <Card.Header>
                  <Card.Title>Glass Card</Card.Title>
                  <Card.Description>
                    A beautiful glass morphism card with shimmer effect
                  </Card.Description>
                </Card.Header>
                <Card.Content>
                  <p className="text-dark-300">
                    This card demonstrates the glass morphism effect with a subtle shimmer animation.
                  </p>
                </Card.Content>
                <Card.Footer>
                  <Button size="sm" variant="primary">
                    Action
                  </Button>
                </Card.Footer>
              </Card>
            </div>
          </section>

          {/* Toast Demo */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Toast Notifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="success"
                onClick={() => success('Success message!', { description: 'This is a success toast' })}
              >
                Success Toast
              </Button>
              <Button
                variant="danger"
                onClick={() => error('Error message!', { description: 'This is an error toast' })}
              >
                Error Toast
              </Button>
              <Button
                variant="warning"
                onClick={() => warning('Warning message!', { description: 'This is a warning toast' })}
              >
                Warning Toast
              </Button>
              <Button
                variant="secondary"
                onClick={() => info('Info message!', { description: 'This is an info toast' })}
              >
                Info Toast
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                variant="primary"
                onClick={() => {
                  const toast = GameToast.connectionFound(3);
                  success(toast.message, { description: toast.description });
                }}
              >
                Game Success
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const toast = GameToast.movieAlreadyInChain();
                  warning(toast.message, { description: toast.description });
                }}
              >
                Game Warning
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  const toast = GameToast.hintAvailable();
                  info(toast.message, { description: toast.description });
                }}
              >
                Game Info
              </Button>
            </div>
          </section>

          {/* Modal Demo */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Modals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="primary"
                onClick={() => setIsModalOpen(true)}
              >
                Open Modal
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const toast = GameToast.connectionFound(5);
                  success(toast.message, { description: toast.description });
                }}
              >
                Show Game Result
              </Button>
            </div>

            {/* Demo Modal */}
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Design System Demo"
              description="This is a demo modal showcasing the design system"
              size="lg"
            >
              <Modal.Content>
                <div className="space-y-4">
                  <p className="text-dark-300">
                    This modal demonstrates the beautiful design system with:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-dark-300">
                    <li>Dark theme with neon accents</li>
                    <li>Smooth animations and transitions</li>
                    <li>Glass morphism effects</li>
                    <li>Responsive design</li>
                    <li>Accessibility features</li>
                  </ul>
                </div>
              </Modal.Content>
              <Modal.Footer>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsModalOpen(false);
                  success('Modal action completed!');
                }}>
                  Confirm
                </Button>
              </Modal.Footer>
            </Modal>
          </section>

          {/* Features Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card variant="primary" glow>
                <Card.Content>
                  <div className="text-center">
                    <SparklesIcon className="w-12 h-12 text-primary-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Neon Effects</h3>
                    <p className="text-dark-300">
                      Beautiful neon glow effects and animations
                    </p>
                  </div>
                </Card.Content>
              </Card>

              <Card variant="secondary" shimmer>
                <Card.Content>
                  <div className="text-center">
                    <FilmIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Movie Theme</h3>
                    <p className="text-dark-300">
                      Designed specifically for movie games
                    </p>
                  </div>
                </Card.Content>
              </Card>

              <Card variant="accent">
                <Card.Content>
                  <div className="text-center">
                    <TrophyIcon className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Responsive</h3>
                    <p className="text-dark-300">
                      Mobile-first design with perfect scaling
                    </p>
                  </div>
                </Card.Content>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </ToastProvider>
  );
};

export default DesignSystemDemo; 