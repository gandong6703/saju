export default function App() {
  const connectedAt = new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  return (
    <aside className="react-badge" aria-live="polite">
      <strong>React Connected</strong>
      <span>Entry: main.html</span>
      <span>{connectedAt}</span>
    </aside>
  );
}
