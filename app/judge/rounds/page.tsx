"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Users } from "lucide-react";
import {
  useGetJudgeRoundsQuery,
  useGetJudgeAssignedTeamsQuery,
} from "@/lib/redux/api/judgeApi";
import { setBreadcrumbs } from "@/lib/hooks/useBreadcrumb";

/** Per-round stats row fetched via RTK Query (avoids raw fetch loops). */
function RoundStatsRow({
  round,
  onView,
}: {
  round: any;
  onView: (id: string) => void;
}) {
  const { data: teams = [], isLoading: loadingTeams } =
    useGetJudgeAssignedTeamsQuery(round.id);

  const assignedTeams = teams.length;
  const scored = teams.filter((t: any) => t.status === "scored").length;
  const pending = assignedTeams - scored;

  return (
    <TableRow className="border-border/50 transition hover:bg-muted/50">
      <TableCell className="font-medium">Round {round.round_number}</TableCell>

      <TableCell className="text-center">
        {loadingTeams ? (
          <Skeleton className="mx-auto h-4 w-10" />
        ) : (
          <span className="inline-flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            {assignedTeams}
          </span>
        )}
      </TableCell>

      <TableCell className="text-center">
        {loadingTeams ? (
          <Skeleton className="mx-auto h-5 w-10 rounded-full" />
        ) : (
          <Badge variant="secondary">{pending}</Badge>
        )}
      </TableCell>

      <TableCell className="text-center">
        {loadingTeams ? (
          <Skeleton className="mx-auto h-5 w-10 rounded-full" />
        ) : (
          <Badge variant="default">{scored}</Badge>
        )}
      </TableCell>

      <TableCell className="text-center">
        <Badge variant={round.is_active ? "default" : "secondary"}>
          {round.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>

      <TableCell className="text-right">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onView(round.id)}
        >
          View Teams
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function JudgeRoundsPage() {
  const router = useRouter();
  const { data: rounds = [], isLoading } = useGetJudgeRoundsQuery();

  useEffect(() => {
    setBreadcrumbs([{ label: "Rounds", href: "/judge/rounds" }]);
  }, []);

  const showSkeleton = isLoading;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Evaluation Rounds
        </h1>
      </header>

      <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Available Rounds
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="max-h-96 overflow-auto rounded-xl border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Round</TableHead>
                  <TableHead className="text-center">
                    Assigned Teams
                  </TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead className="text-center">Scored</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {showSkeleton ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} className="border-border/50">
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>

                      <TableCell className="text-center">
                        <Skeleton className="mx-auto h-4 w-10" />
                      </TableCell>

                      <TableCell className="text-center">
                        <Skeleton className="mx-auto h-5 w-10 rounded-full" />
                      </TableCell>

                      <TableCell className="text-center">
                        <Skeleton className="mx-auto h-5 w-10 rounded-full" />
                      </TableCell>

                      <TableCell className="text-center">
                        <Skeleton className="mx-auto h-5 w-16 rounded-full" />
                      </TableCell>

                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-8 w-24 rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rounds.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-40 text-center text-muted-foreground"
                    >
                      No rounds available yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rounds.map((round: any) => (
                    <RoundStatsRow
                      key={round.id}
                      round={round}
                      onView={(id) => router.push(`/judge/rounds/${id}`)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
