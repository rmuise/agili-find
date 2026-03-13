"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  MapPin,
  Dog,
  Calendar,
  Star,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/lib/supabase/auth-context";
import { useToast } from "@/components/ui/toast";

interface ProfileData {
  id: string;
  display_name: string;
  bio: string | null;
  location: string | null;
  dogs: string | null;
  created_at: string;
}

interface Review {
  id: string;
  rating: number | null;
  comment: string | null;
  results: string | null;
  created_at: string;
  trials: {
    id: string;
    title: string;
    organization_id: string;
    start_date: string;
    city: string;
    state: string;
  };
}

export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setFollowers(data.followers);
          setFollowing(data.following);
          setIsFollowing(data.isFollowing);
          setReviews(data.reviews || []);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [userId]);

  const handleFollow = async () => {
    if (!user) {
      toast("Log in to follow handlers", "info");
      return;
    }

    if (isFollowing) {
      setIsFollowing(false);
      setFollowers((f) => f - 1);
      const res = await fetch("/api/follows", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ following_id: userId }),
      });
      if (!res.ok) {
        setIsFollowing(true);
        setFollowers((f) => f + 1);
        toast("Failed to unfollow", "error");
      }
    } else {
      setIsFollowing(true);
      setFollowers((f) => f + 1);
      const res = await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ following_id: userId }),
      });
      if (!res.ok) {
        setIsFollowing(false);
        setFollowers((f) => f - 1);
        toast("Failed to follow", "error");
      } else {
        toast("Following handler", "success");
      }
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h2>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700">
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id === userId;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader backLabel="Back" />

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-blue-600">
                  {(profile.display_name || "?")[0].toUpperCase()}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                {profile.display_name}
              </h1>
              {profile.bio && (
                <p className="text-sm text-gray-600 mt-1">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                {profile.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profile.location}
                  </span>
                )}
                {profile.dogs && (
                  <span className="inline-flex items-center gap-1">
                    <Dog className="h-3 w-3" />
                    {profile.dogs}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex gap-4 mt-3 text-sm">
                <span>
                  <strong className="text-gray-900">{followers}</strong>{" "}
                  <span className="text-gray-500">followers</span>
                </span>
                <span>
                  <strong className="text-gray-900">{following}</strong>{" "}
                  <span className="text-gray-500">following</span>
                </span>
              </div>
            </div>

            {!isOwnProfile && user && (
              <button
                onClick={handleFollow}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isFollowing
                    ? "text-gray-600 bg-gray-100 hover:bg-red-50 hover:text-red-600"
                    : "text-white bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="h-3.5 w-3.5" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    Follow
                  </>
                )}
              </button>
            )}

            {isOwnProfile && (
              <Link
                href="/settings"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Edit profile
              </Link>
            )}
          </div>
        </div>

        {/* Trial Reviews */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Trial Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">
                      {review.trials.organization_id}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {review.trials.title}
                    </span>
                  </div>
                  {review.rating && (
                    <div className="flex gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= review.rating!
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  {review.comment && (
                    <p className="text-sm text-gray-700 mb-1">{review.comment}</p>
                  )}
                  {review.results && (
                    <p className="text-xs text-gray-500">
                      Results: {review.results}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {review.trials.city}, {review.trials.state} &middot;{" "}
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
