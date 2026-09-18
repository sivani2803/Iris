import React, { useEffect, useRef } from 'react';
import { useTelemetryStore } from '../../store/useTelemetryStore';

export default function PulseWaveCanvas({ width = 320, height = 70, strokeColor = '#0d9488' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      const history = useTelemetryStore.getState().history;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle grid line
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw pulse curve
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      const step = width / (history.length - 1);
      history.forEach((pt, i) => {
        // Map HR 45..175 to Canvas height
        const clampedHR = Math.max(45, Math.min(175, pt.heartRate));
        const normalizedY = height - ((clampedHR - 45) / (175 - 45)) * (height - 12) - 6;

        if (i === 0) ctx.moveTo(0, normalizedY);
        else ctx.lineTo(i * step, normalizedY);
      });
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [width, height, strokeColor]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full rounded-xl"
    />
  );
}
