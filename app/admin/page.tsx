"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileCheck, Clock, Trophy } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useGetAdminDashboardQuery } from "@/lib/redux/api/adminApi";
import { setBreadcrumbs } from "@/lib/hooks/useBreadcrumb";

export default function AdminDashboardPage() {
  useEffect(() => {
    setBreadcrumbs([]);
  }, []);

  const { data: stats, isLoading } = useGetAdminDashboardQuery();

  const loading = isLoading || !stats;

  const evaluationData = [
    { name: "Submitted", value: stats?.submissionsCount || 0, fill: "#10b981" },
    {
      name: "Pending",
      value: stats?.pendingEvaluationCount || 0,
      fill: "#f59e0b",
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Admin Dashboard
        </h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Teams Overview */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-muted-foreground" />
              Teams overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="mt-2 h-4 w-48" />
              </>
            ) : (
              <>
                <p className="text-3xl font-bold">{stats.totalTeams}</p>
                <p className="text-sm text-muted-foreground">
                  total registered teams
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Current Round */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-muted-foreground" />
              Current round status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Submissions</p>
                  <p className="text-2xl font-semibold">
                    {stats.submissionsCount}
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">
                    Pending evaluation
                  </p>
                  <p className="text-2xl font-semibold">
                    {stats.pendingEvaluationCount}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission Chart */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="size-5 text-muted-foreground" />
              Submission status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={evaluationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {evaluationData.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Team Distribution */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-muted-foreground" />
              Team distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: "Teams",
                      active: Math.floor(stats.totalTeams * 0.6),
                      shortlisted: Math.floor(stats.totalTeams * 0.25),
                      eliminated: Math.floor(stats.totalTeams * 0.15),
                    },
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="active" stackId="a" fill="#10b981" />
                  <Bar dataKey="shortlisted" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="eliminated" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Teams */}
        <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-muted-foreground" />
              Top 5 teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {stats?.topTeams?.map((team, i) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.track}
                      </p>
                    </div>
                    <p className="font-semibold">{team.cumulativeScore}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
