import Navbar from "@/components/Navbar";

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
