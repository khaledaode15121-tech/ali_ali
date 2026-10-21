import { createFileRoute } from "@tanstack/react-router";
import { PageFrame } from "@/components/PageFrame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "صالون أم علي للأناقة | فساتين عرس وخطوبة وسهرة" },
      { name: "description", content: "تسوقي واستأجري فساتين العرس والخطوبة والسهرة من صالون أم علي للأناقة." },
      { property: "og:title", content: "صالون أم علي للأناقة | فساتين عرس وخطوبة وسهرة" },
      { property: "og:description", content: "تسوقي واستأجري فساتين العرس والخطوبة والسهرة من صالون أم علي للأناقة." },
    ],
  }),
  component: () => <PageFrame src="/pages/home.html" title="صالون أم علي للأناقة | فساتين عرس وخطوبة وسهرة" />,
});
