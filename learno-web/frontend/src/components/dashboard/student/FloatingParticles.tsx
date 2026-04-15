"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  alpha: number;
}

export function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();

    const parseAccent = (): [number, number, number] => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--student-accent-rgb")
        .trim();

      if (!raw) {
        return [111, 168, 220];
      }

      const parts = raw
        .split(/\s+/)
        .slice(0, 3)
        .map((value) => Number.parseInt(value, 10));

      if (parts.length !== 3 || parts.some((value) => Number.isNaN(value))) {
        return [111, 168, 220];
      }

      return [parts[0], parts[1], parts[2]];
    };

    const parseParticleCount = (): number => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--student-particles-count")
        .trim();
      const parsed = Number.parseInt(raw, 10);

      if (Number.isNaN(parsed)) {
        return 35;
      }

      return Math.max(10, Math.min(60, parsed));
    };

    const createParticles = (count: number): Particle[] => {
      return Array.from({ length: count }).map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 4 + 1,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.4 + 0.1,
      }));
    };

    let accent = parseAccent();
    let particles = createParticles(parseParticleCount());

    const observer = new MutationObserver(() => {
      accent = parseAccent();
      particles = createParticles(parseParticleCount());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "data-student-condition"],
    });

    let frameId = 0;

    const render = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, ${particle.alpha})`;
        context.fill();

        particle.x += particle.dx;
        particle.y += particle.dy;

        if (particle.x < 0 || particle.x > canvas.width) {
          particle.dx *= -1;
        }

        if (particle.y < 0 || particle.y > canvas.height) {
          particle.dy *= -1;
        }
      });

      frameId = window.requestAnimationFrame(render);
    };

    render();
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: "var(--student-particles-opacity, 0.6)" }}
    />
  );
}
