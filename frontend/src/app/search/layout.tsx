import Navbar from "@/components/Navbar";

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
