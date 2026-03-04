import Navbar from "@/components/Navbar";

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-4">{children}</main>
    </>
  );
}
