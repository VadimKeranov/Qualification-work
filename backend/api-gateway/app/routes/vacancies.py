from fastapi import APIRouter, Request, Response
import httpx

router = APIRouter()
VACANCY_SERVICE_URL = "http://127.0.0.1:8003"

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_vacancies(path: str, request: Request):
    headers = dict(request.headers)
    headers.pop("host", None)

    async with httpx.AsyncClient() as client:
        proxy_req = await client.request(
            method=request.method,
            url=f"{VACANCY_SERVICE_URL}/vacancies/{path}",
            headers=headers,
            content=await request.body(),
            params=request.query_params,
        )

        response_headers = dict(proxy_req.headers)
        response_headers.pop("content-encoding", None)
        response_headers.pop("content-length", None)
        response_headers.pop("transfer-encoding", None)

        return Response(
            content=proxy_req.content,
            status_code=proxy_req.status_code,
            headers=response_headers,
            media_type=proxy_req.headers.get("content-type")
        )