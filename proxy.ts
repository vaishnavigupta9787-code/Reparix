import { NextResponse } from "next/server";
import type { NextMiddleware } from "next/server";

const passthroughMiddleware: NextMiddleware = () => NextResponse.next();
export default passthroughMiddleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
