import httpx
from fastapi import APIRouter, Request, HTTPException, Response
from app.config import APPLICATION_SERVICE_URL

router = APIRouter()

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
@router.api_route("/", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_applications(request: Request, path: str = ""):
    # request.url.path гарантирует, что префикс /applications сохранится
    target_url = f"{APPLICATION_SERVICE_URL}{request.url.path}"
    print(f"--- GATEWAY PROXY APPLICATIONS TO: {target_url} ---")

    headers = dict(request.headers)
    headers.pop("host", None)

    async with httpx.AsyncClient() as client:
        try:
            body = await request.body()
            proxy_response = await client.request(
                method=request.method,
                url=target_url,
                content=body,
                headers=headers,
                params=request.query_params,
            )

            response_headers = dict(proxy_response.headers)
            response_headers.pop("content-encoding", None)
            response_headers.pop("content-length", None)
            response_headers.pop("transfer-encoding", None)

            return Response(
                content=proxy_response.content,
                status_code=proxy_response.status_code,
                headers=response_headers,
                media_type=proxy_response.headers.get("content-type"),
            )
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Application Service is unavailable: {exc}")