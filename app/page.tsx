import { Suspense } from "react"
import { SiteNavbar } from "@/components/site-navbar"
import { HeroHeader } from "@/components/hero-header"
import { SearchBar } from "@/components/search-bar"
import { PromoSection } from "@/components/promo-section"
import { HowItWorks } from "@/components/how-it-works"
import { Testimonials } from "@/components/testimonials"
import { JackStoryCarousel } from "@/components/jack-story-carousel"
import { SiteFooter } from "@/components/site-footer"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#0B1F3A" }}>
      <div className="w-full max-w-[1200px] flex flex-col">
        {/* Top navigation */}
        <SiteNavbar />

        {/* Section 1: Hero header */}
        <HeroHeader />

        {/* Section 2: Search bar (attached to header) */}
        <div id="buscar">
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>

        {/* Section 3: Promotional */}
        <PromoSection />

        {/* Section 4: How it works */}
        <HowItWorks />

        {/* Section 5: Testimonials */}
        <Testimonials />

        {/* Section 6: Jack's Story Carousel */}
        <JackStoryCarousel />

        {/* Section 7: Footer */}
        <SiteFooter />
      </div>
    </main>
  )
}
