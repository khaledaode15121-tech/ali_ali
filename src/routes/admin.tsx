import { createFileRoute } from "@tanstack/react-router";
import { PageFrame } from "@/components/PageFrame";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم | صالون أم علي للأناقة" },
      { name: "description", content: "إدارة الأقسام والفساتين والعروض في صالون أم علي للأناقة." },
      { property: "og:title", content: "لوحة التحكم | صالون أم علي للأناقة" },
      { property: "og:description", content: "إدارة الأقسام والفساتين والعروض في صالون أم علي للأناقة." },
    ],
  }),
  component: () => <PageFrame src="/pages/admin.html" title="لوحة التحكم | صالون أم علي للأناقة" />,
});
