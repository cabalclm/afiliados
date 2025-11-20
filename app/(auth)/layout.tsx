export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1 w-full flex justify-center pt-5">
      {children}
    </main>
  );
}