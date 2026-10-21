export function PageFrame({ src, title }: { src: string; title: string }) {
  return <iframe src={src} title={title} className="fixed inset-0 h-screen w-screen border-0" />;
}
