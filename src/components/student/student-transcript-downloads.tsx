"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileSpreadsheet, FileText, Printer } from "lucide-react";

type Props = {
  htmlUrl: string;
  csvUrl: string;
};

export function StudentTranscriptDownloads({ htmlUrl, csvUrl }: Props) {
  const linkClass = cn(buttonVariants({ variant: "outline", size: "default" }));

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button type="button" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Save as PDF
      </Button>
      <a href={htmlUrl} className={linkClass} download>
        <FileText className="h-4 w-4" />
        Download HTML
      </a>
      <a href={csvUrl} className={linkClass} download>
        <FileSpreadsheet className="h-4 w-4" />
        Download CSV
      </a>
      <p className="w-full text-xs text-slate-500">
        For PDF: choose &quot;Save as PDF&quot; in the print dialog. HTML and CSV open your full
        grade history for applications or spreadsheets.
      </p>
    </div>
  );
}
