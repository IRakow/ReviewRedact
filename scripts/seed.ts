import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { resolve } from "path"

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Seed Data ────────────────────────────────────────────────────────────────

const owners = [
  {
    name: "Ian Rakow",
    email: "ian@cyberactiveconsulting.com",
    cell: "3145551000",
    pin_code: "000001",
    company: "Business Threat Solutions",
    address: "100 N Broadway, Suite 2000, St. Louis, MO 63102",
    tax_id_1099: null,
    base_rate_google: 850,
    base_rate_facebook: 500,
    role: "owner" as const,
    is_active: true,
  },
  {
    name: "Blair Stover",
    email: "abstoverkm@aol.com",
    cell: "3145552000",
    pin_code: "000002",
    company: "Business Threat Solutions",
    address: "100 N Broadway, Suite 2000, St. Louis, MO 63102",
    tax_id_1099: null,
    base_rate_google: 850,
    base_rate_facebook: 500,
    role: "owner" as const,
    is_active: true,
  },
  {
    name: "Victor Kawana",
    email: "vkawana@krusemennillo.com",
    cell: "3145553000",
    pin_code: "000003",
    company: "Business Threat Solutions",
    address: "100 N Broadway, Suite 2000, St. Louis, MO 63102",
    tax_id_1099: null,
    base_rate_google: 850,
    base_rate_facebook: 500,
    role: "owner" as const,
    is_active: true,
  },
]

const resellers = [
  {
    name: "Alex Thompson",
    email: "alex@thompsondigital.io",
    cell: "4155559201",
    pin_code: "123456",
    company: "Thompson Digital",
    address: "450 Sutter St, Suite 1100, San Francisco, CA 94108",
    tax_id_1099: "82-4571923",
    base_rate_google: 850,
    base_rate_facebook: 500,
    role: "reseller" as const,
    is_active: true,
    commission_plan_type: "fixed" as const,
    commission_plan_config: {},
  },
  {
    name: "Sarah Chen",
    email: "sarah@chenmarketinggroup.com",
    cell: "2125558734",
    pin_code: "654321",
    company: "Chen Marketing Group",
    address: "220 E 42nd St, Floor 25, New York, NY 10017",
    tax_id_1099: "37-9182645",
    base_rate_google: 850,
    base_rate_facebook: 500,
    role: "reseller" as const,
    is_active: true,
    commission_plan_type: "base_split" as const,
    commission_plan_config: { split_sp_pct: 60 },
  },
]

// Salespeople under resellers
const resellerSalespeople = [
  {
    name: "Mike Rivera",
    email: "mike@thompsondigital.io",
    cell: "4155559301",
    pin_code: "111111",
    company: "Thompson Digital",
    parent_type: "reseller" as const,
    pricing_plan: "reseller_set" as const,
    base_rate_google: 1000,
    display_price_google: 1600,
    reseller_key: "alex", // maps to Alex Thompson
  },
  {
    name: "Jessica Park",
    email: "jessica@thompsondigital.io",
    cell: "4155559302",
    pin_code: "222222",
    company: "Thompson Digital",
    parent_type: "reseller" as const,
    pricing_plan: "reseller_set" as const,
    base_rate_google: 1100,
    display_price_google: 1800,
    reseller_key: "alex",
  },
  {
    name: "David Okafor",
    email: "david@chenmarketinggroup.com",
    cell: "2125558801",
    pin_code: "333333",
    company: "Chen Marketing Group",
    parent_type: "reseller" as const,
    pricing_plan: "reseller_set" as const,
    base_rate_google: 1000,
    display_price_google: 1500,
    reseller_key: "sarah",
  },
]

// Owner-direct salespeople
const directSalespeople = [
  {
    name: "Carlos Mendez",
    email: "carlos@mendezgroup.com",
    cell: "7135559100",
    pin_code: "444444",
    company: "Mendez Group",
    parent_type: "owner" as const,
    pricing_plan: "owner_plan_a" as const, // $750 flat, max $1K
    base_rate_google: 750,
    display_price_google: 1000,
  },
  {
    name: "Natalie Brooks",
    email: "natalie@brooksadvisory.com",
    cell: "3035559200",
    pin_code: "555555",
    company: "Brooks Advisory",
    parent_type: "owner" as const,
    pricing_plan: "owner_plan_b" as const, // $1K base, keep above
    base_rate_google: 1000,
    display_price_google: 2000,
  },
]

interface ClientSeed {
  business_name: string
  owner_name: string
  address: string
  business_phone: string
  owner_phone: string
  owner_email: string
  google_url: string
  status: "active"
  notes: string | null
  reseller_key: string
  salesperson_key?: string // optional — if set, links to a salesperson
  business_type: string
}

const clientSeeds: ClientSeed[] = [
  {
    business_name: "Riverside Plumbing & Heating",
    owner_name: "Frank Deluca",
    address: "2847 Mission Blvd, Fremont, CA 94539",
    business_phone: "5105553890",
    owner_phone: "5105553891",
    owner_email: "frank@riversideplumbing.net",
    google_url: "https://maps.google.com/?cid=12345678901234567890",
    status: "active",
    notes: "Referred by local chamber of commerce. Multiple negative reviews from competitor.",
    reseller_key: "alex",
    salesperson_key: "mike",
    business_type: "plumbing",
  },
  {
    business_name: "Golden Gate Auto Repair",
    owner_name: "Tony Marchetti",
    address: "1520 Van Ness Ave, San Francisco, CA 94109",
    business_phone: "4155557422",
    owner_phone: "4155557423",
    owner_email: "tony@goldengateauto.com",
    google_url: "https://maps.google.com/?cid=23456789012345678901",
    status: "active",
    notes: "Family-owned shop, hit with fake reviews after refusing to do free warranty work.",
    reseller_key: "alex",
    business_type: "auto",
  },
  {
    business_name: "Bella Notte Ristorante",
    owner_name: "Maria Rossi",
    address: "178 Mulberry St, New York, NY 10013",
    business_phone: "2125559017",
    owner_phone: "2125559018",
    owner_email: "maria@bellanotte.nyc",
    google_url: "https://maps.google.com/?cid=34567890123456789012",
    status: "active",
    notes: "Fine dining establishment. Disgruntled ex-employee left multiple negative reviews.",
    reseller_key: "sarah",
    salesperson_key: "david",
    business_type: "restaurant",
  },
  {
    business_name: "Park Avenue Dental Associates",
    owner_name: "Dr. Rebecca Hartman",
    address: "635 Park Ave, Suite 2B, New York, NY 10065",
    business_phone: "2125554601",
    owner_phone: "2125554602",
    owner_email: "dr.hartman@parkavenuedental.com",
    google_url: "https://maps.google.com/?cid=45678901234567890123",
    status: "active",
    notes: "High-end dental practice. Competitor running smear campaign.",
    reseller_key: "sarah",
    business_type: "dental",
  },
]

// Reviews organized by business type (keeping same realistic data)
const reviewsByType: Record<string, Array<{ star: number; name: string; text: string; daysAgo: number }>> = {
  plumbing: [
    { star: 1, name: "Karen Mitchell", text: "Called for an emergency leak at 6 PM and they said they couldn't come until morning. My kitchen flooded overnight. Absolutely useless when you need them most.", daysAgo: 12 },
    { star: 1, name: "Greg Paulson", text: "They replaced my water heater and it stopped working after two weeks. When I called back they tried to charge me again for the service call. Total scam.", daysAgo: 28 },
    { star: 1, name: "Debra Hanson", text: "The plumber tracked mud all through my house and didn't even fix the problem. I had to call another company to actually get the job done.", daysAgo: 45 },
    { star: 2, name: "Steve Olsen", text: "Showed up late, overcharged for basic work. The fix held for about a month before the same pipe started leaking again.", daysAgo: 60 },
    { star: 5, name: "Angela Stewart", text: "Frank and his crew were fantastic. Replumbed our entire basement in two days. Clean, professional, and reasonably priced.", daysAgo: 160 },
    { star: 4, name: "Robert Chen", text: "Decent work overall. They fixed a tricky drain issue that two other plumbers couldn't figure out.", daysAgo: 145 },
    { star: 5, name: "Mark Johnson", text: "These guys saved us during a pipe burst at 2 AM. Showed up fast, fixed it right, and were incredibly professional.", daysAgo: 200 },
    { star: 3, name: "David Kim", text: "Average service. Nothing spectacular but they got the job done.", daysAgo: 175 },
    { star: 1, name: "Nancy Williams", text: "DO NOT USE THIS COMPANY. They installed a hot water heater incorrectly, causing a leak that damaged my ceiling.", daysAgo: 190 },
    { star: 5, name: "Sandra Lee", text: "Excellent work on our whole-house repiping project. Frank's team was organized, fast, and left our home spotless.", daysAgo: 285 },
  ],
  auto: [
    { star: 1, name: "Rachel Green", text: "They told me I needed a new transmission for $4,500. Took it to another shop and it was just a solenoid — $300 fix.", daysAgo: 8 },
    { star: 1, name: "Mike Patterson", text: "Left my car there for an oil change and they kept it for THREE DAYS without calling.", daysAgo: 22 },
    { star: 2, name: "Jennifer Walsh", text: "Overpriced for the area. Charged me $120 for a diagnostic fee and then wanted $800 for brakes.", daysAgo: 38 },
    { star: 5, name: "William Davis", text: "Tony and his team are the real deal. Honest, fair pricing, and they actually explain what's wrong.", daysAgo: 108 },
    { star: 4, name: "Kevin Park", text: "Solid shop. They diagnosed an electrical issue that stumped two other mechanics.", daysAgo: 138 },
    { star: 5, name: "Dan O'Brien", text: "Been bringing my cars here for five years. Always honest, always fair.", daysAgo: 168 },
    { star: 1, name: "Megan Torres", text: "They broke my AC compressor during an unrelated repair and wanted to charge me to fix it.", daysAgo: 185 },
    { star: 5, name: "Olivia Martin", text: "Tony's shop is a gem. Treated me with respect — no condescension, just honest assessments.", daysAgo: 248 },
    { star: 3, name: "Jessica Lee", text: "Decent work but communication is terrible. I never know when my car will actually be ready.", daysAgo: 280 },
    { star: 4, name: "Nathan Hall", text: "Great brake job. Smooth, quiet, and priced competitively.", daysAgo: 300 },
  ],
  restaurant: [
    { star: 1, name: "Bradley Cooper", text: "Found a hair in my pasta and when I told the waiter, the manager rolled her eyes.", daysAgo: 5 },
    { star: 1, name: "Samantha Blake", text: "Reservation for 7 PM, wasn't seated until 8:15. No explanation, no apology.", daysAgo: 18 },
    { star: 2, name: "Victor Hernandez", text: "The ambiance is lovely but the food does not justify the price tag.", daysAgo: 32 },
    { star: 5, name: "Isabella Fontaine", text: "Absolutely magical dining experience. Maria came to our table personally to recommend dishes.", daysAgo: 105 },
    { star: 4, name: "Diana Cho", text: "Wonderful Italian cuisine with an authentic feel. The homemade gnocchi is a must-try.", daysAgo: 135 },
    { star: 5, name: "Eleanor Vance", text: "A true Little Italy treasure. Every dish is made with love and the best ingredients.", daysAgo: 162 },
    { star: 1, name: "Frank Russo", text: "I'm Italian and this is NOT authentic Italian food. It's Olive Garden with triple the prices.", daysAgo: 178 },
    { star: 4, name: "Priya Sharma", text: "Beautiful restaurant with genuinely delicious food. The wine pairings were excellent.", daysAgo: 192 },
    { star: 5, name: "Catherine Reeves", text: "Perfection on a plate. The tasting menu with wine pairings was a journey through Italy.", daysAgo: 290 },
    { star: 1, name: "Derek Washington", text: "Waited 45 minutes for an appetizer. The manager was defensive instead of helpful.", daysAgo: 240 },
  ],
  dental: [
    { star: 1, name: "Monica Fields", text: "Dr. Hartman pushed for an expensive crown when I clearly just needed a filling.", daysAgo: 10 },
    { star: 1, name: "Bruce Wayne", text: "The hygienist was rough and the office charged my insurance for services that weren't performed.", daysAgo: 25 },
    { star: 2, name: "Tanya Richardson", text: "Long wait times even with an appointment. 40 minutes behind schedule every visit.", daysAgo: 40 },
    { star: 5, name: "James Whitaker", text: "Dr. Hartman is the best dentist I've ever had. She completely rebuilt my smile.", daysAgo: 115 },
    { star: 4, name: "Edward Kim", text: "Excellent dental care in a comfortable, modern office. Dr. Hartman is thorough.", daysAgo: 145 },
    { star: 5, name: "Raymond Patel", text: "Terrified of dentists my entire life. Dr. Hartman made me feel completely at ease.", daysAgo: 175 },
    { star: 1, name: "Diane Sawyer", text: "This practice cares about one thing: money. Every visit comes with a hard sell.", daysAgo: 190 },
    { star: 4, name: "Christopher Yang", text: "Top-notch cosmetic dentistry. My veneers look completely natural.", daysAgo: 205 },
    { star: 5, name: "Michael Torres", text: "Dr. Hartman saved my tooth that two other dentists wanted to extract.", daysAgo: 238 },
    { star: 4, name: "Wendy Nakamura", text: "Very professional practice. Dr. Hartman explained every step of my root canal.", daysAgo: 288 },
  ],
}

// ─── Main Seed Function ──────────────────────────────────────────────────────

async function seed() {
  console.log("🔧 Seeding ReviewRedact database (multi-tier)...\n")

  // Clear existing data in dependency order
  console.log("Clearing existing data...")
  const tables = ["prospects", "payouts", "payments", "invoices", "notifications", "rate_overrides", "documents", "contracts", "snapshots", "reviews", "clients", "salespeople", "resellers"]
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000")
    if (error) {
      console.error(`  Warning: Could not clear ${table}: ${error.message}`)
    } else {
      console.log(`  Cleared ${table}`)
    }
  }

  // ─── Insert Owners ─────────────────────────────────────────────────────────
  console.log("\nInserting owners...")
  const { data: insertedOwners, error: ownerError } = await supabase
    .from("resellers")
    .insert(owners)
    .select("id, name, role")

  if (ownerError || !insertedOwners) {
    console.error("Failed to insert owners:", ownerError?.message)
    process.exit(1)
  }
  for (const o of insertedOwners) console.log(`  Owner: ${o.name} (${o.id})`)

  // ─── Insert Resellers ──────────────────────────────────────────────────────
  console.log("\nInserting resellers...")
  const { data: insertedResellers, error: resellerError } = await supabase
    .from("resellers")
    .insert(resellers)
    .select("id, name, role")

  if (resellerError || !insertedResellers) {
    console.error("Failed to insert resellers:", resellerError?.message)
    process.exit(1)
  }
  for (const r of insertedResellers) console.log(`  Reseller: ${r.name} (${r.id})`)

  // Map names to IDs
  const resellerMap: Record<string, string> = {}
  for (const r of insertedResellers) {
    if (r.name === "Alex Thompson") resellerMap["alex"] = r.id
    if (r.name === "Sarah Chen") resellerMap["sarah"] = r.id
  }

  // ─── Create Documents for Resellers (signed) ──────────────────────────────
  console.log("\nCreating signed documents for resellers...")
  for (const r of insertedResellers) {
    await supabase.from("documents").insert([
      {
        signer_type: "reseller",
        signer_id: r.id,
        document_type: "w9_1099",
        status: "signed",
        signature_data: { type: "typed", typed_name: r.name, font: "Dancing Script", ip: "seed", user_agent: "seed", timestamp: new Date().toISOString() },
        signed_at: new Date().toISOString(),
      },
      {
        signer_type: "reseller",
        signer_id: r.id,
        document_type: "contractor_agreement",
        status: "signed",
        signature_data: { type: "typed", typed_name: r.name, font: "Dancing Script", ip: "seed", user_agent: "seed", timestamp: new Date().toISOString() },
        signed_at: new Date().toISOString(),
      },
    ])
    console.log(`  Signed docs for ${r.name}`)
  }

  // ─── Insert Reseller Salespeople ───────────────────────────────────────────
  console.log("\nInserting reseller salespeople...")
  const spMap: Record<string, string> = {}

  for (const sp of resellerSalespeople) {
    const resellerId = resellerMap[sp.reseller_key]
    const { data, error } = await supabase
      .from("salespeople")
      .insert({
        reseller_id: resellerId,
        name: sp.name,
        email: sp.email,
        cell: sp.cell,
        pin_code: sp.pin_code,
        company: sp.company,
        parent_type: sp.parent_type,
        pricing_plan: sp.pricing_plan,
        base_rate_google: sp.base_rate_google,
        display_price_google: sp.display_price_google,
        is_active: true,
      })
      .select("id, name")
      .single()

    if (error || !data) {
      console.error(`  Failed: ${sp.name}: ${error?.message}`)
      continue
    }

    // Map by first name lowercase for client linking
    const key = sp.name.split(" ")[0].toLowerCase()
    spMap[key] = data.id
    console.log(`  Salesperson: ${data.name} (${data.id}) under ${sp.reseller_key}`)

    // Create signed documents
    await supabase.from("documents").insert([
      { signer_type: "salesperson", signer_id: data.id, document_type: "w9_1099", status: "signed", signature_data: { type: "typed", typed_name: sp.name, font: "Sacramento", ip: "seed", user_agent: "seed", timestamp: new Date().toISOString() }, signed_at: new Date().toISOString() },
      { signer_type: "salesperson", signer_id: data.id, document_type: "contractor_agreement", status: "signed", signature_data: { type: "typed", typed_name: sp.name, font: "Sacramento", ip: "seed", user_agent: "seed", timestamp: new Date().toISOString() }, signed_at: new Date().toISOString() },
    ])
  }

  // ─── Insert Owner-Direct Salespeople ───────────────────────────────────────
  console.log("\nInserting owner-direct salespeople...")
  for (const sp of directSalespeople) {
    const { data, error } = await supabase
      .from("salespeople")
      .insert({
        reseller_id: null,
        name: sp.name,
        email: sp.email,
        cell: sp.cell,
        pin_code: sp.pin_code,
        company: sp.company,
        parent_type: sp.parent_type,
        pricing_plan: sp.pricing_plan,
        base_rate_google: sp.base_rate_google,
        display_price_google: sp.display_price_google,
        is_active: true,
      })
      .select("id, name")
      .single()

    if (error || !data) {
      console.error(`  Failed: ${sp.name}: ${error?.message}`)
      continue
    }

    const key = sp.name.split(" ")[0].toLowerCase()
    spMap[key] = data.id
    console.log(`  Direct SP: ${data.name} (${data.id}) — ${sp.pricing_plan}`)

    // Create signed documents
    await supabase.from("documents").insert([
      { signer_type: "salesperson", signer_id: data.id, document_type: "w9_1099", status: "signed", signature_data: { type: "typed", typed_name: sp.name, font: "Great Vibes", ip: "seed", user_agent: "seed", timestamp: new Date().toISOString() }, signed_at: new Date().toISOString() },
      { signer_type: "salesperson", signer_id: data.id, document_type: "contractor_agreement", status: "signed", signature_data: { type: "typed", typed_name: sp.name, font: "Great Vibes", ip: "seed", user_agent: "seed", timestamp: new Date().toISOString() }, signed_at: new Date().toISOString() },
    ])
  }

  // ─── Insert Clients ────────────────────────────────────────────────────────
  console.log("\nInserting clients...")
  const insertedClients: Array<{ id: string; business_name: string; business_type: string; reseller_id: string; salesperson_id: string | null }> = []

  for (const cs of clientSeeds) {
    const resellerId = resellerMap[cs.reseller_key]
    const salespersonId = cs.salesperson_key ? spMap[cs.salesperson_key] : null

    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        reseller_id: resellerId,
        salesperson_id: salespersonId,
        business_name: cs.business_name,
        owner_name: cs.owner_name,
        address: cs.address,
        business_phone: cs.business_phone,
        owner_phone: cs.owner_phone,
        owner_email: cs.owner_email,
        google_url: cs.google_url,
        status: cs.status,
        notes: cs.notes,
      })
      .select("id, business_name")
      .single()

    if (error || !client) {
      console.error(`  Failed: ${cs.business_name}: ${error?.message}`)
      continue
    }

    insertedClients.push({ ...client, business_type: cs.business_type, reseller_id: resellerId, salesperson_id: salespersonId })
    console.log(`  Client: ${client.business_name} (${client.id})${salespersonId ? " [has salesperson]" : ""}`)
  }

  // ─── Insert Reviews + Snapshots ────────────────────────────────────────────
  console.log("\nInserting reviews and snapshots...")

  let firstContractClientId: string | null = null
  let firstContractReviewIds: string[] = []
  let firstContractResellerId: string | null = null
  let firstContractSpId: string | null = null

  for (const client of insertedClients) {
    const reviewData = reviewsByType[client.business_type]
    if (!reviewData) continue

    const reviewRows = reviewData.map((r) => {
      const date = new Date()
      date.setDate(date.getDate() - r.daysAgo)
      return {
        client_id: client.id,
        platform: "google" as const,
        reviewer_name: r.name,
        star_rating: r.star,
        review_text: r.text,
        review_date: date.toISOString().split("T")[0],
        status: "active" as const,
      }
    })

    const { data: insertedReviews, error } = await supabase
      .from("reviews")
      .insert(reviewRows)
      .select("id, star_rating")

    if (error || !insertedReviews) {
      console.error(`  Failed reviews for ${client.business_name}: ${error?.message}`)
      continue
    }

    console.log(`  ${insertedReviews.length} reviews for ${client.business_name}`)

    // Save first client's negative review IDs for a draft contract
    if (!firstContractClientId) {
      firstContractClientId = client.id
      firstContractResellerId = client.reseller_id
      firstContractSpId = client.salesperson_id
      firstContractReviewIds = insertedReviews
        .filter((r) => r.star_rating <= 2)
        .slice(0, 3)
        .map((r) => r.id)
    }

    // Snapshot
    const totalStars = insertedReviews.reduce((sum, r) => sum + r.star_rating, 0)
    const totalReviews = insertedReviews.length
    const averageRating = Math.round((totalStars / totalReviews) * 100) / 100

    await supabase.from("snapshots").insert({
      client_id: client.id,
      average_rating: averageRating,
      total_reviews: totalReviews,
      total_stars: totalStars,
      platform: "google",
    })
    console.log(`  Snapshot: ${averageRating} avg (${totalReviews} reviews)`)
  }

  // ─── Insert a Draft Contract ───────────────────────────────────────────────
  if (firstContractClientId && firstContractResellerId && firstContractReviewIds.length > 0) {
    console.log("\nInserting draft contract...")
    const { data: contract } = await supabase
      .from("contracts")
      .insert({
        client_id: firstContractClientId,
        reseller_id: firstContractResellerId,
        salesperson_id: firstContractSpId,
        selected_review_ids: firstContractReviewIds,
        google_review_count: firstContractReviewIds.length,
        contract_rate_google: 1500,
        bts_base_google: 850,
        status: "draft",
        generated_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (contract) {
      console.log(`  Draft contract: ${contract.id} (${firstContractReviewIds.length} reviews at $1,500/each)`)
    }
  }

  // ─── Insert a Sample Rate Override ─────────────────────────────────────────
  console.log("\nInserting sample rate override...")
  if (resellerMap["alex"] && spMap["mike"]) {
    await supabase.from("rate_overrides").insert({
      set_by_type: "reseller",
      set_by_id: resellerMap["alex"],
      target_type: "salesperson",
      target_id: spMap["mike"],
      client_id: null, // universal
      rate_google: 950,
      notes: "Volume deal — Mike gets lower base on all clients",
    })
    console.log("  Override: Alex → Mike, universal $950 rate")
  }

  console.log("\n✅ Seed complete!")
  console.log("\nLogin credentials:")
  console.log("  Owners:      Ian Rakow (000001), Blair Stover (000002), Victor Kawana (000003)")
  console.log("  Resellers:   Alex Thompson (123456), Sarah Chen (654321)")
  console.log("  Salespeople: Mike Rivera (111111), Jessica Park (222222), David Okafor (333333)")
  console.log("  Direct SP:   Carlos Mendez (444444/Plan A), Natalie Brooks (555555/Plan B)")
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
