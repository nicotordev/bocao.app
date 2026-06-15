export default function FloorPlanLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-svh min-h-0 w-full flex-col overflow-hidden bg-background">
      {children}
    </div>
  );
}
