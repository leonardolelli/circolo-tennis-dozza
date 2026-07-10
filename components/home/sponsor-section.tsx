import { createClient } from "@/lib/supabase/server";

/**
 * Public sponsor logo grid. Reads directly from the `sponsor` table (public
 * read policy, see supabase/schema.sql) - no Server Action needed for a
 * plain read. Renders nothing if the table is empty or unreachable (e.g.
 * the SQL script hasn't been run yet) instead of breaking the homepage.
 */
export async function SponsorSection() {
  const supabase = await createClient();
  const { data: sponsors, error } = await supabase
    .from("sponsor")
    .select("id, nome, logo_url, link")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Failed to load sponsors:", error);
  }

  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-14 sm:px-10">
      <div className="mb-8 flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide text-tennis">
          I nostri sponsor
        </span>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Grazie a chi sostiene il circolo
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {sponsors.map((sponsor, index) => (
          <a
            key={sponsor.id}
            href={sponsor.link}
            target="_blank"
            rel="noreferrer noopener"
            className="group flex animate-slide-up items-center justify-center rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {/* Sponsor logos come from admin-supplied external URLs, so we
                deliberately use a plain <img> instead of next/image here -
                see the comment in next.config.ts for why. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sponsor.logo_url}
              alt={sponsor.nome}
              loading="lazy"
              width={160}
              height={80}
              className="max-h-16 w-auto object-contain grayscale transition-all group-hover:grayscale-0"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
