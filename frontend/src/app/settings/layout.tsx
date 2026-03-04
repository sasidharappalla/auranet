import Navbar from "@/components/Navbar";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
