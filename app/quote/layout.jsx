export const metadata = {
  title: 'Secure Proposal | Dripp Media',
  description: 'View your secure proposal from Dripp Media.',
};

export default function QuoteLayout({ children }) {
  return (
    <>
      <style>{`
        body {
          opacity: 1 !important;
          background-color: #0a0a0a !important;
          color: #ffffff !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          cursor: auto !important;
        }
        * {
          cursor: auto !important;
        }
      `}</style>
      {children}
    </>
  );
}
