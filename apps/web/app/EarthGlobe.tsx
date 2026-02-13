'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function EarthGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Globe group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Globe sphere (wireframe style)
    const globeGeo = new THREE.SphereGeometry(1, 64, 64);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x1a1a3e,
      transparent: true,
      opacity: 0.4,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globe);

    // Wireframe grid lines (latitude/longitude)
    const wireGeo = new THREE.SphereGeometry(1.002, 36, 24);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x4a2a8a,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const wireframe = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireframe);

    // Continent-like dots on globe surface
    const continentPoints: [number, number][] = [
      // North America
      [40, -100], [45, -90], [35, -85], [30, -95], [50, -110],
      [48, -120], [38, -105], [42, -75], [35, -80], [25, -80],
      [30, -90], [20, -100], [55, -115], [52, -105],
      // South America
      [-10, -55], [-15, -47], [-23, -43], [-5, -60], [-33, -70],
      [-20, -63], [-3, -50], [-12, -76], [-30, -58], [-40, -65],
      // Europe
      [48, 2], [52, 13], [40, -4], [55, 37], [45, 25],
      [60, 25], [50, 20], [42, 12], [38, 23], [56, 10],
      [51, 0], [47, 8], [44, 26],
      // Africa
      [30, 31], [0, 32], [-5, 37], [10, 8], [-25, 28],
      [5, 20], [15, 33], [-15, 25], [-30, 25], [35, 10],
      [12, 42], [-1, 15], [7, 3],
      // Asia
      [35, 105], [40, 116], [30, 120], [55, 83], [25, 85],
      [13, 100], [36, 140], [40, 70], [28, 77], [1, 104],
      [22, 114], [48, 107], [33, 44], [38, 58], [45, 90],
      // Australia
      [-25, 134], [-33, 151], [-28, 153], [-37, 145], [-20, 135],
      [-31, 116], [-27, 143],
    ];

    const dotGeo = new THREE.SphereGeometry(0.012, 6, 6);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.8 });

    continentPoints.forEach(([lat, lng]) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const x = -(1.01) * Math.sin(phi) * Math.cos(theta);
      const y = (1.01) * Math.cos(phi);
      const z = (1.01) * Math.sin(phi) * Math.sin(theta);
      const dot = new THREE.Mesh(dotGeo, dotMat.clone());
      dot.position.set(x, y, z);
      globeGroup.add(dot);
    });

    // Glow ring (atmosphere effect)
    const glowRingGeo = new THREE.RingGeometry(1.0, 1.35, 64);
    const glowRingMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });
    const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat);
    glowRing.lookAt(camera.position);
    scene.add(glowRing);

    // Inner atmosphere glow
    const atmosphereGeo = new THREE.SphereGeometry(1.08, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(0.45, 0.2, 0.9, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    globeGroup.add(atmosphere);

    // Arc connections between cities
    const connections: [number, number, number, number][] = [
      [40, -74, 51, 0],       // NYC -> London
      [51, 0, 35, 105],       // London -> China
      [35, 105, -33, 151],    // China -> Sydney
      [40, -74, -23, -43],    // NYC -> Brazil
      [48, 2, 55, 37],        // Paris -> Moscow
      [35, 140, 1, 104],      // Tokyo -> Singapore
      [-33, 151, 35, 140],    // Sydney -> Tokyo
      [13, 100, 28, 77],      // Bangkok -> Delhi
      [40, -74, 48, 2],       // NYC -> Paris
      [30, 31, 25, 85],       // Cairo -> India
    ];

    const createArc = (lat1: number, lng1: number, lat2: number, lng2: number, color: number) => {
      const phi1 = (90 - lat1) * (Math.PI / 180);
      const theta1 = (lng1 + 180) * (Math.PI / 180);
      const phi2 = (90 - lat2) * (Math.PI / 180);
      const theta2 = (lng2 + 180) * (Math.PI / 180);

      const v1 = new THREE.Vector3(
        -Math.sin(phi1) * Math.cos(theta1),
        Math.cos(phi1),
        Math.sin(phi1) * Math.sin(theta1)
      );
      const v2 = new THREE.Vector3(
        -Math.sin(phi2) * Math.cos(theta2),
        Math.cos(phi2),
        Math.sin(phi2) * Math.sin(theta2)
      );

      const points: THREE.Vector3[] = [];
      const segments = 50;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const point = new THREE.Vector3().lerpVectors(v1, v2, t).normalize();
        const elevation = 1.0 + 0.25 * Math.sin(Math.PI * t);
        point.multiplyScalar(elevation);
        points.push(point);
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const arcGeo = new THREE.TubeGeometry(curve, 40, 0.004, 4, false);
      const arcMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
      });
      return new THREE.Mesh(arcGeo, arcMat);
    };

    const arcColors = [0x8b5cf6, 0xa78bfa, 0x7c3aed, 0xc084fc, 0x6d28d9];
    connections.forEach(([lat1, lng1, lat2, lng2], i) => {
      const arc = createArc(lat1, lng1, lat2, lng2, arcColors[i % arcColors.length]);
      globeGroup.add(arc);
    });

    // Location pin points (bright dots at major cities)
    const pinLocations: [number, number][] = [
      [40, -74], [51, 0], [35, 105], [-33, 151], [-23, -43],
      [48, 2], [55, 37], [35, 140], [1, 104], [28, 77], [30, 31],
    ];

    const pinGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xc4b5fd });

    pinLocations.forEach(([lat, lng]) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const x = -(1.015) * Math.sin(phi) * Math.cos(theta);
      const y = (1.015) * Math.cos(phi);
      const z = (1.015) * Math.sin(phi) * Math.sin(theta);
      const pin = new THREE.Mesh(pinGeo, pinMat.clone());
      pin.position.set(x, y, z);
      globeGroup.add(pin);
    });

    // Outer orbital rings
    const createOrbitRing = (radius: number, tiltX: number, tiltZ: number, color: number, opacity: number) => {
      const ringGeo = new THREE.TorusGeometry(radius, 0.003, 8, 128);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = tiltX;
      ring.rotation.z = tiltZ;
      return ring;
    };

    const orbit1 = createOrbitRing(1.5, Math.PI / 2.5, 0.3, 0x6d28d9, 0.25);
    const orbit2 = createOrbitRing(1.7, Math.PI / 3, -0.2, 0x4a2a8a, 0.15);
    globeGroup.add(orbit1);
    globeGroup.add(orbit2);

    // Small particles floating around
    const particlesCount = 200;
    const particlesGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      const radius = 1.3 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMat = new THREE.PointsMaterial({
      color: 0x8b5cf6,
      size: 0.015,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    globeGroup.add(particles);

    // Tilt globe slightly (only on X axis to keep centered)
    globeGroup.rotation.x = 0.2;

    // Mouse interaction
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Slow rotation
      globeGroup.rotation.y = elapsed * 0.08;

      // Mouse parallax (subtle, keeps globe centered)
      globeGroup.rotation.x = 0.2 + mouseY * 0.15;

      // Glow ring follows camera
      glowRing.lookAt(camera.position);

      // Pulsate atmosphere
      const scale = 1 + 0.02 * Math.sin(elapsed * 1.5);
      atmosphere.scale.set(scale, scale, scale);

      // Orbit ring rotation
      orbit1.rotation.y = elapsed * 0.15;
      orbit2.rotation.y = -elapsed * 0.1;

      // Particle drift
      particles.rotation.y = elapsed * 0.03;
      particles.rotation.x = Math.sin(elapsed * 0.05) * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="earth-globe"
    />
  );
}
