import Navbar from "@/components/Navbar";

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-4">{children}</main>
    </>
  );
}
