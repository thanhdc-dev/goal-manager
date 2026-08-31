export const environment = {
  production: true,
  // API nội bộ (auth OAuth v2 + sync REST) — thay thế Supabase
  apiBaseUrl: "https://api.thanhdc.dev",
  appKey: "goal-tracker",
  providers: ["google", "github", "zalo"] as const,
};
