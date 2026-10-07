import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { ROUTES } from "../utils/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <div className="space-y-4 py-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-600">
            <Compass className="h-7 w-7" />
          </div>
          <p className="text-5xl font-bold text-secondary-500">404</p>
          <h1 className="text-xl font-semibold text-text-primary">
            Page not found
          </h1>
          <p className="text-sm text-text-muted">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <Link to={ROUTES.HOME}>
              <Button leftIcon={<Home className="h-4 w-4" />}>
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}