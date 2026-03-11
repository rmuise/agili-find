import { Search, MapPin, Calendar, Filter } from "lucide-react";

const ORGANIZATIONS = [
  { id: "akc", name: "AKC", color: "bg-blue-500" },
  { id: "usdaa", name: "USDAA", color: "bg-red-500" },
  { id: "cpe", name: "CPE", color: "bg-green-500" },
  { id: "nadac", name: "NADAC", color: "bg-purple-500" },
  { id: "uki", name: "UKI", color: "bg-orange-500" },
  { id: "ckc", name: "CKC", color: "bg-pink-500" },
];

const RADIUS_OPTIONS = [
  { value: "25", label: "25 mi" },
  { value: "50", label: "50 mi" },
  { value: "100", label: "100 mi" },
  { value: "200", label: "200 mi" },
  { value: "any", label: "Any" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AF</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">AgiliFind</h1>
          </div>
          <p className="text-sm text-gray-500 hidden sm:block">
            Search agility trials across all organizations
          </p>
        </div>
      </header>

      {/* Hero / Search Section */}
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Find Your Next Agility Trial
            </h2>
            <p className="text-gray-600">
              Search upcoming trials from AKC, USDAA, CPE, NADAC, UKI, and CKC
              in one place.
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            {/* Location + Radius Row */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="City, state, or zip code..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <select className="px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                {RADIUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Organization Filters */}
            <div className="flex flex-wrap gap-2">
              {ORGANIZATIONS.map((org) => (
                <label
                  key={org.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    className={`w-2 h-2 rounded-full ${org.color}`}
                  ></span>
                  <span className="text-sm font-medium text-gray-700">
                    {org.name}
                  </span>
                </label>
              ))}
            </div>

            {/* Date Range + Judge + Search */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Judge name..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Enter a location to search for upcoming trials
          </p>
          <div className="flex gap-1 bg-gray-200 rounded-lg p-1">
            <button className="px-4 py-2 text-sm font-medium rounded-md bg-white shadow-sm">
              List
            </button>
            <button className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900">
              Map
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Search for agility trials
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Enter your location and set your search radius to find upcoming dog
            agility trials near you across all major organizations.
          </p>
        </div>
      </div>
    </div>
  );
}
