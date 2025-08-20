export function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      <div className="text-white mt-4 text-center">Loading Galaxy...</div>
    </div>
  );
}