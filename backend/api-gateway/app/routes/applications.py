import httpx
import logging
from fastapi import APIRouter, Request, HTTPException, Response
from app.config import APPLICATION_SERVICE_URL

router = APIRouter()
logger = logging.getLogger(__name__)


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
@router.api_route("/", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_applications(request: Request, path: str = ""):
    target_url = f"{APPLICATION_SERVICE_URL}{request.url.path}"

    logger.info(f"Proxying request to Application Service: {target_url}")

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
                timeout=10.0
            )

            response_headers = dict(proxy_response.headers)
            for h in ["content-encoding", "content-length", "transfer-encoding"]:
                response_headers.pop(h, None)

            return Response(
                content=proxy_response.content,
                status_code=proxy_response.status_code,
                headers=response_headers,
                media_type=proxy_response.headers.get("content-type"),
            )
        except httpx.RequestError as exc:
            logger.error(f"Connection error to Application Service ({target_url}): {exc}")
            raise HTTPException(status_code=503, detail="Application Service unavailable")
