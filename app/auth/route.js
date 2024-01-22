import { NodeNextResponse } from "next/dist/server/base-http/node";

export async function GET(){
    return Response.json({hello:'world'})
}