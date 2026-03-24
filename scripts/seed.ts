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

const resellers = [
  {
    name: "Ian Rakow",
    email: "ian@cyberactiveconsulting.com",
    cell: "3145551000",
    pin_code: "000001",
    company: "Business Threat Solutions",
    address: "100 N Broadway, Suite 2000, St. Louis, MO 63102",
    tax_id_1099: null,
    base_rate_google: 1000,
    base_rate_facebook: 500,
    role: "admin" as const,
    is_active: true,
  },
  {
    name: "Alex Thompson",
    email: "alex@thompsondigital.io",
    cell: "4155559201",
    pin_code: "123456",
    company: "Thompson Digital",
    address: "450 Sutter St, Suite 1100, San Francisco, CA 94108",
    tax_id_1099: "82-4571923",
    base_rate_google: 1000,
    base_rate_facebook: 500,
    role: "reseller" as const,
    is_active: true,
  },
  {
    name: "Sarah Chen",
    email: "sarah@chenmarketinggroup.com",
    cell: "2125558734",
    pin_code: "654321",
    company: "Chen Marketing Group",
    address: "220 E 42nd St, Floor 25, New York, NY 10017",
    tax_id_1099: "37-9182645",
    base_rate_google: 1000,
    base_rate_facebook: 500,
    role: "reseller" as const,
    is_active: true,
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
  reseller_index: number // 1 = Alex (index 1), 2 = Sarah (index 2)
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
    reseller_index: 1,
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
    reseller_index: 1,
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
    reseller_index: 2,
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
    reseller_index: 2,
    business_type: "dental",
  },
]

// Reviews organized by business type
const reviewsByType: Record<string, Array<{ star: number; name: string; text: string; daysAgo: number }>> = {
  plumbing: [
    { star: 1, name: "Karen Mitchell", text: "Called for an emergency leak at 6 PM and they said they couldn't come until morning. My kitchen flooded overnight. Absolutely useless when you need them most.", daysAgo: 12 },
    { star: 1, name: "Greg Paulson", text: "They replaced my water heater and it stopped working after two weeks. When I called back they tried to charge me again for the service call. Total scam.", daysAgo: 28 },
    { star: 1, name: "Debra Hanson", text: "The plumber tracked mud all through my house and didn't even fix the problem. I had to call another company to actually get the job done.", daysAgo: 45 },
    { star: 2, name: "Steve Olsen", text: "Showed up late, overcharged for basic work. The fix held for about a month before the same pipe started leaking again. Not impressed.", daysAgo: 60 },
    { star: 2, name: "Linda Foster", text: "Very slow response time and the quote was way higher than two other companies I called. The work was mediocre at best.", daysAgo: 72 },
    { star: 1, name: "Jason Reid", text: "They broke my bathroom tile during a repair and refused to cover the replacement cost. Had to file a complaint with the BBB.", daysAgo: 90 },
    { star: 3, name: "Patricia Gomez", text: "The actual plumbing work was fine but the scheduling was a nightmare. They rescheduled on me three times before finally showing up.", daysAgo: 105 },
    { star: 2, name: "Tom Nguyen", text: "Charged $350 for what turned out to be a $50 part and 20 minutes of labor. When I questioned the price they got defensive.", daysAgo: 115 },
    { star: 1, name: "Michelle Burke", text: "Worst plumbing experience of my life. They left my bathroom torn apart and didn't come back for a week to finish. No communication whatsoever.", daysAgo: 130 },
    { star: 4, name: "Robert Chen", text: "Decent work overall. They fixed a tricky drain issue that two other plumbers couldn't figure out. A bit pricey but effective.", daysAgo: 145 },
    { star: 5, name: "Angela Stewart", text: "Frank and his crew were fantastic. Replumbed our entire basement in two days. Clean, professional, and reasonably priced.", daysAgo: 160 },
    { star: 3, name: "David Kim", text: "Average service. Nothing spectacular but they got the job done. Wouldn't say it was worth what they charged though.", daysAgo: 175 },
    { star: 1, name: "Nancy Williams", text: "DO NOT USE THIS COMPANY. They installed a hot water heater incorrectly, causing a leak that damaged my ceiling. Then they ghosted my calls.", daysAgo: 190 },
    { star: 5, name: "Mark Johnson", text: "These guys saved us during a pipe burst at 2 AM. Showed up fast, fixed it right, and were incredibly professional about the whole thing.", daysAgo: 200 },
    { star: 2, name: "Diana Lopez", text: "The plumber was friendly enough but clearly didn't know what he was doing. Had to call them back twice for the same issue.", daysAgo: 215 },
    { star: 4, name: "Brian Taylor", text: "Good experience with a kitchen faucet replacement. On time, fair price, clean work. Minor issue with the shutoff valve they should have caught.", daysAgo: 230 },
    { star: 1, name: "Carol Martinez", text: "They quoted me $200 on the phone and then charged me $600 when they got here. Absolutely predatory pricing tactics.", daysAgo: 250 },
    { star: 3, name: "James Wright", text: "Adequate but nothing special. They fixed the toilet but left a mess. At least the plumbing works now.", daysAgo: 270 },
    { star: 5, name: "Sandra Lee", text: "Excellent work on our whole-house repiping project. Frank's team was organized, fast, and left our home spotless. Highly recommend.", daysAgo: 285 },
    { star: 2, name: "Paul Anderson", text: "Unreliable. Missed two appointments without calling. When they finally showed up, the work was sloppy and I had to get it redone.", daysAgo: 310 },
  ],
  auto: [
    { star: 1, name: "Rachel Green", text: "They told me I needed a new transmission for $4,500. Took it to another shop and it was just a solenoid — $300 fix. These guys are crooks.", daysAgo: 8 },
    { star: 1, name: "Mike Patterson", text: "Left my car there for an oil change and they kept it for THREE DAYS without calling. When I showed up they hadn't even started. Unbelievable.", daysAgo: 22 },
    { star: 2, name: "Jennifer Walsh", text: "Overpriced for the area. Charged me $120 for a diagnostic fee and then wanted $800 for brakes that I got done elsewhere for $400.", daysAgo: 38 },
    { star: 1, name: "Chris Donovan", text: "My car came back with a new scratch on the fender and they denied it happened there. I have dashcam footage proving otherwise. Dishonest.", daysAgo: 55 },
    { star: 3, name: "Amanda Pierce", text: "The mechanics seem knowledgeable but the front desk staff is rude and the wait times are ridiculous even with an appointment.", daysAgo: 68 },
    { star: 1, name: "Derek Foster", text: "They didn't tighten my oil drain plug properly and I lost all my oil on the freeway. Engine seized. They refused responsibility.", daysAgo: 80 },
    { star: 2, name: "Lisa Chang", text: "Brought my car in for a check engine light. They replaced an O2 sensor for $450. Light came back on the next day. Still not fixed.", daysAgo: 95 },
    { star: 5, name: "William Davis", text: "Tony and his team are the real deal. Honest, fair pricing, and they actually explain what's wrong with your car in terms you can understand.", daysAgo: 108 },
    { star: 1, name: "Beth Morrison", text: "The worst auto repair experience I've ever had. They had my car for two weeks for a job they quoted at three days. No updates unless I called.", daysAgo: 125 },
    { star: 4, name: "Kevin Park", text: "Solid shop. They diagnosed an electrical issue that stumped two other mechanics. A little slow on turnaround but the work quality is there.", daysAgo: 138 },
    { star: 2, name: "Stephanie Ruiz", text: "Went in for a tire rotation and they tried to upsell me on $1,200 worth of work I didn't need. Very pushy sales tactics.", daysAgo: 152 },
    { star: 5, name: "Dan O'Brien", text: "Been bringing my cars here for five years. Always honest, always fair. Tony once told me NOT to do a repair because it wasn't worth it on my older car.", daysAgo: 168 },
    { star: 1, name: "Megan Torres", text: "They broke my AC compressor during an unrelated repair and wanted to charge me to fix it. When I pushed back they gave me attitude. Never again.", daysAgo: 185 },
    { star: 3, name: "Ryan Clark", text: "Average shop. Prices are okay, work is decent. Nothing that makes them stand out from other shops in the area.", daysAgo: 198 },
    { star: 4, name: "Heather Morgan", text: "Good honest mechanics. They replaced my alternator quickly and the price was fair. Would have been 5 stars but the waiting area is grim.", daysAgo: 212 },
    { star: 1, name: "Tyler James", text: "Absolutely terrible. My car was making a noise AFTER they worked on it that wasn't there before. They denied everything. Check your car carefully.", daysAgo: 230 },
    { star: 5, name: "Olivia Martin", text: "Tony's shop is a gem. Treated me with respect as a woman — no condescension, just honest assessments and quality work. My go-to forever.", daysAgo: 248 },
    { star: 2, name: "Adam White", text: "They forgot to reconnect a hose after working on my engine. Car overheated on the way home. Mistakes like that are dangerous.", daysAgo: 265 },
    { star: 3, name: "Jessica Lee", text: "Decent work but communication is terrible. I never know when my car will actually be ready. Would be nice to get a text update.", daysAgo: 280 },
    { star: 4, name: "Nathan Hall", text: "Great brake job. Smooth, quiet, and priced competitively. Tony even showed me the worn pads so I could see why they needed replacing.", daysAgo: 300 },
  ],
  restaurant: [
    { star: 1, name: "Bradley Cooper", text: "Found a hair in my pasta and when I told the waiter, the manager rolled her eyes and just took it off the bill. No apology, no replacement. Disgusting.", daysAgo: 5 },
    { star: 1, name: "Samantha Blake", text: "Reservation for 7 PM, wasn't seated until 8:15. No explanation, no apology. Food was cold when it finally arrived. For these prices, absolutely unacceptable.", daysAgo: 18 },
    { star: 2, name: "Victor Hernandez", text: "The ambiance is lovely but the food does not justify the price tag. My $42 veal was dry and my wife's risotto was gummy. Very disappointing.", daysAgo: 32 },
    { star: 1, name: "Christine Novak", text: "I got food poisoning from the seafood special. Spent the entire next day sick. Called the restaurant and they basically said it wasn't their problem.", daysAgo: 48 },
    { star: 3, name: "George Papas", text: "Good pasta, overpriced wine list. The tiramisu was excellent. Service was hit or miss — our first waiter was great, the second one seemed annoyed.", daysAgo: 65 },
    { star: 1, name: "Alicia Moreno", text: "Former employee here. The kitchen conditions are not what you'd expect from a restaurant at this price point. I'd think twice before eating here.", daysAgo: 78 },
    { star: 2, name: "Richard Klein", text: "We came for our anniversary and it was thoroughly mediocre. Stale bread, lukewarm soup, and a server who couldn't answer basic questions about the menu.", daysAgo: 92 },
    { star: 5, name: "Isabella Fontaine", text: "Absolutely magical dining experience. Maria came to our table personally to recommend dishes. The osso buco was the best I've had outside of Milan.", daysAgo: 105 },
    { star: 1, name: "Howard Stern", text: "Roach on the wall next to our table. When I pointed it out they moved us but didn't seem particularly concerned. Health department should visit.", daysAgo: 120 },
    { star: 4, name: "Diana Cho", text: "Wonderful Italian cuisine with an authentic feel. The homemade gnocchi is a must-try. Only minor issue was a long wait between courses.", daysAgo: 135 },
    { star: 2, name: "Marcus Jefferson", text: "The noise level was unbearable. Couldn't hear my dinner companion across the table. Food was decent but the experience was ruined by the acoustics.", daysAgo: 148 },
    { star: 5, name: "Eleanor Vance", text: "A true Little Italy treasure. Every dish is made with love and the best ingredients. Maria's family recipes are incredible. Don't miss the panna cotta.", daysAgo: 162 },
    { star: 1, name: "Frank Russo", text: "I'm Italian and this is NOT authentic Italian food. It's Olive Garden with a Mulberry Street address and triple the prices. Save your money.", daysAgo: 178 },
    { star: 4, name: "Priya Sharma", text: "Beautiful restaurant with genuinely delicious food. The wine pairings were excellent. Only giving 4 stars because of the 20-minute wait past our reservation.", daysAgo: 192 },
    { star: 3, name: "Thomas McKenna", text: "Solid Italian food, nothing mind-blowing. The portions are generous and the atmosphere is charming. Would return for a casual dinner but not a special occasion.", daysAgo: 208 },
    { star: 5, name: "Anne-Marie Bouchard", text: "We hosted a private party here and Maria went above and beyond. Custom menu, beautiful table settings, impeccable service. Our guests are still talking about it.", daysAgo: 222 },
    { star: 1, name: "Derek Washington", text: "Waited 45 minutes for an appetizer. Flagged down three different staff members. Eventually the manager came over and was defensive instead of helpful.", daysAgo: 240 },
    { star: 2, name: "Kelly O'Donnell", text: "My carbonara was swimming in cream — that's not carbonara, that's alfredo. When I politely mentioned this they told me it's 'their version.' No.", daysAgo: 255 },
    { star: 4, name: "Simon Park", text: "Great date night spot. Candlelit, romantic, and the food is very good. The bruschetta and lamb chops were standouts. A bit noisy on weekends.", daysAgo: 270 },
    { star: 5, name: "Catherine Reeves", text: "Perfection on a plate. The tasting menu with wine pairings was a journey through Italy. Maria is a culinary genius. Book well in advance.", daysAgo: 290 },
  ],
  dental: [
    { star: 1, name: "Monica Fields", text: "Dr. Hartman pushed for an expensive crown when I clearly just needed a filling. Went to another dentist who confirmed this. Trust is broken.", daysAgo: 10 },
    { star: 1, name: "Bruce Wayne", text: "The hygienist was rough and the office charged my insurance for services that weren't performed. When I called to dispute it, they were dismissive.", daysAgo: 25 },
    { star: 2, name: "Tanya Richardson", text: "Long wait times even with an appointment. The office is nice but that doesn't make up for being 40 minutes behind schedule every single visit.", daysAgo: 40 },
    { star: 1, name: "Alan Prescott", text: "They messed up my Invisalign treatment plan and refused to admit the error. Had to go to an orthodontist to fix what they started. Thousands of dollars wasted.", daysAgo: 58 },
    { star: 3, name: "Gina Rosario", text: "Competent dental work but the front desk staff is cold and the office has a pretentious vibe. You're a dentist, not a spa — just clean my teeth.", daysAgo: 72 },
    { star: 1, name: "Donald Murray", text: "They told my elderly mother she needed $8,000 worth of work. Second opinion said she needed a cleaning and one small filling. Predatory upselling.", daysAgo: 88 },
    { star: 2, name: "Sandra Kowalski", text: "The veneer they did looks nothing like the mockup they showed me. When I complained they said it was 'within normal variation.' Very unsatisfied.", daysAgo: 102 },
    { star: 5, name: "James Whitaker", text: "Dr. Hartman is the best dentist I've ever had. She completely rebuilt my smile with implants and I couldn't be happier. Life-changing work.", daysAgo: 115 },
    { star: 1, name: "Carla Mendes", text: "Billing nightmare. They double-billed my insurance and it took four months and dozens of phone calls to resolve. The administrative side is a disaster.", daysAgo: 130 },
    { star: 4, name: "Edward Kim", text: "Excellent dental care in a comfortable, modern office. Dr. Hartman is thorough and gentle. Only dock one star for the premium pricing.", daysAgo: 145 },
    { star: 2, name: "Margaret O'Sullivan", text: "My filling fell out after three months. They wanted to charge me again to redo it. A reputable practice would stand behind their work.", daysAgo: 160 },
    { star: 5, name: "Raymond Patel", text: "Terrified of dentists my entire life. Dr. Hartman and her team made me feel completely at ease. Pain-free experience and beautiful results. Cannot recommend enough.", daysAgo: 175 },
    { star: 1, name: "Diane Sawyer", text: "This practice cares about one thing: money. Every visit comes with a hard sell for cosmetic procedures. I came for a checkup, not a sales pitch.", daysAgo: 190 },
    { star: 4, name: "Christopher Yang", text: "Top-notch cosmetic dentistry. My veneers look completely natural. The process was longer than expected but the end result was worth it.", daysAgo: 205 },
    { star: 3, name: "Betty Franklin", text: "Decent dental work but impersonal. I've been a patient for two years and no one there knows my name. For Park Avenue prices I expect more.", daysAgo: 220 },
    { star: 5, name: "Michael Torres", text: "Dr. Hartman saved my tooth that two other dentists wanted to extract. She took the time to find a better solution. A true professional.", daysAgo: 238 },
    { star: 1, name: "Julia Stevens", text: "The Novocain didn't work and I told them I could still feel everything. They basically said to tough it out. I was in agony for the entire procedure.", daysAgo: 255 },
    { star: 2, name: "Robert Hayes", text: "Nice office, mediocre dentistry. My whitening treatment was uneven and they wanted to charge me again to fix it. Should have gone elsewhere.", daysAgo: 270 },
    { star: 4, name: "Wendy Nakamura", text: "Very professional practice. Clean, modern, and well-organized. Dr. Hartman explained every step of my root canal. Almost pleasant, if that's possible.", daysAgo: 288 },
    { star: 5, name: "Stanley Brooks", text: "Five stars across the board. From scheduling to treatment to follow-up, everything is handled with care and precision. Best dental practice in Manhattan.", daysAgo: 305 },
  ],
}

// ─── Main Seed Function ──────────────────────────────────────────────────────

async function seed() {
  console.log("Seeding ReviewRedact database...\n")

  // Clear existing data in dependency order
  console.log("Clearing existing data...")
  const tables = ["contracts", "snapshots", "reviews", "clients", "resellers"]
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000")
    if (error) {
      console.error(`  Warning: Could not clear ${table}: ${error.message}`)
    } else {
      console.log(`  Cleared ${table}`)
    }
  }

  // Insert resellers
  console.log("\nInserting resellers...")
  const { data: insertedResellers, error: resellerError } = await supabase
    .from("resellers")
    .insert(resellers)
    .select("id, name, role")

  if (resellerError || !insertedResellers) {
    console.error("Failed to insert resellers:", resellerError?.message)
    process.exit(1)
  }

  for (const r of insertedResellers) {
    console.log(`  ${r.role === "admin" ? "Admin" : "Reseller"}: ${r.name} (${r.id})`)
  }

  // Map reseller names to IDs
  const resellerMap: Record<string, string> = {}
  for (const r of insertedResellers) {
    if (r.name === "Ian Rakow") resellerMap["admin"] = r.id
    if (r.name === "Alex Thompson") resellerMap["alex"] = r.id
    if (r.name === "Sarah Chen") resellerMap["sarah"] = r.id
  }

  // Insert clients
  console.log("\nInserting clients...")
  const insertedClients: Array<{ id: string; business_name: string; business_type: string }> = []

  for (const cs of clientSeeds) {
    const resellerId = cs.reseller_index === 1 ? resellerMap["alex"] : resellerMap["sarah"]

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        reseller_id: resellerId,
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

    if (clientError || !client) {
      console.error(`  Failed to insert ${cs.business_name}: ${clientError?.message}`)
      continue
    }

    insertedClients.push({ ...client, business_type: cs.business_type })
    console.log(`  Client: ${client.business_name} (${client.id})`)
  }

  // Insert reviews and snapshots for each client
  console.log("\nInserting reviews and snapshots...")

  let contractClientId: string | null = null
  let contractReviewIds: string[] = []
  let contractResellerId: string | null = null

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

    const { data: insertedReviews, error: reviewError } = await supabase
      .from("reviews")
      .insert(reviewRows)
      .select("id, star_rating")

    if (reviewError || !insertedReviews) {
      console.error(`  Failed to insert reviews for ${client.business_name}: ${reviewError?.message}`)
      continue
    }

    console.log(`  ${insertedReviews.length} reviews for ${client.business_name}`)

    // Save first client's negative review IDs for the draft contract
    if (!contractClientId) {
      contractClientId = client.id
      contractResellerId = clientSeeds.find((c) => c.business_name === client.business_name)?.reseller_index === 1
        ? resellerMap["alex"]
        : resellerMap["sarah"]
      contractReviewIds = insertedReviews
        .filter((r) => r.star_rating <= 2)
        .slice(0, 5)
        .map((r) => r.id)
    }

    // Compute snapshot
    const totalStars = insertedReviews.reduce((sum, r) => sum + r.star_rating, 0)
    const totalReviews = insertedReviews.length
    const averageRating = Math.round((totalStars / totalReviews) * 100) / 100

    const { error: snapshotError } = await supabase.from("snapshots").insert({
      client_id: client.id,
      average_rating: averageRating,
      total_reviews: totalReviews,
      total_stars: totalStars,
      platform: "google",
    })

    if (snapshotError) {
      console.error(`  Failed to insert snapshot for ${client.business_name}: ${snapshotError.message}`)
    } else {
      console.log(`  Snapshot for ${client.business_name}: ${averageRating} avg (${totalReviews} reviews)`)
    }
  }

  // Insert a draft contract for the first client
  if (contractClientId && contractResellerId && contractReviewIds.length > 0) {
    console.log("\nInserting draft contract...")

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        client_id: contractClientId,
        reseller_id: contractResellerId,
        selected_review_ids: contractReviewIds,
        google_review_count: contractReviewIds.length,
        contract_rate_google: 1500,
        bts_base_google: 1000,
        status: "draft",
        generated_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (contractError) {
      console.error(`  Failed to insert contract: ${contractError.message}`)
    } else {
      console.log(`  Draft contract: ${contract?.id} (${contractReviewIds.length} reviews at $1,500/each)`)
    }
  }

  console.log("\nSeed complete!")
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
