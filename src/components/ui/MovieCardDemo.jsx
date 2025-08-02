import React from 'react';
import MovieCard from './MovieCard';

const MovieCardDemo = () => {
    // Sample movie data
    const sampleMovies = [
        {
            id: 1,
            title: "The Dark Knight",
            poster_path: "/1E5baAaEse26fej7uHcjOgEE2t2.jpg",
            release_date: "2008-07-18",
            vote_average: 9.0,
            genre_ids: [28, 80, 18],
            variant: "thriller"
        },
        {
            id: 2,
            title: "Inception",
            poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
            release_date: "2010-07-16",
            vote_average: 8.8,
            genre_ids: [28, 878, 12],
            variant: "action"
        },
        {
            id: 3,
            title: "The Grand Budapest Hotel",
            poster_path: "/eWdyYQreja6LF6Q6hRCrFKGqLEm.jpg",
            release_date: "2014-03-07",
            vote_average: 8.1,
            genre_ids: [35, 18, 14],
            variant: "comedy"
        },
        {
            id: 4,
            title: "The Shining",
            poster_path: "/9fgh3Ns1CfvqkqXh8j8qZqZqZqZ.jpg",
            release_date: "1980-05-23",
            vote_average: 8.4,
            genre_ids: [27, 53],
            variant: "horror"
        },
        {
            id: 5,
            title: "Pulp Fiction",
            poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
            release_date: "1994-10-14",
            vote_average: 8.9,
            genre_ids: [80, 53],
            variant: "action"
        },
        {
            id: 6,
            title: "The Matrix",
            poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
            release_date: "1999-03-31",
            vote_average: 8.7,
            genre_ids: [28, 878],
            variant: "thriller"
        }
    ];

    const handleMovieClick = (movie) => {
        console.log('Movie clicked:', movie.title);
    };

    return (
        <div className="min-h-screen p-8 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gradient mb-4">
                        Netflix-Style Movie Cards
                    </h1>
                    <p className="text-dark-300 text-lg">
                        Cinematic 3D hover effects with Framer Motion
                    </p>
                </div>

                {/* Movie Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {sampleMovies.map((movie) => (
                        <div key={movie.id} className="h-96">
                            <MovieCard
                                movie={movie}
                                variant={movie.variant}
                                onClick={() => handleMovieClick(movie)}
                                className="h-full"
                                showActions={true}
                                showRating={true}
                                showYear={true}
                            />
                        </div>
                    ))}
                </div>

                {/* Features Showcase */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center p-6 bg-glass rounded-2xl">
                        <div className="text-3xl mb-4">🎬</div>
                        <h3 className="text-xl font-bold text-white mb-2">3D Hover Effects</h3>
                        <p className="text-dark-300">
                            Realistic 3D rotation and perspective transforms
                        </p>
                    </div>

                    <div className="text-center p-6 bg-glass rounded-2xl">
                        <div className="text-3xl mb-4">✨</div>
                        <h3 className="text-xl font-bold text-white mb-2">Dynamic Glow</h3>
                        <p className="text-dark-300">
                            Interactive glow effects that follow your mouse
                        </p>
                    </div>

                    <div className="text-center p-6 bg-glass rounded-2xl">
                        <div className="text-3xl mb-4">🎭</div>
                        <h3 className="text-xl font-bold text-white mb-2">Cinematic Styling</h3>
                        <p className="text-dark-300">
                            Netflix-inspired design with gradient overlays
                        </p>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-12 p-6 bg-glass rounded-2xl">
                    <h3 className="text-xl font-bold text-white mb-4">How to Use</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-dark-300">
                        <div>
                            <h4 className="font-semibold text-white mb-2">Hover Effects:</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• Move mouse over cards for 3D rotation</li>
                                <li>• Watch the dynamic glow follow your cursor</li>
                                <li>• See floating particles appear</li>
                                <li>• Observe smooth scale and shadow animations</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-2">Interactive Elements:</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• Click heart icon to like/unlike</li>
                                <li>• Share button for social sharing</li>
                                <li>• Play button overlay on hover</li>
                                <li>• Details and Watch buttons</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieCardDemo; 