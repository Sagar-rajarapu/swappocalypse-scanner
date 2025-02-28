
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t py-12 md:py-16">
      <div className="container grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-4">
          <Link to="/" className="text-xl font-medium tracking-tight">
            <span className="font-semibold">Swap</span>
            <span className="text-gray-500">Scanner</span>
          </Link>
          <p className="text-muted-foreground text-sm">
            Advanced deepfake detection for the digital age. Our AI-powered tools help
            identify manipulated videos with precision and accuracy.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 md:gap-8 lg:col-span-2">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#features" className="text-muted-foreground transition-colors hover:text-foreground">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-muted-foreground transition-colors hover:text-foreground">
                  How It Works
                </a>
              </li>
              <li>
                <Link to="/upload" className="text-muted-foreground transition-colors hover:text-foreground">
                  Scan Video
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#about" className="text-muted-foreground transition-colors hover:text-foreground">
                  About
                </a>
              </li>
              <li>
                <a href="#privacy" className="text-muted-foreground transition-colors hover:text-foreground">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#terms" className="text-muted-foreground transition-colors hover:text-foreground">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="container mt-8 border-t pt-8">
        <p className="text-muted-foreground text-center text-xs">
          &copy; {new Date().getFullYear()} SwapScanner. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
