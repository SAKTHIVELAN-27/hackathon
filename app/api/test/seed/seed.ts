import { connectDB } from "@/config/db";
import User from "@/models/User";
import Team from "@/models/Team";
import Round from "@/models/Round";
import Judge from "@/models/Judge";
import Track from "@/models/Track";
import Subtask from "@/models/Subtask";
import RoundOptions from "@/models/RoundOptions";
import Submission from "@/models/Submission";
import Score from "@/models/Score";
import mongoose from "mongoose";

interface ISeedResult {
  success: boolean;
  message: string;
  data?: any;
}

// Configuration - Easily change these values
const SEED_CONFIG = {
  admin: {
    email: "sakthivelanss02@gmail.com",
    role: "admin",
  },
  judge: {
    email: "gowreesh4343@gmail.com",
    role: "judge",
    name: "Gowreesh Judge",
  },
  teamLeader: {
    email: "gowreesh287@gmail.com",
    role: "team",
    teamName: "TopDevs United",
  },
  teamMembers: [
    { email: "alice@vitstudent.ac.in", name: "Alice Dev Squad" },
    { email: "bob@vitstudent.ac.in", name: "Bob's Code Warriors" },
    { email: "charlie@vitstudent.ac.in", name: "Charlie's Tech Team" },
    { email: "diana@vitstudent.ac.in", name: "Diana's Coders" },
  ],
};

async function seedDatabase(): Promise<ISeedResult> {
  try {
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      Round.deleteMany({}),
      Judge.deleteMany({}),
      Track.deleteMany({}),
      Subtask.deleteMany({}),
      RoundOptions.deleteMany({}),
      Submission.deleteMany({}),
      Score.deleteMany({}),
    ]);

    console.log("✓ Cleared existing data");

    // Create Users - Admin
    const adminUser = await User.create({
      email: SEED_CONFIG.admin.email,
      role: SEED_CONFIG.admin.role,
    });
    console.log("✓ Created Admin User");

    // Create Tracks
    const webDevTrack = await Track.create({
      name: "Web Development",
      description: "Full-stack web development challenges",
      is_active: true,
    });

    const mobileDevTrack = await Track.create({
      name: "Mobile Development",
      description: "Mobile app development challenges",
      is_active: true,
    });

    const dataScienceTrack = await Track.create({
      name: "Data Science",
      description: "Data analysis and machine learning challenges",
      is_active: true,
    });
    console.log("✓ Created Tracks");

    // Create Users - Judge
    const judgeUser = await User.create({
      email: SEED_CONFIG.judge.email,
      role: SEED_CONFIG.judge.role,
    });
    console.log("✓ Created Judge User");

    // Create Judge Profile
    const judge = await Judge.create({
      user_id: judgeUser._id,
      judge_name: SEED_CONFIG.judge.name,
      track_id: webDevTrack._id,
    });
    console.log("✓ Created Judge Profile");

    // Create Teams
    const teamLeaderUser = await User.create({
      email: SEED_CONFIG.teamLeader.email,
      role: SEED_CONFIG.teamLeader.role,
    });

    const team1 = await Team.create({
      team_name: SEED_CONFIG.teamLeader.teamName,
      track_id: webDevTrack._id,
      user_id: teamLeaderUser._id,
    });
    await User.updateOne({ _id: teamLeaderUser._id }, { team_id: team1._id });
    console.log("✓ Created Team 1 - " + SEED_CONFIG.teamLeader.teamName);

    // Create additional team members
    const teamIds: mongoose.Types.ObjectId[] = [team1._id];

    for (let i = 0; i < SEED_CONFIG.teamMembers.length; i++) {
      const user = await User.create({
        email: SEED_CONFIG.teamMembers[i].email,
        role: "team",
      });

      const team = await Team.create({
        team_name: SEED_CONFIG.teamMembers[i].name,
        track_id:
          i % 3 === 0
            ? webDevTrack._id
            : i % 3 === 1
              ? mobileDevTrack._id
              : dataScienceTrack._id,
        user_id: user._id,
      });

      await User.updateOne({ _id: user._id }, { team_id: team._id });
      teamIds.push(team._id);
      console.log(
        `✓ Created Team ${i + 2} - ${SEED_CONFIG.teamMembers[i].name}`,
      );
    }

    // Assign all teams to the judge
    await Judge.updateOne({ _id: judge._id }, { teams_assigned: teamIds });
    console.log("✓ Assigned teams to judge");

    // Create Rounds
    const now = new Date();
    const round1StartTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
    const round1EndTime = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now

    const round2StartTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const round2EndTime = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    const round1 = await Round.create({
      round_number: 1,
      start_time: round1StartTime,
      end_time: round1EndTime,
      is_active: true,
      instructions:
        "Build a responsive web application that solves a real-world problem.",
    });
    console.log("✓ Created Round 1");

    const round2 = await Round.create({
      round_number: 2,
      start_time: round2StartTime,
      end_time: round2EndTime,
      is_active: false,
      instructions:
        "Enhance your solution with advanced features and optimizations.",
    });
    console.log("✓ Created Round 2");

    const round3StartTime = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
    const round3EndTime = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

    const round3 = await Round.create({
      round_number: 3,
      start_time: round3StartTime,
      end_time: round3EndTime,
      is_active: false,
      instructions: "Continue building your assigned 3 subtasks.",
    });
    console.log("✓ Created Round 3");

    const round4StartTime = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000);
    const round4EndTime = new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000);

    const round4 = await Round.create({
      round_number: 4,
      start_time: round4StartTime,
      end_time: round4EndTime,
      is_active: false,
      instructions:
        "Integration Round: Integrate the 3 subtasks built by another team with your work.",
    });
    console.log("✓ Created Round 4");

    // Update teams with accessible rounds
    await Team.updateMany(
      { _id: { $in: teamIds } },
      { rounds_accessible: [round1._id, round2._id, round3._id, round4._id] },
    );

    // Create Subtasks for Web Development Track (6 subtasks)
    const subtask1_1 = await Subtask.create({
      title: "API Development",
      description: "Create a RESTful API with Express.js",
      track_id: webDevTrack._id,
      is_active: true,
    });

    const subtask1_2 = await Subtask.create({
      title: "Authentication System",
      description: "Implement JWT-based authentication",
      track_id: webDevTrack._id,
      is_active: true,
    });

    const subtask1_3 = await Subtask.create({
      title: "Database Schema",
      description: "Design and implement MongoDB schema",
      track_id: webDevTrack._id,
      is_active: true,
    });

    const subtask1_4 = await Subtask.create({
      title: "React Frontend",
      description: "Build a modern React dashboard",
      track_id: webDevTrack._id,
      is_active: true,
    });

    const subtask1_5 = await Subtask.create({
      title: "State Management",
      description: "Implement Redux for state management",
      track_id: webDevTrack._id,
      is_active: true,
    });

    const subtask1_6 = await Subtask.create({
      title: "Responsive Design",
      description: "Make the application mobile-responsive",
      track_id: webDevTrack._id,
      is_active: true,
    });

    // Create Subtasks for Mobile Development Track (6 subtasks)
    const subtask1_m1 = await Subtask.create({
      title: "App Navigation",
      description: "Set up React Navigation",
      track_id: mobileDevTrack._id,
      is_active: true,
    });

    const subtask1_m2 = await Subtask.create({
      title: "User Authentication",
      description: "Implement user login and signup",
      track_id: mobileDevTrack._id,
      is_active: true,
    });

    const subtask1_m3 = await Subtask.create({
      title: "Feed Screen",
      description: "Create a social media feed",
      track_id: mobileDevTrack._id,
      is_active: true,
    });

    const subtask1_m4 = await Subtask.create({
      title: "Post Creation",
      description: "Add functionality to create posts",
      track_id: mobileDevTrack._id,
      is_active: true,
    });

    const subtask1_m5 = await Subtask.create({
      title: "Local Storage",
      description: "Implement offline data persistence",
      track_id: mobileDevTrack._id,
      is_active: true,
    });

    const subtask1_m6 = await Subtask.create({
      title: "Push Notifications",
      description: "Add push notification support",
      track_id: mobileDevTrack._id,
      is_active: true,
    });

    // Create Subtasks for Data Science Track (6 subtasks)
    const subtask1_d1 = await Subtask.create({
      title: "Data Collection",
      description: "Gather and preprocess dataset",
      track_id: dataScienceTrack._id,
      is_active: true,
    });

    const subtask1_d2 = await Subtask.create({
      title: "Exploratory Analysis",
      description: "Perform EDA and visualization",
      track_id: dataScienceTrack._id,
      is_active: true,
    });

    const subtask1_d3 = await Subtask.create({
      title: "Feature Engineering",
      description: "Create and select features",
      track_id: dataScienceTrack._id,
      is_active: true,
    });

    const subtask1_d4 = await Subtask.create({
      title: "Model Training",
      description: "Train machine learning model",
      track_id: dataScienceTrack._id,
      is_active: true,
    });

    const subtask1_d5 = await Subtask.create({
      title: "Model Evaluation",
      description: "Evaluate and tune model performance",
      track_id: dataScienceTrack._id,
      is_active: true,
    });

    const subtask1_d6 = await Subtask.create({
      title: "Deployment Pipeline",
      description: "Create model deployment pipeline",
      track_id: dataScienceTrack._id,
      is_active: true,
    });

    console.log("✓ Created all Subtasks for all tracks");

    // Create Subtasks for Round 2 - Web Dev (6 more advanced subtasks)
    const subtask2_1 = await Subtask.create({
      title: "Database Optimization",
      description: "Optimize database queries and schema",
      track_id: webDevTrack._id,
      is_active: true,
    });

    const subtask2_2 = await Subtask.create({
      title: "Caching Strategy",
      description: "Implement Redis caching",
      track_id: webDevTrack._id,
      is_active: true,
    });

    const subtask2_3 = await Subtask.create({
      title: "API Performance",
      description: "Reduce API response time",
      track_id: webDevTrack._id,
      is_active: true,
    });

    const subtask2_4 = await Subtask.create({
      title: "UI/UX Enhancement",
      description: "Improve user interface and experience",
      track_id: webDevTrack._id,
      is_active: true,
    });

    const subtask2_5 = await Subtask.create({
      title: "Accessibility",
      description: "Make app accessible (WCAG compliant)",
      track_id: webDevTrack._id,
      is_active: true,
    });

    const subtask2_6 = await Subtask.create({
      title: "Testing Coverage",
      description: "Add unit and integration tests",
      track_id: webDevTrack._id,
      is_active: true,
    });

    // Create Subtasks for Round 2 - Mobile Dev (6 more advanced subtasks)
    const subtask2_m1 = await Subtask.create({
      title: "Offline Mode",
      description: "Implement full offline functionality",
      track_id: mobileDevTrack._id,
      is_active: true,
    });

    const subtask2_m2 = await Subtask.create({
      title: "Real-time Updates",
      description: "Add WebSocket for real-time communication",
      track_id: mobileDevTrack._id,
      is_active: true,
    });

    const subtask2_m3 = await Subtask.create({
      title: "Image Processing",
      description: "Implement image upload and compression",
      track_id: mobileDevTrack._id,
      is_active: true,
    });

    const subtask2_m4 = await Subtask.create({
      title: "Biometric Authentication",
      description: "Add fingerprint/face recognition",
      track_id: mobileDevTrack._id,
      is_active: true,
    });

    const subtask2_m5 = await Subtask.create({
      title: "Background Tasks",
      description: "Implement background job processing",
      track_id: mobileDevTrack._id,
      is_active: true,
    });

    const subtask2_m6 = await Subtask.create({
      title: "App Analytics",
      description: "Integrate analytics and crash reporting",
      track_id: mobileDevTrack._id,
      is_active: true,
    });

    // Create Subtasks for Round 2 - Data Science (6 more advanced subtasks)
    const subtask2_d1 = await Subtask.create({
      title: "Data Collection",
      description: "Set up data collection and ingestion",
      track_id: dataScienceTrack._id,
      is_active: true,
    });

    const subtask2_d2 = await Subtask.create({
      title: "Data Cleaning",
      description: "Clean and preprocess raw data",
      track_id: dataScienceTrack._id,
      is_active: true,
    });

    const subtask2_d3 = await Subtask.create({
      title: "Exploratory Analysis",
      description: "Perform exploratory data analysis",
      track_id: dataScienceTrack._id,
      is_active: true,
    });

    const subtask2_d4 = await Subtask.create({
      title: "Feature Engineering",
      description: "Create and select relevant features",
      track_id: dataScienceTrack._id,
      is_active: true,
    });

    const subtask2_d5 = await Subtask.create({
      title: "Model Training",
      description: "Train and evaluate ML models",
      track_id: dataScienceTrack._id,
      is_active: true,
    });

    const subtask2_d6 = await Subtask.create({
      title: "Visualization Dashboard",
      description: "Create interactive data visualizations",
      track_id: dataScienceTrack._id,
      is_active: true,
    });

    console.log("✓ Created all Subtasks for Round 2 (All Tracks)");

    // Note: Each track has 6 subtasks total (18 subtasks across 3 tracks)
    // Teams work on their assigned 3 subtasks across Rounds 1, 2, and 3
    // Round 4 is for integration of the other team's 3 subtasks

    // Create RoundOptions for teams
    // Strategy: Each round, teams get 2 options and must select 1
    // Teams are assigned to work on a subset of subtasks across rounds
    // In Round 4, they get 2 options from the OTHER team's work to integrate

    // ROUND 1 OPTIONS - Each team gets 2 options from their assigned subtasks
    // Team 1 (Web Dev - Code Ninjas) - Gets 2 options from subtasks 1, 2, 3
    await RoundOptions.create({
      team_id: team1._id,
      round_id: round1._id,
      options: [subtask1_1._id, subtask1_2._id],
      selected: subtask1_1._id,
      selected_at: new Date(now.getTime() - 20 * 60 * 60 * 1000),
    });

    // Team 2 (Web Dev - Alice Dev Squad) - Gets 2 options from subtasks 4, 5, 6
    await RoundOptions.create({
      team_id: teamIds[1],
      round_id: round1._id,
      options: [subtask1_4._id, subtask1_5._id],
      selected: subtask1_4._id,
      selected_at: new Date(now.getTime() - 18 * 60 * 60 * 1000),
    });

    // Team 3 (Mobile Dev - Bob's Code Warriors) - Gets 2 options from subtasks 1, 2, 3
    await RoundOptions.create({
      team_id: teamIds[2],
      round_id: round1._id,
      options: [subtask1_m1._id, subtask1_m2._id],
      selected: subtask1_m1._id,
      selected_at: new Date(now.getTime() - 16 * 60 * 60 * 1000),
    });

    // Team 4 (Data Science - Charlie's Tech Team) - Gets 2 options from Data Science track subtasks
    await RoundOptions.create({
      team_id: teamIds[3],
      round_id: round1._id,
      options: [subtask1_d1._id, subtask1_d2._id],
      selected: subtask1_d1._id,
      selected_at: new Date(now.getTime() - 14 * 60 * 60 * 1000),
    });

    // Team 5 (Web Dev - Diana's Coders) - Gets 2 options from subtasks 4, 5, 6
    await RoundOptions.create({
      team_id: teamIds[4],
      round_id: round1._id,
      options: [subtask1_5._id, subtask1_6._id],
      selected: subtask1_5._id,
      selected_at: new Date(now.getTime() - 15 * 60 * 60 * 1000),
    });

    // ROUND 2 OPTIONS - Different 2 options from their assigned subtasks
    await RoundOptions.create({
      team_id: team1._id,
      round_id: round2._id,
      options: [subtask1_2._id, subtask1_3._id],
      selected: subtask1_2._id,
    });

    await RoundOptions.create({
      team_id: teamIds[1],
      round_id: round2._id,
      options: [subtask1_5._id, subtask1_6._id],
      selected: subtask1_5._id,
    });

    await RoundOptions.create({
      team_id: teamIds[2],
      round_id: round2._id,
      options: [subtask1_m2._id, subtask1_m3._id],
      selected: subtask1_m2._id,
    });

    await RoundOptions.create({
      team_id: teamIds[3],
      round_id: round2._id,
      options: [subtask1_d2._id, subtask1_d3._id],
      selected: subtask1_d3._id,
    });

    await RoundOptions.create({
      team_id: teamIds[4],
      round_id: round2._id,
      options: [subtask1_4._id, subtask1_6._id],
      selected: subtask1_6._id,
    });

    // ROUND 3 OPTIONS - Different 2 options from their assigned subtasks
    await RoundOptions.create({
      team_id: team1._id,
      round_id: round3._id,
      options: [subtask1_1._id, subtask1_3._id],
      selected: subtask1_3._id,
    });

    await RoundOptions.create({
      team_id: teamIds[1],
      round_id: round3._id,
      options: [subtask1_4._id, subtask1_6._id],
      selected: subtask1_6._id,
    });

    await RoundOptions.create({
      team_id: teamIds[3],
      round_id: round3._id,
      options: [subtask1_d1._id, subtask1_d3._id],
      selected: subtask1_d1._id,
    });

    await RoundOptions.create({
      team_id: teamIds[2],
      round_id: round3._id,
      options: [subtask1_m1._id, subtask1_m3._id],
      selected: subtask1_m3._id,
    });

    await RoundOptions.create({
      team_id: teamIds[4],
      round_id: round3._id,
      options: [subtask1_4._id, subtask1_5._id],
      selected: subtask1_4._id,
    });

    // ROUND 4 OPTIONS (Integration Round - Teams get 2 options from the OTHER team's subtasks)
    // Team 1 now gets 2 options from subtasks 4, 5, 6 (built by Teams 2 & 5)
    await RoundOptions.create({
      team_id: team1._id,
      round_id: round4._id,
      options: [subtask1_4._id, subtask1_5._id],
      selected: null, // Not started yet
    });

    // Team 2 now gets 2 options from subtasks 1, 2, 3 (built by Team 1)
    await RoundOptions.create({
      team_id: teamIds[1],
      round_id: round4._id,
      options: [subtask1_1._id, subtask1_2._id],
      selected: null,
    });

    // Team 3 (Mobile) gets 2 options from the other mobile subtasks
    await RoundOptions.create({
      team_id: teamIds[2],
      round_id: round4._id,
      options: [subtask1_m4._id, subtask1_m5._id],
      selected: null,
    });

    // Team 4 (Data Science) gets 2 options from the other data science subtasks
    await RoundOptions.create({
      team_id: teamIds[3],
      round_id: round4._id,
      options: [subtask1_d4._id, subtask1_d5._id],
      selected: null,
    });

    // Team 5 now gets subtasks 1, 2, 3 (built by Team 1)
    await RoundOptions.create({
      team_id: teamIds[4],
      round_id: round4._id,
      options: [subtask1_1._id, subtask1_2._id, subtask1_3._id],
      selected: null,
    });

    console.log("✓ Created Round Options for Rounds 1-4");

    // Create Sample Submissions for Team 1
    const submission1 = await Submission.create({
      team_id: team1._id,
      round_id: round1._id,
      file_url: "https://docs.google.com/document/d/example1",
      github_link: "https://github.com/code-ninjas/api-project",
      overview:
        "Built a robust REST API using Express.js with JWT authentication, MongoDB integration, and comprehensive error handling. Includes endpoints for user management, data CRUD operations, and rate limiting.",
      submitted_at: new Date(now.getTime() + 12 * 60 * 60 * 1000), // 12 hours from now
      is_locked: false,
    });
    console.log("✓ Created Sample Submission 1");

    // Create Scores for Sample Submission
    const score1 = await Score.create({
      judge_id: judge._id,
      submission_id: submission1._id,
      score: 8,
      remarks:
        "Excellent API design with proper error handling and authentication. Could improve on documentation and unit test coverage.",
      status: "scored",
    });
    console.log("✓ Created Sample Score 1");

    // Create additional submissions for other teams
    const submission2 = await Submission.create({
      team_id: teamIds[1],
      round_id: round1._id,
      file_url: "https://docs.google.com/document/d/example2",
      github_link: "https://github.com/alice-squad/react-dashboard",
      overview:
        "Created a modern React dashboard with Redux state management, Material-UI components, and real-time data updates. Features include user authentication, dark mode, and responsive design.",
      submitted_at: new Date(now.getTime() + 10 * 60 * 60 * 1000),
      is_locked: false,
    });

    const score2 = await Score.create({
      judge_id: judge._id,
      submission_id: submission2._id,
      score: 7,
      remarks:
        "Good React practices and UI design. State management could be optimized. Missing some accessibility features.",
      status: "scored",
    });
    console.log("✓ Created Additional Sample Submissions and Scores");

    const result = {
      admin: {
        email: SEED_CONFIG.admin.email,
        role: SEED_CONFIG.admin.role,
      },
      judge: {
        email: SEED_CONFIG.judge.email,
        role: SEED_CONFIG.judge.role,
        name: SEED_CONFIG.judge.name,
      },
      teams: [
        {
          email: SEED_CONFIG.teamLeader.email,
          teamName: SEED_CONFIG.teamLeader.teamName,
          track: "Web Development",
          role: SEED_CONFIG.teamLeader.role,
          hasSubmission: true,
          hasScore: true,
        },
        ...SEED_CONFIG.teamMembers.map((member, i) => ({
          email: member.email,
          teamName: member.name,
          track:
            i % 3 === 0
              ? "Web Development"
              : i % 3 === 1
                ? "Mobile Development"
                : "Data Science",
          role: "team",
          hasSubmission: i === 0,
          hasScore: i === 0,
        })),
      ],
      rounds: [
        {
          number: 1,
          status: "active",
          startTime: round1StartTime,
          endTime: round1EndTime,
          submissions: 2,
          scores: 2,
          description: "Teams work on their assigned 3 subtasks",
        },
        {
          number: 2,
          status: "inactive",
          startTime: round2StartTime,
          endTime: round2EndTime,
          submissions: 0,
          scores: 0,
          description: "Teams continue on their 3 subtasks",
        },
        {
          number: 3,
          status: "inactive",
          startTime: round3StartTime,
          endTime: round3EndTime,
          submissions: 0,
          scores: 0,
          description: "Teams finalize their 3 subtasks",
        },
        {
          number: 4,
          status: "inactive",
          startTime: round4StartTime,
          endTime: round4EndTime,
          submissions: 0,
          scores: 0,
          description:
            "Integration Round: Teams integrate the other 3 subtasks",
        },
      ],
      tracks: [
        {
          name: "Web Development",
          description: "Full-stack web development challenges",
        },
        {
          name: "Mobile Development",
          description: "Mobile app development challenges",
        },
        {
          name: "Data Science",
          description: "Data analysis and machine learning challenges",
        },
      ],
      subtasks: {
        note: "Each track has 6 subtasks. Each round, teams get 2 subtask options and must select 1. Rounds 1-3 use the same subtasks. Round 4 is for integration.",
        structure: [
          {
            track: "Web Development",
            subtasksCount: 6,
            optionsPerRound: 2,
          },
          {
            track: "Mobile Development",
            subtasksCount: 6,
            optionsPerRound: 2,
          },
          {
            track: "Data Science",
            subtasksCount: 6,
            optionsPerRound: 2,
          },
        ],
      },
      scores: [
        {
          team: "Code Ninjas",
          round: 1,
          score: 8,
          status: "scored",
          remarks:
            "Excellent API design with proper error handling and authentication.",
        },
        {
          team: "Alice Dev Squad",
          round: 1,
          score: 7,
          status: "scored",
          remarks:
            "Good React practices and UI design. Could optimize state management.",
        },
      ],
      summary: {
        totalTeams: 5,
        totalTracks: 3,
        totalRounds: 4,
        totalSubtasks: 18,
        roundOptionsCreated: 20,
        submissionsCreated: 2,
        scoresCreated: 2,
        structure:
          "Each track has 6 subtasks. Each round: Teams shown 2 options and select 1. Rounds 1-3: Build subtasks. Round 4: Integrate other team's work.",
      },
    };

    return {
      success: true,
      message: "Database seeded successfully!",
      data: result,
    };
  } catch (error: any) {
    console.error("❌ Seed Error:", error);
    return {
      success: false,
      message: `Seed failed: ${error.message}`,
    };
  }
}

export default seedDatabase;
