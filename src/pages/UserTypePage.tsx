import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Gavel } from "lucide-react";

export default function UserTypePage() {
  const navigate = useNavigate();

  const userTypes = [
    {
      title: "JROTC Command Center",
      description: "",
      icon: Users,
      path: "/app/auth",
      variant: "default" as const,
    },
    {
      title: "Judges Portal",
      description: "",
      icon: Gavel,
      path: "/app/judges/auth",
      variant: "default" as const,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">Welcome to JROTC Command Center</CardTitle>
          <CardDescription className="text-base">Select your account type to continue</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-6">
          {userTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.title}
                variant={type.variant}
                className="h-auto flex-col gap-3 p-6 hover:scale-105 transition-transform"
                onClick={() => navigate(type.path)}
              >
                <Icon className="h-12 w-12" />
                <div className="text-center space-y-1">
                  <div className="font-semibold text-lg">{type.title}</div>
                  <div className="text-sm opacity-90 font-normal">{type.description}</div>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
