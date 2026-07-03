'use client';
export default function Error({ error, reset }) {
  return (
    <div style={{ color: 'white', padding: '50px' }}>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <pre>{error.stack}</pre>
    </div>
  );
}
