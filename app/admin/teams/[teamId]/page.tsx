"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ExternalLink,
  Github,
  FileText,
  Lock,
  UserX,
  AlertTriangle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { setBreadcrumbs } from "@/lib/hooks/useBreadcrumb";
import { useGetTeamDetailsQuery } from "@/lib/redux/api/adminApi";

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const { data: details, isLoading, isError } = useGetTeamDetailsQuery(teamId);

  // Set breadcrumbs when team data is loaded
  useEffect(() => {
    if (details) {
      setBreadcrumbs([
        { label: "Teams", href: "/admin/teams" },
        { label: details.team_name, href: `/admin/teams/${teamId}` },
      ]);
    }
  }, [details, teamId]);

  if (isLoading) return <div className="p-8">Loading team details...</div>;
  if (isError)
    return (
      <div className="p-8 space-y-4">
        <Button variant="outline" className="gap-2" onClick={() => router.push("/admin/teams")}>
          <ArrowLeft className="size-4" /> Back to Teams
        </Button>
        <p className="text-destructive">Failed to load team. The team may not exist or there was a server error.</p>
      </div>
    );
  if (!details || !details.team_name)
    return (
      <div className="p-8 space-y-4">
        <Button variant="outline" className="gap-2" onClick={() => router.push("/admin/teams")}>
          <ArrowLeft className="size-4" /> Back to Teams
        </Button>
        <p>Team not found.</p>
      </div>
    );

  const team = details;
  const history: any[] = details.history ?? [];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Submitted":
        return "default";
      case "Active":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/admin/teams")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {team.team_name}
            <Badge variant="outline">{team.track}</Badge>
          </h1>
        </div>
      </header>

      <div className="grid gap-6">
        <Card
          className={cn(
            "overflow-hidden border-white/10 bg-card/80 shadow-lg backdrop-blur-sm",
            "dark:border-white/10 dark:bg-card/80",
          )}
        >
          <CardHeader>
            <CardTitle>Round History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-auto rounded-xl border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-semibold">Round</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Selection</TableHead>
                    <TableHead className="font-semibold">Submission</TableHead>
                    <TableHead className="font-semibold">Score</TableHead>
                    <TableHead className="font-semibold">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((round: any) => (
                    <TableRow key={round.round_id} className="border-border/50">
                      <TableCell className="font-medium">
                        {round.round_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(round.status)}>
                          {round.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {round.selection || (
                          <span className="italic">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {round.github_link && (
                            <a
                              href={round.github_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 transition-colors"
                              title="GitHub link"
                            >
                              <Github className="size-4" />
                            </a>
                          )}
                          {round.submission_file && (
                            <a
                              href={round.submission_file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 transition-colors"
                              title="Submission file"
                            >
                              <FileText className="size-4" />
                            </a>
                          )}
                          {!round.github_link && !round.submission_file && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {round.score !== null ? round.score : "—"}
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground max-w-xs truncate"
                        title={round.remarks}
                      >
                        {round.remarks || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
