import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isPublic = ["/login"].includes(path);
    const token = request.cookies.get("token")?.value || "";
    console.log(token)

    if (isPublic) {
        return NextResponse.next(); 
    }

    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();

}

export const config = {
    matcher: [
        "/", "/login", "/admin"
    ],
};