import { useState } from "react";
import AdminNav from '../components/AdminNav';

const reviewsData = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    email: "juan@gmail.com",
    date: "February 20, 2026",
    rating: 5,
    review: "Sobrang ganda ng product na ito!",
    status: "Published",
    product: "Organic Barley",
    adminReply: "Salamat po sa inyong feedback, juan! Natutuwa kaming maranasan ninyo ang benepisyo ng aming Organic Barley. Hanggang sa susunod!",
  },
  {
    id: 2,
    name: "Juan Dela Cruz",
    email: "juan@gmail.com",
    date: "February 20, 2026",
    rating: 2,
    review: "Disappointed with this order. Some items were missing from the bundle and the folder quality was not as pictured.",
    status: "Pending",
    product: "Office Bundle",
    adminReply: null,
  },
  {
    id: 3,
    name: "Maria Santos",
    email: "maria@gmail.com",
    date: "February 18, 2026",
    rating: 4,
    review: "Maganda ang quality ng product. Mabilis din ang delivery. Highly recommended!",
    status: "Published",
    product: "A4 Bondpaper",
    adminReply: "Maraming salamat po, Maria! Masaya kaming nagustuhan ninyo ang aming produkto.",
  },
];

const statCards = [
  { label: "Total Reviews",  value: 12,    color: "bg-blue-50",   accent: "text-blue-600",   icon: "⭐" },
  { label: "Average Rating", value: "3.8", color: "bg-amber-50",  accent: "text-amber-600",  icon: "📊", sub: "out of 5" },
  { label: "Published",      value: 1,     color: "bg-emerald-50",accent: "text-emerald-600",icon: "✅" },
  { label: "Pending",        value: 1,     color: "bg-red-50",    accent: "text-red-600",    icon: "⏳" },
];

function StarRating({ rating, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`text-sm ${i < rating ? "text-amber-400" : "text-gray-300"}`}>★</span>
      ))}
    </div>
  );
}

const statusConfig = {
  Published: "bg-[#C6FFC9] border border-[#76CD8C] text-[#247132]",
  Pending:   "bg-gray-200 border border-[#DFDFDF] text-gray-700",
};

export default function AdminReviews() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab]     = useState("All");
  const [replyingTo, setReplyingTo]   = useState(null);
  const [replyText, setReplyText]     = useState("");

  const tabs = ["All", "Pending", "Published"];

  const filtered =
    activeTab === "All"
      ? reviewsData
      : reviewsData.filter((r) => r.status === activeTab);

  return (
    <div className="flex min-h-screen bg-[#F0F7F2] font-sans">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 px-6 py-7 overflow-x-hidden min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden bg-transparent border-none text-[22px] cursor-pointer text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >☰</button>
            <h1 className="text-xl font-bold text-gray-900 m-0">Reviews</h1>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-3.5 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {statCards.map((s) => (
            <div key={s.label} className="bg-white rounded-xl px-4 py-4 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-[11px] text-gray-400 mb-1">{s.label}</div>
                <div className={`text-[22px] font-bold ${s.accent}`}>{s.value}</div>
                {s.sub && <div className="text-[11px] text-gray-400">{s.sub}</div>}
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-lg`}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg border-none text-xs font-medium cursor-pointer transition-all
                  ${isActive
                    ? "bg-gray-900 text-white shadow-none"
                    : "bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                  }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Date separator */}
        <div className="flex items-center gap-3 mb-3.5">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Friday, February 20, 2025</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Review Cards */}
        <div className="flex flex-col gap-4">
          {filtered.map((review) => (
            <div
              key={review.id}
              className="bg-white/90 rounded-xl border border-gray-200 px-5 py-4 shadow-sm"
            >
              {/* Header row */}
              <div className="flex items-start justify-between flex-wrap gap-2.5 mb-2.5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {review.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{review.name}</div>
                    <div className="text-[11px] text-gray-400">{review.email} · {review.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <StarRating rating={review.rating} />
                  <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${statusConfig[review.status]}`}>
                    {review.status}
                  </span>
                </div>
              </div>

              {/* Product tag */}
              <div className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[rgba(77,123,101,0.12)] border border-[rgba(77,123,101,0.3)] text-gray-700 mb-2">
                📦 {review.product}
              </div>

              {/* Review text */}
              <p className="text-xs text-gray-700 font-medium m-0 mb-3 leading-relaxed">
                {review.review}
              </p>

              {/* Admin reply */}
              {review.adminReply && (
                <div className="bg-gray-50 rounded-lg px-3.5 py-3 mb-3 border-l-[3px] border-blue-600">
                  <div className="text-[11px] font-semibold text-blue-600 mb-1">Admin Reply</div>
                  <p className="text-xs text-gray-600 m-0 leading-relaxed">{review.adminReply}</p>
                </div>
              )}

              {/* Reply input */}
              {replyingTo === review.id && (
                <div className="mb-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-700 resize-y outline-none font-[inherit] focus:border-blue-400 transition-colors"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => { setReplyingTo(null); setReplyText(""); }}
                      className="px-4 py-1.5 rounded-md border border-gray-300 bg-blue-600 text-white text-xs cursor-pointer font-medium hover:bg-blue-700 transition-colors"
                    >
                      Submit Reply
                    </button>
                    <button
                      onClick={() => { setReplyingTo(null); setReplyText(""); }}
                      className="px-4 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 text-xs cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Action row */}
              <div className="flex items-center gap-2 flex-wrap">
                {review.adminReply ? (
                  <button
                    onClick={() => { setReplyingTo(review.id); setReplyText(review.adminReply); }}
                    className="px-3.5 py-1 rounded-md border border-gray-300 bg-white text-gray-700 text-xs cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    Edit Reply
                  </button>
                ) : (
                  <button
                    onClick={() => setReplyingTo(review.id)}
                    className="px-3.5 py-1 rounded-md border border-gray-300 bg-white text-gray-700 text-xs cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    Reply
                  </button>
                )}
                <button className="px-3.5 py-1 rounded-md border border-[#C90000] bg-white text-[#9F0712] text-xs cursor-pointer hover:bg-red-50 transition-colors">
                  Delete
                </button>
                <span className="ml-auto text-xs text-gray-400 font-medium">
                  Rating:{" "}
                  <span className={`font-semibold ${review.rating >= 4 ? "text-amber-500" : "text-red-700"}`}>
                    {review.rating}/5
                  </span>
                </span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm shadow-sm">
              No reviews found.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-5 text-xs text-gray-400">
          <span>Showing {filtered.length} review{filtered.length !== 1 ? "s" : ""}</span>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                className={`w-7 h-7 rounded-md text-xs font-medium cursor-pointer transition-colors
                  ${p === 1
                    ? "bg-blue-600 text-white border-none"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}