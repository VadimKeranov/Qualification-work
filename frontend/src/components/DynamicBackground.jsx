import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const DynamicBackground = () => {
  const canvasRef = useRef(null);
  const { user } = useAuth();

  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    let animationFrameId;

    const getAccentRGB = () => {
      if (!isDark) return '168, 85, 247';
      return (user?.role === 'employer') ? '191, 90, 242' : '0, 242, 254';
    };

    const rgbColor = getAccentRGB();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    // 1. Уменьшен радиус взаимодействия с мышью
    let mouse = { x: null, y: null, radius: 90 };

    const handleMouseMove = (e) => { mouse.x = e.x; mouse.y = e.y; };
    const handleMouseLeave = () => { mouse.x = null; mouse.y = null; };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.6; // Еще более плавное движение
        this.vy = (Math.random() - 0.5) * 0.6;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
        if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

        // 2. Деликатная физика отталкивания
        if (mouse.x && mouse.y) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            // Используем квадратичное сглаживание: чем ближе, тем мягче нарастает сила
            const easeForce = force * force;

            // Уменьшили множитель силы отталкивания до 1.2
            this.x -= (dx / dist) * easeForce * 1.2;
            this.y -= (dy / dist) * easeForce * 1.2;
          }
        }

        ctx.fillStyle = `rgba(${rgbColor}, 0.7)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      particlesArray = [];
      const numberOfParticles = Math.floor((canvas.width * canvas.height) / 14000);
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
      }

      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a + 1; b < particlesArray.length; b++) {
          let dx = particlesArray[a].x - particlesArray[b].x;
          let dy = particlesArray[a].y - particlesArray[b].y;
          let distSq = dx * dx + dy * dy;

          // 3. Более короткие линии связи (сократили дистанцию с 16000 до 8000)
          if (distSq < 10000) {
            let opacity = 1 - distSq / 8000;
            // Линии стали тоньше и слегка прозрачнее
            ctx.strokeStyle = `rgba(${rgbColor}, ${opacity * 0.35})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark, user?.role]);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 transition-colors duration-500" style={{ backgroundColor: isDark ? '#050509' : '#F4F7F9' }} />;
};

export default DynamicBackground;