export default function DeveloperMode() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <iframe 
        src="/developermodeon/index.html" 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Official Site Preview"
      />
    </div>
  );
}
