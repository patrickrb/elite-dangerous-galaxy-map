'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SystemInfo } from './SystemInfo';
import { ColorSelection } from './ColorSelection';
import { LoadingSpinner } from './LoadingSpinner';

interface System {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  population?: number;
  primary_economy?: string;
  allegiance?: string;
  government?: string;
}

interface Station {
  id: number;
  name: string;
  system_id: number;
  type: string;
}

export function GalaxyMap() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | undefined>(undefined);
  const cameraRef = useRef<THREE.PerspectiveCamera | undefined>(undefined);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);
  const controlsRef = useRef<OrbitControls | undefined>(undefined);
  const particleSystemRef = useRef<THREE.Points | undefined>(undefined);
  const selectedSystemIconRef = useRef<THREE.Sprite | undefined>(undefined);
  const raycasterRef = useRef<THREE.Raycaster | undefined>(undefined);

  const [systems, setSystems] = useState<System[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [systemInfoHidden, setSystemInfoHidden] = useState(true);
  const [colorSelectionHidden, setColorSelectionHidden] = useState(false);

  const mouse = useRef(new THREE.Vector2());

  // Color mapping data (simplified version from original)
  const colorService = {
    mapEconomy: ['Industrial', 'Agriculture', 'Extraction', 'Refinery', 'Service', 'Tourism', 'Military', 'High Tech'],
    mapAllegiance: ['Federation', 'Empire', 'Alliance', 'Independent', 'Thargoid', 'Guardian'],
    mapGovernment: ['Democracy', 'Corporate', 'Dictatorship', 'Communist', 'Feudal', 'Cooperative', 'Confederacy', 'Patronage'],
    mapColorTypes: ['economy', 'allegiance', 'government']
  };

  const initThreeJS = useCallback(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      90,
      window.innerWidth / window.innerHeight,
      1,
      999000
    );
    camera.position.set(0, 50, 50);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.sortObjects = true;
    rendererRef.current = renderer;

    // Add renderer to DOM
    mountRef.current.appendChild(renderer.domElement);

    // Raycaster for mouse picking
    raycasterRef.current = new THREE.Raycaster();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (raycasterRef.current.params as any).Points = { threshold: 0.5 };

    // Add selected system icon
    addSelectedSystemIcon();

    // Add controls
    addControls();

    // Handle window resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
  }, []);

  const addControls = () => {
    if (!cameraRef.current || !rendererRef.current || !mountRef.current) return;

    const controls = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controls.rotateSpeed = 0.3;
    controls.zoomSpeed = 2.2;
    controls.panSpeed = 2;
    controls.enableDamping = true;
    controls.dampingFactor = 0.3;
    controls.keys = { LEFT: 'KeyA', UP: 'KeyS', RIGHT: 'KeyD', BOTTOM: 'KeyW' };
    controls.minDistance = 5;

    controlsRef.current = controls;
  };

  const addSelectedSystemIcon = () => {
    if (!sceneRef.current) return;

    // Create a simple colored sprite for now since we don't have the texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#00ff00';
    context.fillRect(0, 0, 64, 64);
    context.fillStyle = '#ffffff';
    context.fillRect(4, 4, 56, 56);
    context.fillStyle = '#00ff00';
    context.fillRect(8, 8, 48, 48);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });
    
    const sprite = new THREE.Sprite(material);
    sprite.visible = false;
    sprite.scale.set(0.33, 0.66, 0.33);
    
    selectedSystemIconRef.current = sprite;
    sceneRef.current.add(sprite);
  };

  const createTestSystems = useCallback((): System[] => {
    const systems: System[] = [];
    for (let i = 0; i < 1000; i++) {
      systems.push({
        id: i,
        name: `System ${i}`,
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
        z: (Math.random() - 0.5) * 100,
        population: Math.random() * 1000000000,
        primary_economy: colorService.mapEconomy[Math.floor(Math.random() * colorService.mapEconomy.length)],
        allegiance: colorService.mapAllegiance[Math.floor(Math.random() * colorService.mapAllegiance.length)],
        government: colorService.mapGovernment[Math.floor(Math.random() * colorService.mapGovernment.length)]
      });
    }
    return systems;
  }, [colorService]);

  const loadSystemsIntoScene = useCallback((systemsData: System[]) => {
    if (!sceneRef.current) return;

    setIsLoading(false);

    // Create texture for points
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    // Create shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: texture },
        scale: { value: 1.0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 customColor;
        varying vec3 vColor;
        
        void main() {
          vColor = customColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        
        void main() {
          gl_FragColor = vec4(vColor, 1.0);
          gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
          if (gl_FragColor.a < 0.5) discard;
        }
      `,
      transparent: true,
      depthWrite: false
    });

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(systemsData.length * 3);
    const colors = new Float32Array(systemsData.length * 3);
    const sizes = new Float32Array(systemsData.length);

    for (let i = 0; i < systemsData.length; i++) {
      const system = systemsData[i];
      
      // Position
      positions[i * 3] = system.x;
      positions[i * 3 + 1] = system.y;
      positions[i * 3 + 2] = system.z;

      // Color based on economy (simplified)
      const economyIndex = colorService.mapEconomy.indexOf(system.primary_economy || 'Industrial');
      const hue = (economyIndex / colorService.mapEconomy.length) * 360;
      const color = new THREE.Color(`hsl(${hue}, 70%, 60%)`);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Size based on population
      const baseSize = 2;
      const popScale = system.population ? Math.max(system.population / 100000000, 1) : 1;
      sizes[i] = baseSize * popScale;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Create particle system
    const particleSystem = new THREE.Points(geometry, material);
    particleSystemRef.current = particleSystem;
    sceneRef.current.add(particleSystem);
  }, [colorService]);

  const loadSystemsData = useCallback(async () => {
    try {
      // Load systems from API
      const response = await fetch('/api/systems');
      const systemsData = await response.json();
      
      setSystems(systemsData);
      
      if (systemsData.length > 0) {
        loadSystemsIntoScene(systemsData);
      }
    } catch (error) {
      console.error('Failed to load systems:', error);
      
      // For demo purposes, create some test data
      const testSystems = createTestSystems();
      setSystems(testSystems);
      loadSystemsIntoScene(testSystems);
    }
  }, [createTestSystems, loadSystemsIntoScene]);

  const setupEventListeners = useCallback(() => {
    if (!mountRef.current) return;

    const handleMouseMove = () => {
      // Mouse move logic could be added here
    };

    const handleMouseClick = () => {
      if (!particleSystemRef.current || !cameraRef.current || !raycasterRef.current) return;

      raycasterRef.current.setFromCamera(mouse.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObject(particleSystemRef.current);

      if (intersects.length > 0) {
        const intersect = intersects[0];
        const systemIndex = intersect.index;
        if (systemIndex !== undefined && systems[systemIndex]) {
          const system = systems[systemIndex];
          setSelectedSystem(system);
          setSystemInfoHidden(false);
          flyToSystem(system);
        }
      }
    };

    mountRef.current.addEventListener('mousemove', handleMouseMove);
    mountRef.current.addEventListener('click', handleMouseClick);
  }, [systems]);

  const flyToSystem = (system: System) => {
    if (!cameraRef.current || !controlsRef.current || !selectedSystemIconRef.current) return;

    // Position the icon
    selectedSystemIconRef.current.position.set(system.x, system.y + 0.75, system.z);
    selectedSystemIconRef.current.visible = true;

    // Animate camera to system
    const targetPosition = new THREE.Vector3(system.x, system.y, system.z + 5);
    const targetLookAt = new THREE.Vector3(system.x, system.y, system.z);

    // Simple animation (could be enhanced with TWEEN.js)
    const animateCamera = () => {
      cameraRef.current!.position.lerp(targetPosition, 0.05);
      controlsRef.current!.target.lerp(targetLookAt, 0.05);
      
      if (cameraRef.current!.position.distanceTo(targetPosition) > 0.1) {
        requestAnimationFrame(animateCamera);
      }
    };
    
    animateCamera();
  };

  const animate = useCallback(() => {
    requestAnimationFrame(animate);

    if (controlsRef.current) {
      controlsRef.current.update();
    }

    // Update selected system icon scale based on distance
    if (selectedSystemIconRef.current && cameraRef.current && selectedSystemIconRef.current.visible) {
      const distance = selectedSystemIconRef.current.position.distanceTo(cameraRef.current.position);
      const scale = Math.max(Math.min(distance * 0.1, 10), 1);
      selectedSystemIconRef.current.scale.set(0.33 * scale, 0.66 * scale, 0.33 * scale);
    }

    render();
  }, []);

  const render = () => {
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    // Initialize Three.js scene
    initThreeJS();
    
    // Load systems data
    loadSystemsData();

    // Setup event listeners
    setupEventListeners();

    // Start animation loop
    animate();

    // Cleanup
    return () => {
      if (rendererRef.current && currentMount) {
        currentMount.removeChild(rendererRef.current.domElement);
      }
    };
  }, [initThreeJS, loadSystemsData, setupEventListeners, animate]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      
      {isLoading && <LoadingSpinner />}
      
      {!colorSelectionHidden && (
        <ColorSelection
          onClose={() => setColorSelectionHidden(true)}
          onColorChange={(colorType) => {
            // Handle color change
            console.log('Color changed to:', colorType);
          }}
        />
      )}
      
      {!systemInfoHidden && selectedSystem && (
        <SystemInfo
          system={selectedSystem}
          stations={[]} // No stations for now
          onClose={() => setSystemInfoHidden(true)}
        />
      )}
    </div>
  );
}