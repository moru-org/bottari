import Link from "next/link";
import { Eye, Users, Share2 } from "lucide-react";

interface PackCardProps {
  pack: {
    id: string;
    slug: string;
    title: string;
    type: string;
    createdAt: string;
    _count?: { submissions: number };
  };
}

export default function StatsCard({ pack }: PackCardProps) {
  return (
    <Link href={`/my/${pack.slug}`} className="block">
      <div className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] hover:border-[#FF6B35]/40 transition-all">
        <h3 className="font-bold text-white mb-2 line-clamp-1">{pack.title}</h3>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{pack._count?.submissions || 0}</span>
            </span>
          </div>
          <Share2 className="w-3 h-3 text-[#FFA834]" />
        </div>
      </div>
    </Link>
  );
}
