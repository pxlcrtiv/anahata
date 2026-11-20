import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { focusRing } from "@/lib/focus";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      <div className="text-center space-y-4 px-6">
        <h1 className="text-5xl font-bold">404</h1>
        <p className="text-gray-400 text-lg">That route isn't part of the instrument.</p>
        <Link
          to="/"
          className={`inline-block bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded ${focusRing} focus-visible:ring-white`}
        >
          Back to the studio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
