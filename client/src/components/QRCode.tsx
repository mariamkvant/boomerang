import React, { useEffect, useRef } from 'react';

// Minimal QR code generator using canvas — no external deps
export default function QRCode({ url, size = 150, caption = 'Scan to view profile' }: { url: string; size?: number; caption?: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    // Use the QR code API for simplicity
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
      }
    };
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=f97316`;
  }, [url, size]);

  return (
    <div className="inline-block bg-white p-3 rounded-xl shadow-card">
      <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />
      {caption && <p className="text-[10px] text-gray-400 text-center mt-1">{caption}</p>}
    </div>
  );
}
