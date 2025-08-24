export default function HomePage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', color: 'red' }}>TEST PAGE WORKING</h1>
      <p style={{ fontSize: '1.5rem', color: 'blue' }}>
        If you can see this, the page is updating correctly.
      </p>
      <div style={{
        backgroundColor: 'yellow',
        padding: '1rem',
        margin: '1rem 0',
        border: '2px solid green'
      }}>
        This should be a yellow box with green border
      </div>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
}
