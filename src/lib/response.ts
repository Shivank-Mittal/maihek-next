import { NextResponse } from "next/server";

class ApiResponse {
  static json(body: any, status: number = 200) {
    return new NextResponse(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  static ok(data: any) {
    return this.json({ success: true, data }, 200);
  }

  static created(data: any) {
    return this.json({ success: true, data }, 201);
  }

  static badRequest(error: any) {
    return this.json({ success: false, error }, 400);
  }

  static unauthorized(error: any) {
    return this.json({ success: false, error }, 401);
  }

  static forbidden(error: any) {
    return this.json({ success: false, error }, 403);
  }

  static notFound(error: any) {
    return this.json({ success: false, error }, 404);
  }

  static conflict(error: any) {
    return this.json({ success: false, error }, 409);
  }

  static internalServerError(error: any, status: number = 500) {
    return this.json({ success: false, error }, status);
  }

  static redirect(url: string) {
    return NextResponse.redirect(url, 302);
  }

  static redirectPermanent(url: string) {
    return NextResponse.redirect(url, 301);
  }
}

export default ApiResponse;
