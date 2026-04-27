import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DocsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-50">Technical library</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">EIP-712 domain (localhost)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed font-mono text-xs">
          <p>name: BlindVote</p>
          <p>version: 1</p>
          <p>chainId: 31337</p>
          <p>verifyingContract: deployment address from Hardhat</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CommitVote struct</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed">
          <pre className="overflow-x-auto border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-300">
{`CommitVote(bytes32 commitment,uint256 deadline,address voter)`}
          </pre>
          <p className="mt-2">
            Commitment is <span className="font-mono text-slate-200">keccak256(abi.encodePacked(candidateId, secret))</span>{" "}
            with <span className="font-mono">candidateId</span> as uint256 and <span className="font-mono">secret</span> as
            bytes32.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Relayer blindness</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed">
          The HTTP relay endpoint accepts only <span className="font-mono">voter</span>,{" "}
          <span className="font-mono">commitment</span>, <span className="font-mono">deadline</span>, and{" "}
          <span className="font-mono">signature</span>. Candidate identifiers and secrets never leave the voter
          controlled environment through that API.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legal disclaimer (placeholder)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed">
          This repository is a security and UX reference. It does not constitute legal advice, electoral certification,
          or a production risk assessment. Engage counsel and independent auditors before any public deployment.
        </CardContent>
      </Card>
    </div>
  );
}
