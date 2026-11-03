import React, { useState, useEffect } from 'react';

interface SignatureProps {
  signatureUrl?: string;
  className?: string;
  onUploadSignature?: (url: string) => void;
  canUpload?: boolean;
}

export const Signature: React.FC<SignatureProps> = ({
  signatureUrl,
  className = '',
  onUploadSignature,
  canUpload = false
}) => {
  const [activeUrl, setActiveUrl] = useState<string | null>(() => {
    return signatureUrl || localStorage.getItem('portfolio_signature_url') || null;
  });

  useEffect(() => {
    if (signatureUrl) {
      setActiveUrl(signatureUrl);
    } else {
      const stored = localStorage.getItem('portfolio_signature_url');
      if (stored) setActiveUrl(stored);
    }
  }, [signatureUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setActiveUrl(result);
      localStorage.setItem('portfolio_signature_url', result);
      if (onUploadSignature) {
        onUploadSignature(result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none mix-blend-exclusion group pointer-events-auto ${className}`}
      title="Munkherdene Signature"
    >
      {activeUrl ? (
        <img
          src={activeUrl}
          alt="Signature"
          className="h-9 md:h-11 w-auto max-w-[220px] object-contain filter contrast-200 pointer-events-none"
        />
      ) : (
        /* Artistic handwritten cursive vector signature for Munkherdene */
        <svg
          viewBox="0 0 280 70"
          className="h-9 md:h-11 w-auto max-w-[240px] overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main cursive strokes for Munkherdene */}
          <path
            d="M 12 52 C 16 38, 22 16, 26 12 C 29 9, 34 24, 38 42 C 42 22, 48 15, 52 14 C 56 13, 60 28, 62 40 C 64 25, 71 20, 77 22 C 81 23, 83 36, 84 41 C 86 31, 91 22, 98 21 C 103 20, 105 32, 106 39 C 109 23, 115 15, 120 18 C 124 20, 126 31, 127 39 C 130 25, 137 20, 143 22 C 148 24, 150 35, 151 40 C 153 28, 158 21, 165 21 C 172 21, 175 32, 176 39 C 180 26, 187 22, 194 23 C 201 24, 203 36, 204 42 C 208 30, 215 24, 222 25 C 228 26, 231 34, 235 44"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Characteristic artistic fluid loop and dynamic underline flourish */}
          <path
            d="M 235 44 C 245 42, 260 30, 268 18 C 271 14, 266 10, 258 13 C 242 20, 190 48, 140 56 C 90 64, 35 60, 15 54 C 8 52, 18 46, 32 45 C 75 42, 155 46, 210 50 C 235 52, 258 52, 272 50"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Subtle accent flourish */}
          <circle cx="120" cy="11" r="1.5" fill="#ffffff" />
        </svg>
      )}

      {/* Optional upload trigger for owner in admin or preview */}
      {canUpload && (
        <label
          htmlFor="signature-upload-input"
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer shrink-0 shadow-sm whitespace-nowrap"
        >
          Change Signature
          <input
            id="signature-upload-input"
            type="file"
            accept="image/png,image/svg+xml,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      )}
    </div>
  );
};

export default Signature;
