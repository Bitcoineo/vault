"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

// Generate a random point on a sphere surface
function randomSpherePoint(radius: number): THREE.Vector3 {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi)
  );
}

// Create a curved arc between two points on a sphere (great-circle-ish)
function createArcPoints(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  segments: number = 64
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const mid = new THREE.Vector3()
    .addVectors(start, end)
    .multiplyScalar(0.5)
    .normalize()
    .multiplyScalar(radius * 1.35);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3();
    // Quadratic bezier on sphere surface
    const a = new THREE.Vector3().copy(start).multiplyScalar((1 - t) * (1 - t));
    const b = new THREE.Vector3().copy(mid).multiplyScalar(2 * (1 - t) * t);
    const c = new THREE.Vector3().copy(end).multiplyScalar(t * t);
    p.add(a).add(b).add(c);
    points.push(p);
  }
  return points;
}

interface ArcState {
  line: THREE.Line;
  dot: THREE.Mesh;
  trail: THREE.Points;
  trailPositions: Float32Array;
  trailOpacities: Float32Array;
  points: THREE.Vector3[];
  progress: number; // 0 to 1 drawing, 1 to 1.5 traveling dot, 1.5 to 2 pause
  speed: number;
  totalPoints: number;
}

export function GlobeAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.set(isMobile ? 0 : 120, 30, 400);
    camera.lookAt(isMobile ? 0 : 60, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const globeRadius = isMobile ? 140 : 200;

    // Wireframe globe
    const globeGeo = new THREE.SphereGeometry(globeRadius, 24, 16);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x1e3a5f,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Inner glow sphere
    const glowGeo = new THREE.SphereGeometry(globeRadius * 0.98, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.03,
    });
    const glowSphere = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glowSphere);

    // Ambient particles
    const particleCount = isMobile ? 40 : 80;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const p = randomSpherePoint(globeRadius * (1.1 + Math.random() * 0.5));
      particlePositions[i * 3] = p.x;
      particlePositions[i * 3 + 1] = p.y;
      particlePositions[i * 3 + 2] = p.z;
    }
    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );
    const particleMat = new THREE.PointsMaterial({
      color: 0x3b82f6,
      size: 1.5,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // File icon proxies — small colored planes orbiting
    const fileColors = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b];
    const fileIcons: { mesh: THREE.Mesh; angle: number; speed: number; tilt: number; dist: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.PlaneGeometry(8, 10);
      const mat = new THREE.MeshBasicMaterial({
        color: fileColors[i],
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const angle = (i / 4) * Math.PI * 2;
      const tilt = (Math.random() - 0.5) * 0.6;
      const dist = globeRadius * (1.15 + Math.random() * 0.15);
      mesh.position.set(
        Math.cos(angle) * dist,
        Math.sin(tilt) * dist * 0.3,
        Math.sin(angle) * dist
      );
      scene.add(mesh);
      fileIcons.push({
        mesh,
        angle,
        speed: 0.001 + Math.random() * 0.002,
        tilt,
        dist,
      });
    }

    // Arc system
    const arcs: ArcState[] = [];

    function createArc(delay: number): ArcState {
      const segments = 64;
      const start = randomSpherePoint(globeRadius);
      const end = randomSpherePoint(globeRadius);
      const points = createArcPoints(start, end, globeRadius, segments);

      // Arc line (starts invisible, draws progressively)
      const lineGeo = new THREE.BufferGeometry();
      const linePositions = new Float32Array(points.length * 3);
      points.forEach((p, i) => {
        linePositions[i * 3] = p.x;
        linePositions[i * 3 + 1] = p.y;
        linePositions[i * 3 + 2] = p.z;
      });
      lineGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(linePositions, 3)
      );
      lineGeo.setDrawRange(0, 0);

      const lineMat = new THREE.LineBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.7,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      // Traveling dot
      const dotGeo = new THREE.SphereGeometry(3, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(start);
      scene.add(dot);

      // Trail particles
      const trailCount = 12;
      const trailPositions = new Float32Array(trailCount * 3);
      const trailOpacities = new Float32Array(trailCount);
      for (let i = 0; i < trailCount; i++) {
        trailPositions[i * 3] = start.x;
        trailPositions[i * 3 + 1] = start.y;
        trailPositions[i * 3 + 2] = start.z;
        trailOpacities[i] = 0;
      }
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(trailPositions, 3)
      );
      const trailMat = new THREE.PointsMaterial({
        color: 0x60a5fa,
        size: 2,
        transparent: true,
        opacity: 0.5,
        sizeAttenuation: true,
      });
      const trail = new THREE.Points(trailGeo, trailMat);
      scene.add(trail);

      return {
        line,
        dot,
        trail,
        trailPositions,
        trailOpacities,
        points,
        progress: -delay * 0.01, // negative = delay
        speed: 0.004 + Math.random() * 0.002,
        totalPoints: points.length,
      };
    }

    // Create initial arcs with staggered delays
    const arcCount = isMobile ? 3 : 5;
    for (let i = 0; i < arcCount; i++) {
      arcs.push(createArc(i * 120));
    }

    function resetArc(arc: ArcState) {
      // Remove old objects
      scene.remove(arc.line);
      scene.remove(arc.dot);
      scene.remove(arc.trail);
      arc.line.geometry.dispose();
      (arc.line.material as THREE.Material).dispose();
      arc.dot.geometry.dispose();
      (arc.dot.material as THREE.Material).dispose();
      arc.trail.geometry.dispose();
      (arc.trail.material as THREE.Material).dispose();

      // Create new arc
      const newArc = createArc(0);
      Object.assign(arc, newArc);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x3b82f6, 1.5, 600);
    pointLight.position.set(100, 100, 200);
    scene.add(pointLight);

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // Rotate globe
      globe.rotation.y += 0.001;
      glowSphere.rotation.y += 0.001;
      particles.rotation.y += 0.0005;

      // Orbit file icons
      for (const icon of fileIcons) {
        icon.angle += icon.speed;
        icon.mesh.position.x = Math.cos(icon.angle) * icon.dist;
        icon.mesh.position.z = Math.sin(icon.angle) * icon.dist;
        icon.mesh.position.y =
          Math.sin(icon.angle * 0.7 + icon.tilt) * icon.dist * 0.25;
        icon.mesh.rotation.y = icon.angle + Math.PI;
      }

      // Update arcs
      for (const arc of arcs) {
        if (arc.progress < 0) {
          // Still in delay
          arc.progress += arc.speed;
          continue;
        }

        if (arc.progress <= 1) {
          // Drawing phase — reveal line progressively
          const drawCount = Math.floor(arc.progress * arc.totalPoints);
          arc.line.geometry.setDrawRange(0, drawCount);
          arc.progress += arc.speed;
        } else if (arc.progress <= 2) {
          // Dot traveling phase
          arc.line.geometry.setDrawRange(0, arc.totalPoints);
          const dotT = arc.progress - 1; // 0 to 1
          const idx = Math.min(
            Math.floor(dotT * (arc.totalPoints - 1)),
            arc.totalPoints - 1
          );
          const pt = arc.points[idx];
          if (pt) {
            arc.dot.position.copy(pt);
            (arc.dot.material as THREE.MeshBasicMaterial).opacity = 0.9;

            // Update trail
            for (let i = arc.trailPositions.length / 3 - 1; i > 0; i--) {
              arc.trailPositions[i * 3] = arc.trailPositions[(i - 1) * 3];
              arc.trailPositions[i * 3 + 1] = arc.trailPositions[(i - 1) * 3 + 1];
              arc.trailPositions[i * 3 + 2] = arc.trailPositions[(i - 1) * 3 + 2];
            }
            arc.trailPositions[0] = pt.x;
            arc.trailPositions[1] = pt.y;
            arc.trailPositions[2] = pt.z;
            arc.trail.geometry.attributes.position.needsUpdate = true;
          }
          arc.progress += arc.speed * 0.8;
        } else if (arc.progress <= 2.5) {
          // Fade out
          const fadeT = (arc.progress - 2) / 0.5;
          (arc.line.material as THREE.LineBasicMaterial).opacity =
            0.7 * (1 - fadeT);
          (arc.dot.material as THREE.MeshBasicMaterial).opacity =
            0.9 * (1 - fadeT);
          (arc.trail.material as THREE.PointsMaterial).opacity =
            0.5 * (1 - fadeT);
          arc.progress += arc.speed;
        } else {
          // Reset
          resetArc(arc);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      // Dispose all scene objects
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden="true"
    />
  );
}
