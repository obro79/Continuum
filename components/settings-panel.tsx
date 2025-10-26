"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Manage your dashboard preferences and account settings.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium">Appearance</h3>
            <p className="text-sm text-muted-foreground">
              Customize how the dashboard looks and feels.
            </p>
          </div>
          <Separator />
          <div>
            <Label htmlFor="theme">Theme</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Light mode (Claude style)
            </p>
          </div>
          <Separator />
          <div>
            <h3 className="text-sm font-medium">Account</h3>
            <p className="text-sm text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>
          <Separator />
          <div>
            <h3 className="text-sm font-medium">Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Configure notification preferences.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
