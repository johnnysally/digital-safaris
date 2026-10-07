import { Link } from "react-router-dom";
import { Construction, ArrowLeft } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

interface ComingSoonProps {
  title?: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
}

export default function ComingSoon({
  title = "Coming soon",
  description = "This page is under construction. Check back shortly.",
  backTo = "/",
  backLabel = "Back to home",
}: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <div className="space-y-4 py-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-600">
            <Construction className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
          <p className="text-sm text-text-muted">{description}</p>
          <div className="flex justify-center pt-2">
            <Link to={backTo}>
              <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                {backLabel}
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}