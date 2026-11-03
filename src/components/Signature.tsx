import React, { useState, useEffect } from 'react';

interface SignatureProps {
  signatureUrl?: string;
  className?: string;
  onUploadSignature?: (url: string) => void;
  canUpload?: boolean;
  enlarged?: boolean;
}

export const Signature: React.FC<SignatureProps> = ({
  signatureUrl,
  className = '',
  onUploadSignature,
  canUpload = false,
  enlarged = false
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
          className={`h-9 md:h-11 w-auto max-w-[220px] object-contain filter contrast-200 pointer-events-none origin-center transition-transform duration-300 ease-out ${enlarged ? "scale-[3]" : "scale-100"}`}
        />
      ) : null}

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
