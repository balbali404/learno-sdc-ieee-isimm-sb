import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-5">
        <Construction className="w-8 h-8 text-teal-400" />
      </div>
      <h2 className="text-gray-700 mb-2" style={{ fontWeight: 700, fontSize: "1.25rem" }}>{title}</h2>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed">{description}</p>
      <div className="mt-6 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-blue-500 text-white text-sm rounded-xl cursor-pointer hover:opacity-90 transition-opacity shadow-sm shadow-teal-200" style={{ fontWeight: 600 }}>
        Coming Soon
      </div>
    </div>
  );
}
