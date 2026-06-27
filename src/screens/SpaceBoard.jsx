import React, { Suspense, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Image, Billboard, Line, Html, useTexture } from '@react-three/drei';
import '../styles/space.css';

// Space Mode — the flagship 3D "constellation" board.
// Current film at center (rounded-rect), target glowing in the distance, cast as
// round face-bubbles you tap to travel. Strings connect them. Falls back to
// Classic on devices without WebGL.
// NOTE: the "walking" motion model + dynamic-gradient compass land in the next pass.

const POSTER_W = 'https://image.tmdb.org/t/p/w342';
const PROFILE_W = 'https://image.tmdb.org/t/p/w185';
const MAX_BUBBLES = 5; // mobile-portrait fit; paging/scroll for the rest comes with the walk model

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

function Float({ children, position = [0, 0, 0], speed = 1, amp = 0.06, phase = 0 }) {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(s.clock.elapsedTime * speed + phase) * amp;
  });
  return <group ref={ref} position={position}>{children}</group>;
}

// Rounded-rectangle movie poster.
function MovieCard({ url, scale = [1.6, 2.4], opacity = 1 }) {
  if (!url) {
    return (
      <mesh>
        <planeGeometry args={scale} />
        <meshBasicMaterial color="#15151c" transparent opacity={opacity} />
      </mesh>
    );
  }
  return <Image url={url} scale={scale} radius={0.1} transparent opacity={opacity} />;
}

// Round, face-centered headshot: crop a square from the TOP of the portrait
// (where faces sit) and mask it to a circle, with a faint rim for separation.
function RoundHead({ url, radius = 0.34 }) {
  const tex = useTexture(url);
  useMemo(() => {
    const img = tex.image;
    const aspect = img && img.height ? img.width / img.height : 0.667;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.center.set(0, 0);
    tex.repeat.set(1, aspect);
    tex.offset.set(0, Math.max(0, 1 - aspect - 0.04));
    tex.needsUpdate = true;
  }, [tex]);
  return (
    <group>
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[radius * 1.1, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.22} />
      </mesh>
      <mesh>
        <circleGeometry args={[radius, 48]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

function InitialsHead({ label, radius = 0.34 }) {
  return (
    <group>
      <mesh>
        <circleGeometry args={[radius, 48]} />
        <meshBasicMaterial color="#26262f" />
      </mesh>
      <Html center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div className="space-bubble-initials">{(label || '?').slice(0, 1)}</div>
      </Html>
    </group>
  );
}

function Bubble({ item, kind, position, onPick }) {
  const [hovered, setHovered] = useState(false);
  const isActor = kind === 'actors';
  const url = isActor
    ? (item.profile_path ? PROFILE_W + item.profile_path : null)
    : (item.poster_path ? POSTER_W + item.poster_path : null);
  const label = isActor ? item.name : item.title;
  const labelY = isActor ? -0.56 : -0.78;

  return (
    <Float position={position} speed={1.1} amp={0.05} phase={position[0] * 2}>
      <Billboard>
        <group
          scale={hovered ? 1.12 : 1}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
          onClick={(e) => { e.stopPropagation(); onPick(item); }}
        >
          {isActor ? (
            url ? <RoundHead url={url} /> : <InitialsHead label={label} />
          ) : (
            <MovieCard url={url} scale={[0.72, 1.08]} />
          )}
          <Html center position={[0, labelY, 0]} distanceFactor={9} occlude={false} style={{ pointerEvents: 'none' }}>
            <div className="space-bubble-label">{label}</div>
          </Html>
        </group>
      </Billboard>
    </Float>
  );
}

// Candidates fan out just below the current film. Consistent angular spacing,
// centered regardless of count (so 2 items sit near center, not at the edges).
function arcPositions(n, radius = 1.7, y = -1.7) {
  const step = (Math.PI * 0.6) / 4;
  return Array.from({ length: n }, (_, i) => {
    const a = (i - (n - 1) / 2) * step;
    return [Math.sin(a) * radius, y, Math.cos(a) * 0.5 - 0.3];
  });
}

function CameraRig() {
  useFrame((s) => {
    s.camera.position.x = Math.sin(s.clock.elapsedTime * 0.08) * 0.6;
    s.camera.position.y = 0.2 + Math.sin(s.clock.elapsedTime * 0.1) * 0.15;
    s.camera.lookAt(0, 0.4, 0);
  });
  return null;
}

function Scene({ currentMovie, targetMovie, items, kind, onPickActor, onPickFilm }) {
  const positions = useMemo(() => arcPositions(items.length), [items.length]);
  const anchor = [0, -0.45, 0]; // bottom of the current movie card
  return (
    <>
      <color attach="background" args={['#05060a']} />
      <ambientLight intensity={1.5} />
      <Stars radius={90} depth={50} count={1800} factor={3} saturation={0} fade speed={0.4} />

      <Float position={[0, 0.75, 0]} speed={0.7} amp={0.1}>
        <MovieCard url={currentMovie?.poster_path ? POSTER_W + currentMovie.poster_path : null} scale={[1.6, 2.4]} />
      </Float>

      <Float position={[0, 3.0, -4]} speed={0.5} amp={0.08}>
        <MovieCard url={targetMovie?.poster_path ? POSTER_W + targetMovie.poster_path : null} scale={[0.95, 1.42]} opacity={0.5} />
      </Float>

      {items.map((it, i) => (
        <group key={it.id ?? i}>
          <Line points={[anchor, positions[i]]} color="#ffffff" lineWidth={0.8} transparent opacity={0.2} />
          <Bubble item={it} kind={kind} position={positions[i]} onPick={kind === 'actors' ? onPickActor : onPickFilm} />
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
  const all = showFilms ? filmography : (cast || []);
  const items = all.slice(0, MAX_BUBBLES);
  const more = Math.max(0, all.length - items.length);
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
      <Canvas camera={{ position: [0, 0.2, 6], fov: 62 }} dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
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
              <button className="space-back-btn" onClick={() => gameDispatch({ type: 'DESELECT_ACTOR' })}>← back</button>
            </>
          ) : (
            <span>{actorLoading ? 'Travelling…' : 'Tap an actor to travel'}{more > 0 ? ` · +${more} more` : ''}</span>
          )}
        </div>
        <div className="space-hud-moves"><b>{movesRemaining}</b> moves left</div>
      </div>
    </div>
  );
}
