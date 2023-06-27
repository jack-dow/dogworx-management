"use client";

import { XCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircle2Icon, CheckCircleIcon } from "lucide-react";

import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

export const ToastDemo = () => {
  const { toast } = useToast();

  return (
    <Button
      onClick={() => {
        toast({
          title: "Scheduled: Catch up",
          description: "Friday, February 10, 2023 at 5:57 PM",
        });
      }}
    >
      Show Toast
    </Button>
  );
};
