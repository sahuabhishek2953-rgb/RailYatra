import React, { useState } from 'react';
import { X, Copy, Check, Share2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainId: string;
  trainName: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, trainId, trainName }) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen && trainId) {
      setLoading(true);
      fetch('/api/v1/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainId })
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setShareUrl(`${window.location.origin}/share/${json.data.token}`);
          } else {
            setShareUrl(window.location.href);
          }
        })
        .catch(() => setShareUrl(window.location.href))
        .finally(() => setLoading(false));
    }
  }, [isOpen, trainId]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Live journey link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F6EF7]/10 text-[#4F6EF7]">
              <Share2 className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-lg font-bold text-gray-900">Share Live Journey</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Anyone with this link can view the live location, ETA, current station, and interactive map for <strong className="text-gray-900">{trainName}</strong> without logging in.
        </p>

        {/* Share Link Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              readOnly
              value={loading ? 'Generating share link...' : shareUrl}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 font-mono text-xs text-gray-700 focus:outline-none"
            />
            <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>

          <button
            onClick={handleCopy}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 transition-colors shrink-0 shadow-sm"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="text-[11px] text-gray-400 text-center">
          Share link expires automatically after 7 days.
        </div>
      </div>
    </div>
  );
};
