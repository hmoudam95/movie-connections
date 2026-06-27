import React, { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Image, Billboard, Line, Html, useTexture } from '@react-three/drei';
import { useDrag } from '@use-gesture/react';
import '../styles/space.css';

// Space Mode — the flagship 3D "constellation" board.
// The current film and target stay ANCHORED. The candidate list runs VERTICALLY
// (you scroll down through it). Horizontal movement is tiny (≈ half a face) — a
// parallax hint of a bigger walk. Drag to move, tap a node to travel. Side
// borders frame the lane. Falls back to Classic without WebGL.

const POSTER_W = 'https://image.tmdb.org/t/p/w342';
const PROFILE_W = 'https://image.tmdb.org/t/p/w185';
const SPACING_Y = 1.25;      // vertical gap between candidates
const HEAD_R = 0.36;
const PAN_X_LIMIT = HEAD_R;  // "half a face" of horizontal sway
const PAN_X_FACTOR = 0.005;  // very small horizontal response
const PAN_Y_FACTOR = 0.013;  // vertical scroll response
const COL_TOP = -0.2;        // y of the first candidate (just below current film)

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

function MovieCard({ url, scale = [1.3, 1.95], opacity = 1 }) {
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

// Round, face-centered headshot.
function RoundHead({ url, radius = HEAD_R }) {
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

function InitialsHead({ label, radius = HEAD_R }) {
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

  return (
    <group position={position}>
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
            <MovieCard url={url} scale={[0.62, 0.93]} />
          )}
          {/* label to the right — keeps the vertical list tight */}
          <Html position={[isActor ? 0.5 : 0.42, 0, 0]} distanceFactor={9} occlude={false} style={{ pointerEvents: 'none' }}>
            <div className="space-bubble-label space-bubble-label--right">{label}</div>
          </Html>
        </group>
      </Billboard>
    </group>
  );
}

// The vertical candidate column scrolls (player-driven). Anchored items live outside it.
function ScrollColumn({ items, kind, onPickActor, onPickFilm, pan }) {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, pan.ty, 0.16);
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, pan.tx, 0.16);
  });
  const n = items.length;
  const bottomY = COL_TOP - (n - 1) * SPACING_Y;
  return (
    <group ref={ref}>
      {/* spine: the path threading the list */}
      <Line points={[[0, COL_TOP + 0.55, -0.06], [0, bottomY - 0.3, -0.06]]} color="#ffffff" lineWidth={0.7} transparent opacity={0.14} />
      {items.map((it, i) => (
        <Bubble
          key={it.id ?? i}
          item={it}
          kind={kind}
          position={[0, COL_TOP - i * SPACING_Y, 0]}
          onPick={kind === 'actors' ? onPickActor : onPickFilm}
        />
      ))}
    </group>
  );
}

function Scene({ currentMovie, targetMovie, items, kind, onPickActor, onPickFilm, pan }) {
  return (
    <>
      <color attach="background" args={['#05060a']} />
      <ambientLight intensity={1.5} />
      <Stars radius={90} depth={50} count={1600} factor={3} saturation={0} fade speed={0.2} />

      {/* anchored: target (top, dim, the goal) + current film below it.
          Pulled forward in z so the scrolling cast pass BEHIND them. */}
      <group position={[0, 3.0, 0.5]}>
        <MovieCard url={targetMovie?.poster_path ? POSTER_W + targetMovie.poster_path : null} scale={[0.5, 0.75]} opacity={0.55} />
      </group>
      <group position={[0, 1.3, 0.7]}>
        <MovieCard url={currentMovie?.poster_path ? POSTER_W + currentMovie.poster_path : null} scale={[1.05, 1.58]} />
      </group>

      <ScrollColumn items={items} kind={kind} onPickActor={onPickActor} onPickFilm={onPickFilm} pan={pan} />
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
  const items = showFilms ? filmography : (cast || []);
  const kind = showFilms ? 'films' : 'actors';

  const pan = useRef({ tx: 0, ty: 0 }).current;
  const scrollMax = Math.max(0, (items.length - 1) * SPACING_Y - 1.6);

  useEffect(() => {
    pan.tx = 0; pan.ty = 0;
  }, [currentMovie?.id, selectedActor?.id, showFilms, pan]);

  const bind = useDrag(({ first, movement: [mx, my], memo }) => {
    if (first) memo = { x: pan.tx, y: pan.ty };
    pan.tx = THREE.MathUtils.clamp(memo.x + mx * PAN_X_FACTOR, -PAN_X_LIMIT, PAN_X_LIMIT);
    pan.ty = THREE.MathUtils.clamp(memo.y - my * PAN_Y_FACTOR, 0, scrollMax);
    return memo;
  }, { filterTaps: true, pointer: { touch: true } });

  if (!webgl) {
    return (
      <div className="space-fallback">
        <p>Your device doesn’t support 3D Space mode.</p>
        <button className="space-classic-btn" onClick={onSwitchToClassic}>Use Classic mode →</button>
      </div>
    );
  }

  return (
    <div className="space-board" {...bind()} style={{ touchAction: 'none' }}>
      <Canvas camera={{ position: [0, 0.4, 6], fov: 60 }} dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <Suspense fallback={null}>
          <Scene
            currentMovie={currentMovie}
            targetMovie={targetMovie}
            items={items}
            kind={kind}
            onPickActor={handleActorSelect}
            onPickFilm={handleFilmographySelect}
            pan={pan}
          />
        </Suspense>
      </Canvas>

      {/* left/right framing borders for the walk lane */}
      <div className="space-rails" aria-hidden="true" />

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
            <span>{actorLoading ? 'Travelling…' : 'Scroll down · tap to travel'}</span>
          )}
        </div>
        <div className="space-hud-moves"><b>{movesRemaining}</b> moves left</div>
      </div>
    </div>
  );
}
