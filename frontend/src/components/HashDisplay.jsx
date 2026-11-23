import { Check, X, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HashDisplay({ hash, verified, truncate = false, className = '' }) {
  if (!hash) return <span className="text-[#5a5e72] font-mono text-sm">No hash available</span>;

  const displayHash = truncate && hash.length > 24 
    ? `${hash.substring(0, 16)}...${hash.substring(hash.length - 8)}`
    : hash;

  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    toast.success('Hash copied to clipboard');
  };

  return (
    <div className={`flex items-center gap-2 group ${className}`} title={truncate ? hash : undefined}>
      <span className="font-mono text-sm text-[#e2e4e9] bg-[#0a0b0f] px-2 py-1 rounded border border-[#2a2d38]">
        {displayHash}
      </span>
      {verified !== undefined && (
        verified ? (
          <Check className="w-4 h-4 text-[#22c55e]" />
        ) : (
          <X className="w-4 h-4 text-[#ef4444]" />
        )
      )}
      <button 
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#2a2d38] rounded text-[#8b8fa3]"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
