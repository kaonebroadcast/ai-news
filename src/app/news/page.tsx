"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type NewsDoc = {
  _id: { $oid?: string } | string;
  title: string;
  category?: string;
  location?: string;
  brief?: string;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function getId(id: NewsDoc["_id"]): string {
  return typeof id === "string" ? id : id?.$oid || "";
}

export default function NewsListPage() {
  const [data, setData] = useState<Paginated<NewsDoc>>({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateInstructions, setUpdateInstructions] = useState("");
  const [updateApplying, setUpdateApplying] = useState(false);

  const fetchPage = useMemo(
    () => async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/news?page=${p}&pageSize=${pageSize}`);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const j = (await res.json()) as Paginated<NewsDoc>;
        setData(j);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this news item?")) return;
    const res = await fetch(`/api/news/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchPage(page);
    }
  }

  async function handleAiUpdate() {
    if (!updatingId) return;
    setUpdateApplying(true);
    try {
      const res = await fetch(`/api/news/${updatingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: updateInstructions }),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      // Refresh list to reflect updated Gujarati title/content
      await fetchPage(page);
      setUpdatingId(null);
      setUpdateInstructions("");
    } catch (e) {
      console.error(e);
    } finally {
      setUpdateApplying(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-red-50">
        <h1 className="text-2xl font-semibold text-gray-900">News History</h1>
        <Link 
          href="/news/new" 
          className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 font-medium"
        >
          New Report
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map((item) => (
            <div
              key={getId(item._id)}
              className="bg-white border border-red-50 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-semibold text-gray-900">{item.title}</h2>
                    {item.category && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                        {item.category}
                      </span>
                    )}
                  </div>
                  
                  {item.location && (
                    <div className="flex items-center mt-1 text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {item.location}
                    </div>
                  )}
                  
                  {item.brief && (
                    <p className="mt-3 text-gray-700">{item.brief}</p>
                  )}
                </div>
                
                <div className="flex space-x-3 ml-4">
                  <Link
                    href={`/news/${getId(item._id)}`}
                    className="px-3 py-1.5 bg-white border border-red-600 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(getId(item._id))}
                    className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {updatingId === getId(item._id) && (
                <div className="mt-4 pt-4 border-t border-red-100 space-y-3">
                  <textarea
                    value={updateInstructions}
                    onChange={(e) => setUpdateInstructions(e.target.value)}
                    className="w-full p-3 border border-red-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter update instructions..."
                    rows={3}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAiUpdate}
                      disabled={updateApplying}
                      className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {updateApplying ? 'Updating...' : 'Update with AI'}
                    </button>
                    <button
                      onClick={() => {
                        setUpdatingId(null);
                        setUpdateInstructions('');
                      }}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-4 mt-8">
        <button 
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            page <= 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-red-300 text-red-600 hover:bg-red-50'
          } transition-colors duration-200`}
          disabled={page <= 1} 
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <span className="text-sm text-gray-700">
          Page <span className="font-medium">{data.page}</span> of {data.totalPages}
        </span>
        <button 
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            page >= data.totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-red-300 text-red-600 hover:bg-red-50'
          } transition-colors duration-200`}
          disabled={page >= data.totalPages} 
          onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
        >
          Next
        </button>
      </div>

      {updatingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background text-foreground w-full max-w-lg rounded p-4 space-y-3">
            <h3 className="text-lg font-medium">AI Update Instructions</h3>
            <textarea
              className="w-full border rounded px-3 py-2 bg-transparent min-h-[140px]"
              placeholder="Example: Improve clarity of the third paragraph and include the latest official statement."
              value={updateInstructions}
              onChange={(e) => setUpdateInstructions(e.target.value)}
            />
            <div className="flex items-center gap-2 justify-end">
              <button className="px-3 py-1 border rounded" onClick={() => !updateApplying && setUpdatingId(null)} disabled={updateApplying}>
                Cancel
              </button>
              {updateApplying ? (
                <span className="text-sm text-gray-500">Applying...</span>
              ) : (
                <button className="px-3 py-1 rounded bg-foreground text-background" onClick={handleAiUpdate} disabled={updateApplying}>
                  Apply
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
