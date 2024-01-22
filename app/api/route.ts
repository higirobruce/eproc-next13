import { NextRequest, NextResponse } from "next/server";

import path from "path";
import { encode } from "base-64";
import { NextApiRequest, NextApiResponse } from "next";

let url = process.env.NEXT_PUBLIC_BKEND_URL;

export async function GET(request: NextRequest, response: NextApiResponse) {
  const searchParams = request.nextUrl.searchParams
  const folder = searchParams?.get("folder");
  const fileName = searchParams?.get("name");

  let backendResponse = await fetch(`${url}/file/${folder}/${fileName}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return backendResponse;
  
}
