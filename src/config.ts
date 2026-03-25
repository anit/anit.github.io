export const SITE = {
  website: "https://anit.vercel.app/", // update after Vercel deploy
  author: "Anit Rai",
  profile: "",
  desc: "Fractional CTO & Infrastructure Architect. I help startups build reliable infra and ship faster.",
  title: "Anit Rai",
  ogImage: "anit-og.png",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 8,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: false,
  showBackButton: true,
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "",
  },
  dynamicOgImage: true,
  dir: "ltr",
  lang: "en",
  timezone: "Asia/Kolkata",
} as const;
