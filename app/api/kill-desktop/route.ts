import { killDesktop } from "@/lib/kernel/utils";

// Common handler for both GET and POST requests
async function handleKillDesktop(request: Request) {
  const { searchParams } = new URL(request.url);
  const sandboxId = searchParams.get("sandboxId");

  console.log(`Kill desktop request received via ${request.method} for ID: ${sandboxId}`);

  if (!sandboxId) {
    return new Response("No sandboxId provided", { status: 400 });
  }

  try {
    await killDesktop(sandboxId);
    return new Response("Desktop killed successfully", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error(`Failed to kill desktop with ID: ${sandboxId}`, error);
    return new Response("Failed to kill desktop", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }
}

export async function OPTIONS(request: Request) {
  return handleKillDesktop(request);
}

// Handle POST requests
export async function POST(request: Request) {
  return handleKillDesktop(request);
}