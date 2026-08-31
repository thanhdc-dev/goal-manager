export const environment = {
  production: false,
  // API nội bộ (auth OAuth v2 + sync REST) — thay thế Supabase
  apiBaseUrl: "http://localhost:3000",
  appKey: "goal-tracker",
  providers: ["google", "github", "zalo"] as const,
};
