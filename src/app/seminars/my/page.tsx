"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/lib/supabase/auth-context";

interface Seminar {
  id: string;
  title: string;
  instructor: string;
  start_date: string;
  end_date: string;
  venue_name: string;
  city: string;
  state: string;
  status: string;
  contact_url: string | null;
}

export default function MySeminarsPage() {
  const { user, isLoading: authLoading, supabase } = useAuth();
  const router = useRouter();
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    // Fetch user's own seminars via supabase client (RLS allows own rows)
    supabase
      .from("seminars")
      .select("id, title, instructor, start_date, end_date, venue_name, city, state, status, contact_url")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false })
      .then(({ data }) => {
        setSeminars((data as Seminar[]) || []);
        setIsLoading(false);
      });
  }, [user, supabase]);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/seminars/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSeminars((prev) => prev.filter((s) => s.id !== id));
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AF</span>
            </div>
            <span className="text-xl font-bold text-gray-900">AgiliFind</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Search
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              My Seminars
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {seminars.length} seminar{seminars.length !== 1 ? "s" : ""} submitted
            </p>
          </div>
          <Link
            href="/seminars/submit"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Submit new
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : seminars.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No seminars yet
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Submit a seminar to share it with the agility community.
            </p>
            <Link
              href="/seminars/submit"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Submit your first seminar
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {seminars.map((sem) => (
              <div
                key={sem.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white bg-indigo-500">
                      SEMINAR
                    </span>
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {sem.title}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        sem.status === "approved"
                          ? "text-green-700 bg-green-50"
                          : sem.status === "pending"
                          ? "text-yellow-700 bg-yellow-50"
                          : "text-red-700 bg-red-50"
                      }`}
                    >
                      {sem.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      {format(parseISO(sem.start_date), "MMM d, yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {sem.city}, {sem.state}
                    </span>
                    <span className="text-gray-500">
                      by {sem.instructor}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {sem.contact_url && (
                    <a
                      href={sem.contact_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-blue-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(sem.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                    title="Delete seminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
