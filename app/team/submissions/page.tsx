"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import { useGetTeamSubmissionsQuery } from "@/lib/redux/api/teamApi";
import { setBreadcrumbs } from "@/lib/hooks/useBreadcrumb";
import { ensureAbsoluteUrl } from "@/lib/utils";

export default function TeamSubmissionsPage() {
  const { data: submissions = [], isLoading } =
    useGetTeamSubmissionsQuery();

  useEffect(() => {
    setBreadcrumbs([{ label: "Submissions", href: "/team/submissions" }]);
  }, []);

  return (
    <div className="flex min-h-screen flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>
        <p className="text-muted-foreground">
          View your submission history.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submission History</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            /* Skeleton Table */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    {[
                      "Round",
                      "Submitted At",
                      "Links",
                      "Overview",
                      "Score",
                      "Status",
                      "Remarks",
                    ].map((h) => (
                      <th key={h} className="px-6 py-3 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-6 py-4 space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-12" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : submissions.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full border border-border bg-muted p-3">
                <svg
                  className="h-6 w-6 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-semibold">
                No submissions yet
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Once you submit a project for a round, it will appear here.
              </p>
            </div>
          ) : (
            /* Actual Data */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 text-left">Round</th>
                    <th className="px-6 py-3 text-left">
                      Submitted At
                    </th>
                    <th className="px-6 py-3 text-left">Links</th>
                    <th className="px-6 py-3 text-left">
                      Overview
                    </th>
                    <th className="px-6 py-3 text-left">Score</th>
                    <th className="px-6 py-3 text-left">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left">
                      Remarks
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {submissions.map((sub) => (
                    <tr
                      key={sub._id}
                      className="border-b border-border transition hover:bg-muted/50"
                    >
                      <td className="px-6 py-4 font-medium">
                        {sub.round_id?.round_number
                          ? `Round ${sub.round_id.round_number}`
                          : "Unknown Round"}
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {sub.github_link && (
                            <a
                              href={ensureAbsoluteUrl(sub.github_link)}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              GitHub <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {sub.file_url && (
                            <a
                              href={ensureAbsoluteUrl(sub.file_url)}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              Document{" "}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      <td
                        className="px-6 py-4 max-w-xs truncate text-muted-foreground"
                        title={sub.overview}
                      >
                        {sub.overview || "-"}
                      </td>

                      <td className="px-6 py-4">
                        {sub.score ? (
                          <span className="font-semibold text-primary">
                            {sub.score.score}/100
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            -
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant="outline">
                          {sub.score?.status || "Pending"}
                        </Badge>
                      </td>

                      <td
                        className="px-6 py-4 max-w-xs truncate text-muted-foreground"
                        title={sub.score?.remarks}
                      >
                        {sub.score?.remarks || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
