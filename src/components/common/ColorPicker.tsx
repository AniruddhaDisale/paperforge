import React, { useState, useRef, useEffect } from 'react';

const PRESET_COLORS = [
  '#09090b', // Charcoal black
  '#52525b', // Slate gray
  '#2563eb', // Blue
  '#059669', // Emerald green
  '#dc2626', // Red
  '#ea580c', // Orange
  '#ca8a04', // Amber/Yellow
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#ffffff', // White
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  title?: string;
  allowTransparent?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  title = 'Pick Color',
  allowTransparent = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const isTransparent = value === 'transparent';

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className="color-picker-trigger"
        style={{
          backgroundColor: isTransparent ? '#ffffff' : value,
          backgroundImage: isTransparent
            ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
            : undefined,
          backgroundSize: '6px 6px',
        }}
        onClick={() => setIsOpen(!isOpen)}
        title={title}
        aria-label={title}
      />

      {isOpen && (
        <div className="palette-popover">
          {allowTransparent && (
            <button
              type="button"
              className="palette-swatch"
              style={{
                background:
                  'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                backgroundSize: '6px 6px',
                border: isTransparent ? '2px solid var(--primary)' : '1px solid #d4d4d8',
              }}
              title="None (Transparent)"
              onClick={() => {
                onChange('transparent');
                setIsOpen(false);
              }}
            />
          )}

          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="palette-swatch"
              style={{
                backgroundColor: c,
                border: value === c ? '2px solid var(--accent-blue)' : '1px solid #d4d4d8',
              }}
              title={c}
              onClick={() => {
                onChange(c);
                setIsOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
