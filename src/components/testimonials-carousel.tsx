import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

const AUTO_MS = 9000;

const TESTIMONIALS = [
  {
    name: "John Salvin Duke",
    org: "Software Tester",
    quote:
      "Big thanks to Sivva for the wonderful training. Having 3 years' experience in testing with no coding knowledge, I secured 6 Azure certifications in 23 days.",
  },
  {
    name: "Manoj Nair",
    org: "Ford",
    quote:
      "Sivva was the best mentor I found who helped me clear the CISM exam. His presence was a real support because I knew I could always reach out to him for any questions especially in approach and planning for the exam. His tips really helped me with mindset which I think is the most necessary element in taking this certification.",
  },
  {
    name: "Mahmoud Alwakeel",
    org: "Qatar",
    quote:
      "Sivaa played a key role in my CCSP certification success. His clear explanations and structured approach helped me understand complex cloud security concepts in a simple and practical way. What stood out the most was his well-curated set of practice questions on Udemy, which closely mirrored the exam pattern and really helped reinforce my learning. These questions not only tested my understanding but also improved my time management and confidence before the actual exam. Sivaa’s teaching style is engaging and focused, and he was always approachable for doubts, making the entire preparation journey more effective and motivating.",
  },
  {
    name: "Muthumaaran",
    org: "Bangalore",
    quote:
      "I did both AZ-900,AI-900 certification with help of cloudvaathi team, Siva took an amazing effort to coach me in azure 900 and one of his team member Adelene was really an amazing trainer who trained me in AI-900. Their motivation and encouragement was really appreciated. They way of approach towards mock exams were really helpful. Clearly AI-900 in current AI world gave a great weightage in my career for the year.Thankyou Sivaa & team.keep up your training journey!",
  },
  {
    name: "Deepti Fadnavis",
    org: "Canada",
    quote:
      "My trainer and coach for CCSP Sivva Kannan Sir :  His sessions were extremely valuable in simplifying complex domains and building the right mindset needed to approach the exam.",
  },
  {
    name: "Hermon Zera",
    org: "",
    quote:
      "I watched Adelene's videos related to the AI 900 course. Her explanations were clear and easy to understand. After watching the video, I tested my skills with Sivva's Udemy AI 900 practice bank! Both Sivva and Adelene constantly reminded us and motivated us to take the exam, and they were ready to help when needed! I passed the certification with their motivation and support! Thanks to both of them!",
  },
] as const;

export const FEATURED_HOME_TESTIMONIAL = TESTIMONIALS[0];

export function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const onChange = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const len = TESTIMONIALS.length;
  const goNext = useCallback(() => setIndex((i) => (i + 1) % len), [len]);
  const goPrev = useCallback(() => setIndex((i) => (i - 1 + len) % len), [len]);

  useEffect(() => {
    if (paused || prefersReducedMotion) return;
    const id = window.setInterval(goNext, AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused, prefersReducedMotion, goNext, index]);

  const t = TESTIMONIALS[index];

  return (
    <section className="px-4 sm:px-6 py-20" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// voices from the community</p>
          <h2 id="testimonials-heading" className="mt-3 font-display text-4xl font-bold sm:text-5xl">
            Testimonials &amp; achievements
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Real feedback from engineers and professionals who prepared with Cloud Vaathi across certifications and cohorts.
          </p>
        </div>

        <div
          className="relative rounded-3xl glass p-8 sm:p-10 glow-violet"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
          }}
          role="region"
          aria-roledescription="carousel"
          aria-label="Testimonials"
        >
          <Quote className="absolute right-8 top-8 h-10 w-10 text-neon-cyan/25 sm:h-12 sm:w-12" aria-hidden />

          <div className="relative min-h-[12rem] sm:min-h-[10rem] pr-2">
            <blockquote
              key={index}
              className="testimonial-slide-enter m-0 border-0 p-0 text-left"
            >
              <p className="text-base leading-relaxed text-foreground/95 sm:text-lg">{t.quote}</p>
              <footer className="mt-8 flex flex-wrap items-baseline gap-x-2 border-t border-border/50 pt-6">
                <cite className="font-display text-lg font-semibold not-italic text-gradient-neon">{t.name}</cite>
                {t.org ? (
                  <span className="text-sm text-muted-foreground">
                    <span className="text-border">·</span> {t.org}
                  </span>
                ) : null}
              </footer>
            </blockquote>
          </div>

          {!prefersReducedMotion ? (
            <div
              className="pointer-events-none mt-8 h-0.5 w-full overflow-hidden rounded-full bg-border/40"
              aria-hidden
            >
              <div
                key={index}
                style={{
                  animation: `testimonial-progress-fill ${AUTO_MS}ms linear forwards`,
                  animationPlayState: paused ? "paused" : "running",
                }}
                className="h-full w-full origin-left rounded-full bg-gradient-neon"
              />
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2" role="tablist" aria-label="Choose testimonial">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Slide ${i + 1} of ${len}`}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === index ? "w-8 bg-gradient-neon" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70",
                  )}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/50 text-foreground transition-colors hover:bg-secondary/80"
                aria-label="Previous testimonial"
                onClick={goPrev}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/50 text-foreground transition-colors hover:bg-secondary/80"
                aria-label="Next testimonial"
                onClick={goNext}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            Showing testimonial {index + 1} of {len}: {t.name}
            {t.org ? `, ${t.org}` : ""}.
          </p>
        </div>
      </div>
    </section>
  );
}
