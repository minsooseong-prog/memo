import { MainShell } from "@/components/layout/main-shell";

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return <MainShell>{children}</MainShell>;
}
