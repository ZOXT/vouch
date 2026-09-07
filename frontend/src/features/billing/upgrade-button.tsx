import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export const UpgradeButton = (props: ButtonProps) => {
  const navigate = useNavigate();

  return (
    <Button onClick={() => navigate("/pricing")} {...props}>
      <Sparkles className="h-4 w-4" />
      {props.children ?? "Upgrade"}
    </Button>
  );
};