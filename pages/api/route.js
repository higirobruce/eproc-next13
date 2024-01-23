let url = process.env.NEXT_PUBLIC_BKEND_URL;

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const folder = searchParams?.get("folder");
  const fileName = searchParams?.get("name");
  let backendResponse = await fetch(`${url}/file/${folder}/${fileName}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  return backendResponse
  
}
