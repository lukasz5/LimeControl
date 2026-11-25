import React, { useMemo } from 'react';
import qrcode from 'qrcode-generator';

/** Kod QR jako jedna ścieżka SVG (bez wstawiania HTML z biblioteki). */
export const QrSvg: React.FC<{ value: string; label: string; className?: string }> = ({ value, label, className = 'h-44 w-44' }) => {
  const { size, path } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    let d = '';
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) d += `M${col + 4} ${row + 4}h1v1h-1z`;
      }
    }
    return { size: count + 8, path: d };
  }, [value]);
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      className={`${className} rounded-xl bg-white`}
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  );
};
