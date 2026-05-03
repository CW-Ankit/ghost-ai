"use client";

import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base text-center p-6">
      <div className="bg-bg-surface border border-border-default p-8 rounded-3xl max-w-md w-full flex flex-col items-center gap-4 shadow-2xl">
        <div className="h-16 w-16 bg-accent-primary-dim rounded-full flex items-center justify-center text-brand mb-2">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">Access Denied</h1>
        <p className="text-text-secondary">
          You don&apos;t have permission to access this project, or the project no longer exists.
        </p>
        <Button asChild className="mt-4 bg-accent-primary text-bg-base hover:bg-accent-primary/90">
          <Link href="/editor">Back to Projects</Link>
        </Button>
      </div>
    </div>
  );
}
