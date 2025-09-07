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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-900">News History</h1>
            <p className="mt-2 text-sm text-gray-600">Browse and manage all news reports</p>
          </div>
          <Link 
            href="/news/new" 
            className="w-full md:w-auto flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Report
          </Link>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
          </div>
        ) : data.items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No news reports</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new report.</p>
            <div className="mt-6">
              <Link
                href="/news/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Report
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => (
              <div
                key={getId(item._id)}
                className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100 flex flex-col h-full"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-semibold text-gray-900 leading-tight line-clamp-2">
                        {item.title}
                      </h2>
                      {item.category && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2">
                          {item.category}
                        </span>
                      )}
                    </div>
                    
                    <div className="ml-2 flex-shrink-0 flex">
                      <button
                        onClick={() => handleDelete(getId(item._id))}
                        className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
                        title="Delete"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {item.location && (
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}
                  
                  {item.brief && (
                    <p className="text-gray-700 mb-4 line-clamp-3">{item.brief}</p>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <Link
                        href={`/news/${getId(item._id)}`}
                        className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-700 group-hover:underline"
                      >
                        Read more
                        <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
                
                {updatingId === getId(item._id) && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <textarea
                      value={updateInstructions}
                      onChange={(e) => setUpdateInstructions(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter update instructions..."
                      rows={2}
                    />
                    <div className="mt-2 flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setUpdatingId(null);
                          setUpdateInstructions('');
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAiUpdate}
                        disabled={updateApplying || !updateInstructions.trim()}
                        className={`px-3 py-1.5 text-sm font-medium text-white rounded-md ${
                          updateApplying || !updateInstructions.trim()
                            ? 'bg-red-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {updateApplying ? 'Updating...' : 'Update with AI'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-lg">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                  page <= 1 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                  page >= data.totalPages ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * pageSize, data.total)}
                  </span>{' '}
                  of <span className="font-medium">{data.total}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                      page <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    // Calculate page numbers to show (current page in the middle when possible)
                    let pageNum;
                    if (data.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= data.totalPages - 2) {
                      pageNum = data.totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          page === pageNum
                            ? 'z-10 bg-red-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page >= data.totalPages}
                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                      page >= data.totalPages ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {updatingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-lg p-6 space-y-4 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900">AI Update Instructions</h3>
            <textarea
              className="w-full border border-gray-300 rounded-md px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent min-h-[140px] text-gray-700"
              placeholder="Example: Improve clarity of the third paragraph and include the latest official statement."
              value={updateInstructions}
              onChange={(e) => setUpdateInstructions(e.target.value)}
            />
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                onClick={() => setUpdatingId(null)} 
                disabled={updateApplying}
              >
                Cancel
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                  updateApplying || !updateInstructions.trim()
                    ? 'bg-red-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                onClick={handleAiUpdate}
                disabled={updateApplying || !updateInstructions.trim()}
              >
                {updateApplying ? 'Applying...' : 'Apply Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
