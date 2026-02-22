"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useGetTeamRoundsQuery } from "@/lib/redux/api/teamApi";
import { setBreadcrumbs } from "@/lib/hooks/useBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function Page() {
  const { data: rounds = [], isLoading } = useGetTeamRoundsQuery();

  useEffect(() => {
    setBreadcrumbs([{ label: "Rounds", href: "/team/rounds" }]);
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Available Rounds
        </h1>
        <p className="text-sm text-muted-foreground">
          Select a round to view and manage your submissions
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Rounds</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border border-border max-h-96 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50">
                <TableRow>
                  <TableHead>Round</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Subtask</TableHead>
                  <TableHead>Submission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>

                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>

                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>

                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>

                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>

                      <TableCell>
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </TableCell>

                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-20 ml-auto rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rounds.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-40 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-6 w-6" />
                        No rounds are currently available.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rounds.map((round: any) => (
                    <TableRow
                      key={round._id}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-semibold">
                        Round {round.round_number}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatDate(round.start_time)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatDate(round.end_time)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {round.has_selected ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">
                            {round.has_selected
                              ? "Selected"
                              : "Not Selected"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {round.has_submitted ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">
                            {round.has_submitted
                              ? "Submitted"
                              : "Not Submitted"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            round.is_active
                              ? "default"
                              : round.submission_enabled
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {round.is_active
                            ? "Active"
                            : round.submission_enabled
                            ? "Submissions Open"
                            : "Locked"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Link href={`/team/rounds/${round._id}`}>
                          <Button size="sm" variant="outline">
                            {round.has_submitted ? "View" : "Open"}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
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
