'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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

export function GalaxyMap() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | undefined>(undefined);
  const cameraRef = useRef<THREE.PerspectiveCamera | undefined>(undefined);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);
  const controlsRef = useRef<OrbitControls | undefined>(undefined);
  const particleSystemRef = useRef<THREE.Points | undefined>(undefined);
  const selectedSystemIconRef = useRef<THREE.Sprite | undefined>(undefined);
  const targetCircleRef = useRef<THREE.Object3D | undefined>(undefined);
  const raycasterRef = useRef<THREE.Raycaster | undefined>(undefined);
  const animationIdRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);
  const animateRef = useRef<(() => void) | null>(null);

  const [systems, setSystems] = useState<System[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [systemInfoHidden, setSystemInfoHidden] = useState(true);
  const [colorSelectionHidden, setColorSelectionHidden] = useState(false);
  const [activeColoring, setActiveColoring] = useState(0); // 0=economy, 1=allegiance, 2=government

  const mouse = useRef(new THREE.Vector2());

  // Color mapping data (exact match to legacy)
  const colorService = useMemo(() => ({
    colorPalette: ['#666666', '#fe0000', '#ff7f00', '#ffff00', '#bfff00', '#7fff00', '#00ff15', '#009901', '#00ff80', '#01ffff', '#337eff', '#0145ff', '#6601e5', '#e600e6'],
    mapEconomy: ['None', 'Extraction', 'Refinery', 'Industrial', 'UNUSED', 'Agriculture', 'UNUSED', 'Terraforming', 'UNUSED', 'High Tech', 'Colony', 'Service', 'Tourism', 'Military'],
    mapAllegiance: ['None', 'Federation', 'UNUSED', 'Independent', 'UNUSED', 'UNUSED', 'Alliance', 'UNUSED', 'UNUSED', 'Empire', 'UNUSED', 'UNUSED', 'UNUSED', 'UNUSED'],
    mapGovernment: ['None', 'Confederacy', 'Prison Colony', 'Anarchy', 'Colony', 'Democracy', 'Imperial', 'Corporate', 'Communism', 'Feudal', 'Dictatorship', 'Theocracy', 'Cooperative', 'Patronage'],
    mapColorTypes: ['economy', 'allegiance', 'government'],
    activeColorType: 'economy',
    activeColors: [true, true, true, true, true, true, true, true, true, true, true, true, true, true]
  }), []);

  const initThreeJS = useCallback(() => {
    if (!mountRef.current || isInitializedRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera - updated for larger galactic scale
    const camera = new THREE.PerspectiveCamera(
      90,
      window.innerWidth / window.innerHeight,
      1,
      1000000  // Increased far plane for larger galaxy
    );
    camera.position.set(0, 200, 200); // Start further back to see more systems
    cameraRef.current = camera;

    // Renderer with context loss protection
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      preserveDrawingBuffer: false,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.sortObjects = true;
    rendererRef.current = renderer;

    // Add WebGL context loss/restore handlers
    const canvas = renderer.domElement;
    
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('WebGL context lost, stopping animation');
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };

    const handleContextRestored = () => {
      console.log('WebGL context restored, resuming animation');
      if (!animationIdRef.current && animateRef.current) {
        animateRef.current();
      }
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Add renderer to DOM
    mountRef.current.appendChild(renderer.domElement);

    // Raycaster for mouse picking
    raycasterRef.current = new THREE.Raycaster();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (raycasterRef.current.params as any).Points = { threshold: 50.0 }; // Increased threshold for better picking

    // Add selected system icon
    addSelectedSystemIcon();

    // Add target circle
    addTargetCircle();

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
    
    // Mark as initialized
    isInitializedRef.current = true;
    
    // Return cleanup function for resize listener
    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, []);

  const addControls = () => {
    if (!cameraRef.current || !rendererRef.current || !mountRef.current) return;

    const controls = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controls.rotateSpeed = 0.3;
    controls.zoomSpeed = 2.2;
    controls.panSpeed = 4;  // Increased for larger scale
    controls.enableDamping = true;
    controls.dampingFactor = 0.3;
    controls.keys = { LEFT: 'KeyA', UP: 'KeyS', RIGHT: 'KeyD', BOTTOM: 'KeyW' };
    controls.minDistance = 10;  // Updated for larger scale
    controls.maxDistance = 50000; // Allow zooming out to see the full galaxy

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

  const addTargetCircle = () => {
    if (!sceneRef.current) return;

    // Create target circle similar to legacy implementation
    const targetCircle = new THREE.Object3D();
    const targetCircleGeo = new THREE.CircleGeometry(50, 64);
    const targetLineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    
    // Remove center vertex to create a ring (like legacy)
    const positions = targetCircleGeo.attributes.position.array as Float32Array;
    const newPositions = new Float32Array(positions.length - 3); // Remove first vertex (center)
    newPositions.set(positions.slice(3));
    
    const ringGeometry = new THREE.BufferGeometry();
    ringGeometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    
    const ring = new THREE.Line(ringGeometry, targetLineMaterial);
    targetCircle.add(ring);
    targetCircle.visible = false;
    targetCircle.name = 'targetCircle';
    
    targetCircleRef.current = targetCircle;
    sceneRef.current.add(targetCircle);
  };

  // Generate realistic galactic coordinates similar to Elite Dangerous galaxy
  const generateGalacticCoordinates = useCallback(() => {
    const random = Math.random();
    
    if (random < 0.6) {
      // 60% of systems in the core bubble (similar to inhabited space in Elite)
      return {
        x: (Math.random() - 0.5) * 400 + (Math.random() - 0.5) * 50, // -225 to 225 with center bias
        y: (Math.random() - 0.5) * 200 + (Math.random() - 0.5) * 30, // -115 to 115 with center bias  
        z: (Math.random() - 0.5) * 300 + (Math.random() - 0.5) * 40  // -170 to 170 with center bias
      };
    } else if (random < 0.85) {
      // 25% in the extended region (further from center)
      return {
        x: (Math.random() - 0.5) * 2000,  // -1000 to 1000
        y: (Math.random() - 0.5) * 1000,  // -500 to 500
        z: (Math.random() - 0.5) * 1500   // -750 to 750
      };
    } else {
      // 15% in the far reaches (matching some of the extreme coordinates from legacy data)
      const angle = Math.random() * Math.PI * 2;
      const distance = 1000 + Math.random() * 8000; // 1000 to 9000 light years from center
      return {
        x: Math.cos(angle) * distance + (Math.random() - 0.5) * 500,
        y: (Math.random() - 0.5) * 3000, // -1500 to 1500 
        z: Math.sin(angle) * distance + (Math.random() - 0.5) * 30000 // Allow for some very distant systems
      };
    }
  }, []);

  const createTestSystems = useCallback((): System[] => {
    const systems: System[] = [];
    for (let i = 0; i < 1000; i++) {
      const coords = generateGalacticCoordinates();
      systems.push({
        id: i,
        name: `System ${i}`,
        x: coords.x,
        y: coords.y,
        z: coords.z,
        population: Math.random() * 1000000000,
        primary_economy: colorService.mapEconomy[Math.floor(Math.random() * colorService.mapEconomy.length)],
        allegiance: colorService.mapAllegiance[Math.floor(Math.random() * colorService.mapAllegiance.length)],
        government: colorService.mapGovernment[Math.floor(Math.random() * colorService.mapGovernment.length)]
      });
    }
    return systems;
  }, [colorService, generateGalacticCoordinates]);

  const loadSystemsIntoScene = useCallback((systemsData: System[]) => {
    if (!sceneRef.current) return;

    setIsLoading(false);

    // Create texture for points (circle texture like legacy)
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

    // Create simple shader material that works (temporarily simplified)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: texture },
        scale: { value: 100.0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 customColor;
        uniform float scale;
        varying vec3 vColor;
        
        void main() {
          vColor = customColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = min(size * (scale / length(mvPosition.xyz)), 40.0);
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

      // Color based on active coloring type using legacy color service
      let colorProperty = '';
      let colorArray: string[] = [];
      
      if (activeColoring === 0) {
        colorProperty = system.primary_economy || 'None';
        colorArray = colorService.mapEconomy;
      } else if (activeColoring === 1) {
        colorProperty = system.allegiance || 'None'; 
        colorArray = colorService.mapAllegiance;
      } else if (activeColoring === 2) {
        colorProperty = system.government || 'None';
        colorArray = colorService.mapGovernment;
      }
      
      // Get color index and map to legacy color palette
      const colorIndex = colorArray.indexOf(colorProperty);
      const clampedIndex = Math.max(0, Math.min(colorIndex, colorService.colorPalette.length - 1));
      const hexColor = colorService.colorPalette[clampedIndex];
      
      // Convert hex to RGB
      const color = new THREE.Color(hexColor);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Size based on population - using exact legacy formula
      const BASE_POINT_SIZE = 100;
      const POP_SIZE_THRESHOLD = 1000000000; // 1 billion
      let size;
      if (system.population) {
        size = 50 * Math.max(system.population / POP_SIZE_THRESHOLD, 1.0);
      } else {
        size = BASE_POINT_SIZE;
      }
      sizes[i] = size;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Create particle system
    const particleSystem = new THREE.Points(geometry, material);
    particleSystemRef.current = particleSystem;
    sceneRef.current.add(particleSystem);
  }, [colorService, activeColoring]);

  // Function to update active coloring type
  const updateActiveColoring = useCallback((colorType: string) => {
    let newActiveColoring = 0;
    if (colorType === 'allegiance') newActiveColoring = 1;
    else if (colorType === 'government') newActiveColoring = 2;
    
    setActiveColoring(newActiveColoring);
    
    // Directly update colors without triggering re-render
    if (systems.length > 0 && particleSystemRef.current && particleSystemRef.current.geometry) {
      const colors = new Float32Array(systems.length * 3);
      
      for (let i = 0; i < systems.length; i++) {
        const system = systems[i];
        
        // Color based on active coloring type using legacy color service
        let colorProperty = '';
        let colorArray: string[] = [];
        
        if (newActiveColoring === 0) {
          colorProperty = system.primary_economy || 'None';
          colorArray = colorService.mapEconomy;
        } else if (newActiveColoring === 1) {
          colorProperty = system.allegiance || 'None'; 
          colorArray = colorService.mapAllegiance;
        } else if (newActiveColoring === 2) {
          colorProperty = system.government || 'None';
          colorArray = colorService.mapGovernment;
        }
        
        // Get color index and map to legacy color palette
        const colorIndex = colorArray.indexOf(colorProperty);
        const clampedIndex = Math.max(0, Math.min(colorIndex, colorService.colorPalette.length - 1));
        const hexColor = colorService.colorPalette[clampedIndex];
        
        // Convert hex to RGB
        const color = new THREE.Color(hexColor);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
      
      particleSystemRef.current.geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
      particleSystemRef.current.geometry.attributes.customColor.needsUpdate = true;
    }
  }, [systems, colorService]);

  const setupEventListeners = useCallback(() => {
    console.log('setupEventListeners called');
    if (!mountRef.current || !rendererRef.current) {
      console.log('Missing mountRef or rendererRef');
      return;
    }
    
    // Get the canvas element to attach mouse events to
    const canvas = rendererRef.current.domElement;
    console.log('Canvas found:', !!canvas);

    const handleMouseMove = (event: MouseEvent) => {
      // Update mouse coordinates for raycasting (same as legacy implementation)
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
      console.log('Mouse move:', mouse.current.x, mouse.current.y);
    };

    const handleMouseClick = () => {
      console.log('Mouse click detected');
      if (!particleSystemRef.current || !cameraRef.current || !raycasterRef.current) {
        console.log('Missing refs for raycasting');
        return;
      }

      console.log('Performing raycast with mouse:', mouse.current.x, mouse.current.y);
      raycasterRef.current.setFromCamera(mouse.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObject(particleSystemRef.current);
      console.log('Intersects found:', intersects.length);
      console.log('Total systems loaded:', systems.length);

      if (intersects.length > 0) {
        const intersect = intersects[0];
        const systemIndex = intersect.index;
        if (systemIndex !== undefined && systemIndex >= 0 && systemIndex < systems.length && systems[systemIndex]) {
          const system = systems[systemIndex];
          setSelectedSystem(system);
          setSystemInfoHidden(false);
          setTargetPosition(system);
          flyToSystem(system);
        }
      }
    };

    console.log('Adding event listeners to canvas');
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleMouseClick);
    
    // Return cleanup function
    return () => {
      console.log('Cleaning up event listeners');
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleMouseClick);
    };
  }, [systems]);

  const setTargetPosition = (system: System) => {
    console.log('setTargetPosition called for system:', system.name);
    if (!targetCircleRef.current || !cameraRef.current) {
      console.log('Missing targetCircleRef or cameraRef');
      return;
    }

    // Make target circle visible and position it at the system
    targetCircleRef.current.visible = true;
    targetCircleRef.current.position.set(system.x, system.y, system.z);
    targetCircleRef.current.lookAt(cameraRef.current.position);
    
    // Scale based on population like legacy implementation  
    const POP_SIZE_THRESHOLD = 1000000000;
    let popScale = 1.0;
    if (system.population) {
      popScale = Math.max(system.population / POP_SIZE_THRESHOLD, 1.0);
    }
    targetCircleRef.current.scale.set(popScale, popScale, popScale);
    console.log('Target circle positioned and made visible');
  };

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
    // Check if WebGL context is still valid before continuing
    if (!rendererRef.current || !rendererRef.current.getContext() || rendererRef.current.getContext().isContextLost()) {
      console.warn('WebGL context lost, stopping animation');
      animationIdRef.current = null;
      return;
    }

    animationIdRef.current = requestAnimationFrame(animate);

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

  // Store animate function in ref for context restored handler
  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  const render = () => {
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      // Check WebGL context validity before rendering
      const gl = rendererRef.current.getContext();
      if (gl && !gl.isContextLost()) {
        try {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        } catch (error) {
          console.error('Render error:', error);
        }
      }
    }
  };

  useEffect(() => {
    if (!mountRef.current || isInitializedRef.current) return;

    const currentMount = mountRef.current;
    let cleanupResize: (() => void) | undefined;

    const initializeGalaxy = async () => {
      try {
        // Initialize Three.js scene first
        cleanupResize = initThreeJS();
        
        // Wait a frame to ensure WebGL context is ready
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // Load systems data directly
        try {
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

        // Wait another frame before starting animation
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // Start animation loop only after everything is ready
        if (isInitializedRef.current && !animationIdRef.current && animateRef.current) {
          animateRef.current();
        }
      } catch (error) {
        console.error('Galaxy initialization error:', error);
        setIsLoading(false);
      }
    };

    initializeGalaxy();

    // Cleanup
    return () => {
      // Stop animation
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      
      // Cleanup Three.js resources
      if (rendererRef.current) {
        if (currentMount && currentMount.contains(rendererRef.current.domElement)) {
          currentMount.removeChild(rendererRef.current.domElement);
        }
        
        // Dispose of renderer
        rendererRef.current.dispose();
        rendererRef.current = undefined;
      }
      
      // Cleanup target circle before disposing scene
      if (targetCircleRef.current && sceneRef.current) {
        sceneRef.current.remove(targetCircleRef.current);
        targetCircleRef.current = undefined;
      }
      
      // Dispose of scene objects
      if (sceneRef.current) {
        sceneRef.current.clear();
        sceneRef.current = undefined;
      }
      
      // Dispose of particle system
      if (particleSystemRef.current) {
        if (particleSystemRef.current.geometry) {
          particleSystemRef.current.geometry.dispose();
        }
        if (particleSystemRef.current.material) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (particleSystemRef.current.material as any).dispose();
        }
        particleSystemRef.current = undefined;
      }
      
      // Cleanup controls
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = undefined;
      }
      
      // Call cleanup functions
      if (cleanupResize) {
        cleanupResize();
      }
      
      // Reset initialization flag
      isInitializedRef.current = false;
    };
  }, []); // Remove problematic dependencies to stop re-initialization loop

  // Separate effect to handle event listeners when systems change
  useEffect(() => {
    if (systems.length > 0 && rendererRef.current) {
      const cleanup = setupEventListeners();
      return cleanup;
    }
  }, [systems, setupEventListeners]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      
      {isLoading && <LoadingSpinner />}
      
      {!colorSelectionHidden && (
        <ColorSelection
          onClose={() => setColorSelectionHidden(true)}
          onColorChange={(colorType) => {
            updateActiveColoring(colorType);
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