import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6">
      <div className="p-6 rounded-full bg-muted animate-in zoom-in duration-500">
        <FileQuestion className="h-16 w-16 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">404</h1>
        <h2 className="text-xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-[500px]">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link href="/">
        <Button size="lg" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
