
import { AnalysisResult } from "@/lib/types";
import { generateReport } from "@/lib/analysis";

interface ReportGeneratorProps {
  result: AnalysisResult;
  videoFilename: string;
}

export function ReportGenerator({ result, videoFilename }: ReportGeneratorProps) {
  const handleDownload = () => {
    generateReport(result, videoFilename);
  };

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-4">
      <h3 className="text-lg font-medium">Download Analysis Report</h3>
      <p className="text-sm text-muted-foreground">
        Get a detailed report of our analysis findings, including all detected abnormalities
        and techniques used in creating this deepfake.
      </p>
      <button
        onClick={handleDownload}
        className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Download Report
      </button>
    </div>
  );
}
