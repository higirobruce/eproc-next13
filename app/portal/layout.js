export default function PortalLayout({ children }) {
  return (
    <main className="flex min-h-screen flex-col  py-5 px-10">
      <h1 className="font-semibold">Portal</h1>
      {children}
    </main>
  );
}
