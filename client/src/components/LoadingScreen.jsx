export default function LoadingScreen({ message = 'Preparing HomeSphere…' }) {
  return (
    <div className="loading-screen" data-screen="loading">
      <div className="loading-spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
