interface ScrapedReview {
  reviewer_name: string
  star_rating: number
  review_text: string
  review_date: string
}

interface ScrapeResult {
  reviews: ScrapedReview[]
  error?: string
}

function generateMockReviews(): ScrapedReview[] {
  const names = [
    "Michael Johnson", "Sarah Williams", "David Brown", "Jessica Martinez",
    "Robert Garcia", "Emily Davis", "James Wilson", "Amanda Taylor",
    "Christopher Anderson", "Megan Thomas", "Daniel Jackson", "Ashley White",
    "Matthew Harris", "Stephanie Martin", "Andrew Thompson", "Nicole Robinson",
    "Joshua Clark", "Rachel Lewis", "Brandon Lee", "Samantha Walker",
  ]

  const reviewTexts: Record<number, string[]> = {
    1: [
      "Absolutely terrible experience. Waited over two hours and nobody even acknowledged me. Will never come back.",
      "Complete rip-off. They charged me double what was quoted and the work was shoddy at best. Avoid this place.",
      "The worst customer service I have ever encountered. Staff was rude and dismissive. Zero stars if I could.",
      "They damaged my property and refused to take responsibility. Had to hire someone else to fix their mistakes.",
    ],
    2: [
      "Not great. The work was mediocre and they missed the deadline by a week. Wouldn't recommend.",
      "Overpriced for what you get. There are much better options in the area. Staff seemed disinterested.",
      "They got the job done eventually but it took three visits to fix issues they should have caught the first time.",
      "Communication was poor. I had to call multiple times just to get a status update on my project.",
    ],
    3: [
      "Average experience. Nothing special but nothing terrible either. Probably would try somewhere else next time.",
      "Decent work but the pricing felt a bit high for the area. Staff was friendly enough.",
      "They did an okay job. A few minor issues that needed follow-up but overall acceptable.",
      "Mixed feelings. The initial consultation was great but the actual service fell a bit short of expectations.",
    ],
    4: [
      "Really solid work. The team was professional and finished on time. Just a minor hiccup with scheduling.",
      "Great experience overall. Knowledgeable staff and fair pricing. Would use them again.",
      "Very happy with the results. They went above and beyond to make sure everything was done right.",
      "Professional and courteous from start to finish. Only giving 4 stars because parking is a nightmare.",
    ],
    5: [
      "Outstanding service! They exceeded all my expectations. Highly recommend to anyone in the area.",
      "Best in the business. Fair prices, excellent work, and incredibly friendly staff. Five stars all the way!",
      "Cannot say enough good things. They transformed my experience completely. Will be a customer for life.",
      "Absolutely phenomenal. Quick turnaround, flawless execution, and they even followed up afterward to make sure I was satisfied.",
    ],
  }

  const reviews: ScrapedReview[] = []
  const usedNames = new Set<string>()

  for (let i = 0; i < 18; i++) {
    // Weight ratings: more 1-2 star to make it realistic for a client needing review removal
    const ratingWeights = [1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5]
    const starRating = ratingWeights[Math.floor(Math.random() * ratingWeights.length)]
    const texts = reviewTexts[starRating]
    const reviewText = texts[Math.floor(Math.random() * texts.length)]

    let name: string
    do {
      name = names[Math.floor(Math.random() * names.length)]
    } while (usedNames.has(name) && usedNames.size < names.length)
    usedNames.add(name)

    // Generate a random date within the last 12 months
    const daysAgo = Math.floor(Math.random() * 365)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)

    reviews.push({
      reviewer_name: name,
      star_rating: starRating,
      review_text: reviewText,
      review_date: date.toISOString().split("T")[0],
    })
  }

  return reviews
}

export async function scrapeGoogleReviews(googleUrl: string): Promise<ScrapeResult> {
  const apiKey = process.env.OUTSCRAPER_API_KEY

  // If no API key or placeholder, return mock data
  if (!apiKey || apiKey === "your_api_key_here" || apiKey === "placeholder" || apiKey.length < 10) {
    return {
      reviews: generateMockReviews(),
      error: "Using mock data — OUTSCRAPER_API_KEY not configured",
    }
  }

  try {
    const params = new URLSearchParams({
      query: googleUrl,
      reviewsLimit: "0",
      sort: "newest_first",
      language: "en",
    })

    const response = await fetch(
      `https://api.app.outscraper.com/maps/reviews-v3?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "X-API-KEY": apiKey,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return {
        reviews: generateMockReviews(),
        error: `Outscraper API error (${response.status}): ${errorText}. Falling back to mock data.`,
      }
    }

    const data = await response.json()

    // Outscraper returns an array of results; first element contains the place data
    if (!Array.isArray(data) || data.length === 0 || !data[0]?.reviews_data) {
      return {
        reviews: generateMockReviews(),
        error: "No review data returned from Outscraper. Falling back to mock data.",
      }
    }

    const rawReviews = data[0].reviews_data as Array<{
      author_title?: string
      review_rating?: number
      review_text?: string
      review_datetime_utc?: string
      review_link?: string
    }>

    const reviews: ScrapedReview[] = rawReviews.map((r) => ({
      reviewer_name: r.author_title || "Anonymous",
      star_rating: r.review_rating || 1,
      review_text: r.review_text || "",
      review_date: r.review_datetime_utc
        ? new Date(r.review_datetime_utc).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    }))

    return { reviews }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      reviews: generateMockReviews(),
      error: `Scraper exception: ${message}. Falling back to mock data.`,
    }
  }
}
