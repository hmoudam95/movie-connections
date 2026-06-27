import React, { Suspense, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Image, Billboard, Line, Html } from '@react-three/drei';
import '../styles/space.css';

// Space Mode — the flagship 3D "constellation" board.
// Current film sits at center; the target glows in the distance; the cast (or a
// selected actor's films) float as bubbles you tap to travel. Strings connect
// them (compass coloring lands in the next pass). Falls back to Classic on
// devices without WebGL.

const POSTER_W = 'https://image.tmdb.org/t/p/w342';
const PROFILE_W = 'https://image.tmdb.org/t/p/w185';
const MAX_BUBBLES = 12;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

// Gentle idle bob so everything feels alive without a running physics sim.
function Float({ children, position = [0, 0, 0], speed = 1, amp = 0.08, phase = 0 }) {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(s.clock.elapsedTime * speed + phase) * amp;
  });
  return <group ref={ref} position={position}>{children}</group>;
}

function PosterCard({ url, scale = [2.2, 3.3], opacity = 1 }) {
  if (!url) {
    return (
      <mesh>
        <planeGeometry args={scale} />
        <meshBasicMaterial color="#15151c" transparent opacity={opacity} />
      </mesh>
    );
  }
  return <Image url={url} scale={scale} transparent opacity={opacity} />;
}

function Bubble({ item, kind, position, onPick }) {
  const [hovered, setHovered] = useState(false);
  const url = kind === 'actors'
    ? (item.profile_path ? PROFILE_W + item.profile_path : null)
    : (item.poster_path ? POSTER_W + item.poster_path : null);
  const label = kind === 'actors' ? item.name : item.title;
  const scale = kind === 'actors' ? [1.15, 1.15] : [1.2, 1.8];

  return (
    <Float position={position} speed={1.2} amp={0.06} phase={position[0]}>
      <Billboard>
        <group
          scale={hovered ? 1.12 : 1}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
          onClick={(e) => { e.stopPropagation(); onPick(item); }}
        >
          {url ? (
            <Image url={url} scale={scale} transparent />
          ) : (
            <mesh>
              <circleGeometry args={[0.6, 40]} />
              <meshBasicMaterial color="#2a2a33" />
            </mesh>
          )}
          <Html center position={[0, -(scale[1] / 2) - 0.32, 0]} distanceFactor={9} occlude={false} style={{ pointerEvents: 'none' }}>
            <div className="space-bubble-label">{label}</div>
          </Html>
        </group>
      </Billboard>
    </Float>
  );
}

// Lay candidates out in a gentle forward arc beneath the current film.
function arcPositions(n, radius = 4.6, y = -2.1, spread = Math.PI * 0.95) {
  return Array.from({ length: n }, (_, i) => {
    const t = n <= 1 ? 0.5 : i / (n - 1);
    const a = -spread / 2 + t * spread;
    return [Math.sin(a) * radius, y, Math.cos(a) * radius - radius * 0.7];
  });
}

function CameraRig() {
  useFrame((s) => {
    s.camera.position.x = Math.sin(s.clock.elapsedTime * 0.1) * 1.1;
    s.camera.position.y = 0.6 + Math.sin(s.clock.elapsedTime * 0.13) * 0.25;
    s.camera.lookAt(0, 0.3, 0);
  });
  return null;
}

function Scene({ currentMovie, targetMovie, items, kind, onPickActor, onPickFilm }) {
  const positions = useMemo(() => arcPositions(items.length), [items.length]);
  return (
    <>
      <color attach="background" args={['#05060a']} />
      <ambientLight intensity={1.4} />
      <Stars radius={90} depth={50} count={2000} factor={3.2} saturation={0} fade speed={0.5} />

      <Float position={[0, 0.5, 0]} speed={0.8} amp={0.12}>
        <PosterCard url={currentMovie?.poster_path ? POSTER_W + currentMovie.poster_path : null} scale={[2.4, 3.6]} />
      </Float>

      <Float position={[0, 3.6, -5.5]} speed={0.6} amp={0.1}>
        <PosterCard url={targetMovie?.poster_path ? POSTER_W + targetMovie.poster_path : null} scale={[1.7, 2.55]} opacity={0.5} />
      </Float>

      {items.map((it, i) => (
        <group key={it.id ?? i}>
          <Line points={[[0, -1.3, 0], positions[i]]} color="#ffffff" lineWidth={1} transparent opacity={0.22} />
          <Bubble
            item={it}
            kind={kind}
            position={positions[i]}
            onPick={kind === 'actors' ? onPickActor : onPickFilm}
          />
        </group>
      ))}
    </>
  );
}

export default function SpaceBoard({
  currentMovie, targetMovie, cast, selectedActor, filmography,
  movesRemaining, actorLoading, handleActorSelect, handleFilmographySelect,
  gameDispatch, onSwitchToClassic,
}) {
  const webgl = useMemo(hasWebGL, []);
  const showFilms = !!selectedActor && filmography.length > 0;
  const items = (showFilms ? filmography : (cast || [])).slice(0, MAX_BUBBLES);
  const kind = showFilms ? 'films' : 'actors';

  if (!webgl) {
    return (
      <div className="space-fallback">
        <p>Your device doesn’t support 3D Space mode.</p>
        <button className="space-classic-btn" onClick={onSwitchToClassic}>Use Classic mode →</button>
      </div>
    );
  }

  return (
    <div className="space-board">
      <Canvas camera={{ position: [0, 0.6, 8], fov: 55 }} dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <Suspense fallback={null}>
          <CameraRig />
          <Scene
            currentMovie={currentMovie}
            targetMovie={targetMovie}
            items={items}
            kind={kind}
            onPickActor={handleActorSelect}
            onPickFilm={handleFilmographySelect}
          />
        </Suspense>
      </Canvas>

      <div className="space-hud" aria-live="polite">
        <div className="space-hud-top">
          <div className="space-hud-pair">
            <span className="space-hud-cur">{currentMovie?.title}</span>
            <span className="space-hud-arrow">→</span>
            <span className="space-hud-target">{targetMovie?.title}</span>
          </div>
          <button className="space-classic-btn" onClick={onSwitchToClassic}>Classic</button>
        </div>
        <div className="space-hud-prompt">
          {showFilms ? (
            <>
              <span>Pick a film from <b>{selectedActor.name}</b></span>
              <button className="space-back-btn" onClick={() => gameDispatch({ type: 'DESELECT_ACTOR' })}>← back to cast</button>
            </>
          ) : (
            <span>{actorLoading ? 'Travelling…' : 'Tap an actor to travel'}</span>
          )}
        </div>
        <div className="space-hud-moves"><b>{movesRemaining}</b> moves left</div>
      </div>
    </div>
  );
}
