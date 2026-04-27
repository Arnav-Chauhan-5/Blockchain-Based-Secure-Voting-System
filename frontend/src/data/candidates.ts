export type VerificationStatus = "Registry verified" | "Pending review";

export type Candidate = {
  id: number;
  name: string;
  /** Displayed as party affiliation badge */
  party: string;
  affiliation: string;
  jurisdiction: string;
  summary: string;
  verificationStatus: VerificationStatus;
  manifesto: string;
};

export const CANDIDATES: Candidate[] = [
  {
    id: 1,
    name: "Dr. Elena Marchetti",
    party: "Civic Integrity Coalition",
    affiliation: "Civic Integrity Coalition",
    jurisdiction: "North District",
    summary:
      "Policy focus on procurement transparency, open data standards, and post-election statistical disclosure.",
    verificationStatus: "Registry verified",
    manifesto: `Executive summary

Our administration will treat elections as critical infrastructure: measurable, observable, and accountable. We will publish machine-readable manifests for every procurement touchpoint tied to electoral operations, require independent spot checks on random samples, and fund a standing transparency office with statutory reporting deadlines.

Fiscal stewardship

Capital plans will be escrowed with milestone-based releases tied to third-party attestations. Vendor relationships above a defined threshold will require dual-control approvals and public disclosure of evaluation criteria before bids close.

Data and privacy

We support minimal retention of personally identifiable voter metadata, strict separation between relayer operators and tally verification, and publication of aggregate statistics that let observers reconcile outcomes without exposing individual ballots.

Closing commitment

This manifesto is a living document. Major policy shifts will be versioned, time-stamped, and published alongside diff-style change logs so citizens can audit intent as well as outcomes.`,
  },
  {
    id: 2,
    name: "James Okonkwo",
    party: "Metropolitan Reform Union",
    affiliation: "Metropolitan Reform Union",
    jurisdiction: "Central Borough",
    summary:
      "Platform emphasizes capital allocation audits, infrastructure escrow visibility, and vendor attestation.",
    verificationStatus: "Registry verified",
    manifesto: `Priorities at a glance

Metropolitan Reform Union believes residents should see where money flows before concrete is poured. We will institute quarterly capital allocation audits with public dashboards, tie large infrastructure disbursements to measurable completion metrics, and require vendor attestation for subcontracting chains.

Infrastructure integrity

Escrow accounts will be used for high-risk projects, with independent engineers certifying milestone completion before funds move. Failure modes—delays, scope changes, contingency draws—will be logged with reasons, not buried in appendices.

Governance

We will expand participatory budgeting pilots, protect whistleblower channels for procurement concerns, and align municipal data standards with national interoperability frameworks where feasible.

Note on verification

Candidate filings are under continuous review; supplementary disclosures may be requested by the elections registry as audits progress.`,
  },
  {
    id: 3,
    name: "Priya Nandakumar",
    party: "Independent Watch",
    affiliation: "Independent Watch",
    jurisdiction: "Harbor Ward",
    summary:
      "Advocates for minimal retention of voter metadata, strict relayer segregation, and third-party witness nodes.",
    verificationStatus: "Pending review",
    manifesto: `Independent platform

Independent Watch advances a simple principle: trust is engineered, not assumed. We will push for strict relayer segregation so operational staff cannot infer individual votes from workflow data, advocate for witness nodes operated by non-governmental observers, and fund red-team exercises against election-facing APIs.

Security posture

We support hardware-backed key ceremonies for institutional operators, routine penetration testing with published executive summaries, and incident response playbooks that prioritize public communication timelines over organizational comfort.

Social compact

Harbor Ward deserves representatives who explain trade-offs in plain language. Our office will publish plain-English summaries beside technical specifications for any new digital voting or verification component.

Verification status

Registry review is pending final submission of financial disclosures for the prior cycle. This statement does not constitute legal certification.`,
  },
];
