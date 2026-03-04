import Navbar from "@/components/Navbar";

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
