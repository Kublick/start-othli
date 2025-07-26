import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import TanStackQueryLayout from "../integrations/tanstack-query/layout.tsx";
import appCss from "../styles.css?url";

function ErrorComponent({ error }: { error: Error }) {
  const router = useRouter();

  return (
    <div className="flex min-h-96 items-center justify-center">
      <Alert variant="destructive" className="max-w-lg">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>{error.message}</p>
          <Button
            variant="outline"
            onClick={() => router.invalidate()}
            className="w-full"
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-96 items-center justify-center">
      <Alert className="max-w-lg">
        <AlertTitle>Página no encontrada</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>La página que buscas no existe.</p>
          <Button asChild className="w-full">
            <Link to="/">Ir a la página principal</Link>
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Finanzas",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: () => (
    <RootDocument>
      <Outlet />
      <TanStackRouterDevtools />
      <TanStackQueryLayout />
      <Toaster />
    </RootDocument>
  ),
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  wrapInSuspense: true,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
