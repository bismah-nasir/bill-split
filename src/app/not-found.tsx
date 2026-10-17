import Link from "next/link";
import { SearchX } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center py-48">
      <PageContainer>
        <EmptyState
          icon={SearchX}
          title="Page not found"
          description="The page you're looking for doesn't exist."
          action={
            <Button asChild>
              <Link href="/">Go to the home page</Link>
            </Button>
          }
        />
      </PageContainer>
    </main>
  );
}
