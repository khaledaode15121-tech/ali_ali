import { createFileRoute } from "@tanstack/react-router";
import { PageFrame } from "@/components/PageFrame";

export const Route = createFileRoute("/product")({
  head: () => ({
    meta: [
      { title: "تفاصيل الفستان | صالون أم علي للأناقة" },
      { name: "description", content: "تفاصيل الفستان، الأسعار للبيع والإيجار، المقاسات والطلب عبر واتساب." },
      { property: "og:title", content: "تفاصيل الفستان | صالون أم علي للأناقة" },
      { property: "og:description", content: "تفاصيل الفستان، الأسعار للبيع والإيجار، المقاسات والطلب عبر واتساب." },
    ],
  }),
  component: () => <PageFrame src="/pages/product.html" title="تفاصيل الفستان | صالون أم علي للأناقة" />,
});
