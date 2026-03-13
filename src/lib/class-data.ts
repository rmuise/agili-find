/**
 * Official agility class/run types by organization.
 * Source: https://docs.google.com/spreadsheets/d/1OkzQ3IX95S0ofBC9R02LMpt_kgYRBjWwC1ecx5-8En8
 */

export interface ClassInfo {
  name: string;
  category: string;
  description: string;
}

export const CLASS_DATA: Record<string, ClassInfo[]> = {
  akc: [
    { name: "Standard", category: "Main Class", description: "Full course with all obstacle types including contacts and pause table" },
    { name: "Jumpers With Weaves", category: "Main Class", description: "Speed-focused class with no contacts or pause table" },
    { name: "FAST", category: "Main Class", description: "Point accumulation class with distance Send bonus sequence" },
    { name: "T2B", category: "Main Class", description: "Time 2 Beat — run against the clock, placement-based" },
    { name: "Premier Standard", category: "Premier Class", description: "More challenging course design for titled dogs" },
    { name: "Premier Jumpers", category: "Premier Class", description: "More challenging JWW-style course for titled dogs" },
  ],
  usdaa: [
    { name: "Standard Agility", category: "Main Class", description: "Full course testing all obstacles" },
    { name: "Jumpers", category: "Non-Standard Class", description: "Tests jumping ability, jumps and tunnels" },
    { name: "Gamblers", category: "Non-Standard Class", description: "Point accumulation with hazard obstacles" },
    { name: "Snooker", category: "Non-Standard Class", description: "Strategy-based, all obstacles" },
    { name: "Pairs Relay", category: "Non-Standard Class", description: "Two-dog team, combined levels allowed" },
    { name: "Grand Prix", category: "Tournament", description: "Flagship individual tournament" },
    { name: "Steeplechase", category: "Tournament", description: "Individual speed competition, jumps and tunnels" },
    { name: "DAM Team", category: "Tournament", description: "2-Dog or 3-Dog team competition" },
    { name: "Masters Challenge", category: "Tournament", description: "Two-round event for Masters-level dogs" },
  ],
  cpe: [
    { name: "Standard", category: "Main Class", description: "Full obstacle course" },
    { name: "Jumpers", category: "Game Class", description: "Set course of jumps and tunnels" },
    { name: "Colors", category: "Game Class", description: "Two overlapping courses, handler picks one" },
    { name: "Wildcard", category: "Game Class", description: "Short course with obstacle choices" },
    { name: "Snooker", category: "Game Class", description: "Point accumulation, strategy-based" },
    { name: "Jackpot", category: "Game Class", description: "Point accumulation with gamble (Gamblers)" },
    { name: "FullHouse", category: "Game Class", description: "Handler-designed course from available obstacles" },
  ],
  nadac: [
    { name: "Regular Agility", category: "Certification Class", description: "Numbered course with all NADAC obstacles" },
    { name: "Jumpers", category: "Certification Class", description: "Fast flowing course, jumps and tunnels" },
    { name: "Tunnelers", category: "Certification Class", description: "Course consisting of tunnels only" },
    { name: "Weavers", category: "Certification Class", description: "Course focused on weave poles and related obstacles" },
    { name: "Touch N Go", category: "Certification Class", description: "Contact obstacle focused, A-frame and dog walk" },
    { name: "Chances", category: "Certification Class", description: "Distance challenge course" },
    { name: "Gamblers", category: "Certification Class", description: "Point accumulation with all obstacles" },
    { name: "Barrelers", category: "Certification Class", description: "Course using barrels" },
    { name: "Hoopers", category: "Certification Class", description: "Course using hoops" },
  ],
  uki: [
    { name: "Agility", category: "Main Class", description: "Full course including jumps and A-frame" },
    { name: "Jumping", category: "Main Class", description: "Set numbered course, jumps and tunnels" },
    { name: "Speedstakes", category: "Main Class", description: "Fast and flowing, regular jumps" },
    { name: "Snooker", category: "Games Class", description: "Point accumulation, all obstacle types" },
    { name: "Gamblers", category: "Games Class", description: "Point accumulation, all obstacle types" },
    { name: "Snakes & Ladders", category: "Games Class", description: "Directional point-based, all obstacle types" },
    { name: "Power & Speed", category: "Games Class", description: "Two-segment class with contacts and weaves" },
  ],
  ckc: [
    { name: "Standard", category: "Main Class", description: "Full obstacle course with contacts" },
    { name: "Jumpers With Weaves", category: "Main Class", description: "Course with jumps and tunnels" },
    { name: "Points & Distance", category: "Game Class", description: "Gamblers-style, all obstacle types" },
    { name: "Steeplechase", category: "Tournament", description: "Fast-paced tournament, jumps and A-frame" },
  ],
  aac: [
    { name: "Standard", category: "Main Class", description: "Core AAC class, all obstacle types" },
    { name: "Jumpers", category: "Game Class", description: "Set course with jumps and tunnels" },
    { name: "Gamblers", category: "Game Class", description: "Point accumulation, all obstacle types" },
    { name: "Snooker", category: "Game Class", description: "Strategy and point-based" },
    { name: "Team Relay", category: "Game Class", description: "Multi-dog team event, 2+ dog teams" },
    { name: "International Biathlon", category: "Specialty Class", description: "Combined Agility round, open to all levels" },
  ],
};

/**
 * Get all class names for a given org, or all orgs if none specified.
 */
export function getClassesForOrgs(orgIds?: string[]): ClassInfo[] {
  if (!orgIds || orgIds.length === 0) {
    return Object.values(CLASS_DATA).flat();
  }
  return orgIds.flatMap((id) => CLASS_DATA[id] || []);
}

/**
 * Get a flat list of unique class names for given orgs.
 */
export function getClassNamesForOrgs(orgIds?: string[]): string[] {
  const classes = getClassesForOrgs(orgIds);
  return [...new Set(classes.map((c) => c.name))];
}
