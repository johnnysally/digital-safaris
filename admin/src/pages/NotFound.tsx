import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <div className="space-y-4 py-6">
          <p className="text-6xl font-bold text-secondary-500">404</p>
          <h1 className="text-xl font-semibold text-text-primary">
            Page not found
          </h1>
          <p className="text-sm text-text-muted">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Go back
            </Button>
            <Button onClick={() => navigate("/")}>Dashboard</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}