import { useSite } from "@/lib/site";
import { Link } from "react-router-dom";
import { Activity, Bot, Layout, LineChart, ShieldCheck } from "lucide-react";

export default function About() {
  const s = useSite().data?.settings;

  return (
    <section className="max-w-[1400px] mx-auto p-6 lg:p-12">
      <nav className="mb-8" aria-label="Page navigation">
        <Link to="/" className="font-disp text-[1.25rem] hover:underline transition-colors">
          ← Back to Obsidian Vane
        </Link>
      </nav>

      <div className="prose lg:prose-xl text-neutral-300">
        <h1 className="font-head text-4xl mb-6">
          About Obsidian Vane
        </h1>

        <p className="mb-8">
          Obsidian Vane is a market intelligence terminal designed for serious
          practitioners who want clarity without the noise. We combine live price
          data, Monte Carlo risk cones, and an AI advisor to help you understand
          market structure — not predict it.
        </p>

        <h2 className="font-head text-2xl mb-4">Philosophy</h2>
        <ul className="list-disc list-inside space-y-2 mb-8">
          <li>
            No investment advice — the app is for education and paper‑trading only.
          </li>
          <li>
            Prices come from verified exchanges (NASDAQ ISE, CryptoCompare). No
            hidden fees, no payment for order flow.
          </li>
          <li>
            All code is open source and lives on GitHub. Transparency is not a
            feature; it is the foundation.
          </li>
        </ul>

        <h2 className="font-head text-2xl mb-4">Features by Tier</h2>
        <p className="mb-4">
          The platform is divided into ten membership tiers. Each tier unlocks
          deeper interface modes, more sophisticated signal processing, and
          additional data sources. The entry-level Rookie tier is free and
          provides access to the core terminal with delayed market data.
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>Rookie:</strong> Free tier — core terminal, delayed data</li>
          <li><strong>Apprentice:</strong> Tier 1 — real-time NASDAQ, basic signals</li>
          <li><strong>Analyst:</strong> Tier 3 — Monte Carlo cones, AI advisor</li>
          <li><strong>Partner:</strong> Tier 5 — accent colours, advanced modes</li>
          <li><strong>Principal:</strong> Tier 7 — all modes, priority data</li>
          <li><strong>Director:</strong> Tier 10 — full access, custom modes</li>
        </ul>

        <h2 className="font-head text-2xl mb-4">Contact & Transparency</h2>
        <p className="mb-4">
          Questions? Reach out via the in-app feedback form. For official
          transparency notes and admin gating, see the footer links when signed
          in as an administrator.
        </p>

        <hr className="my-8 border-white/[0.06]" />

        <p className="text-xs text-neutral-500">
          © {new Date().getFullYear()} Obsidian Vane. Not an investment
          adviser. Market data may be delayed. Not for trading purposes. No cash
          value, no securities purchased, not investment advice.
        </p>
      </div>
    </section>
  );
}