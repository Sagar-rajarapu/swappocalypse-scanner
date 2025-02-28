
import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200">
      <div className="container flex h-16 items-center justify-between">
        <Link 
          to="/" 
          className="text-xl font-medium tracking-tight transition-opacity hover:opacity-80"
        >
          <span className="font-semibold">Swap</span>
          <span className="text-gray-500">Scanner</span>
        </Link>
        
        <nav className="hidden space-x-8 md:flex">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-gray-500">
            Home
          </Link>
          <Link to="/upload" className="text-sm font-medium transition-colors hover:text-gray-500">
            Scan Video
          </Link>
          <a 
            href="#how-it-works" 
            className="text-sm font-medium transition-colors hover:text-gray-500"
          >
            How It Works
          </a>
        </nav>
        
        <div className="flex items-center space-x-4">
          <Link 
            to="/upload" 
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start Scanning
          </Link>
        </div>
      </div>
    </div>
  );
}
