from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.execute import router as execute_router
from app.routes.analyze import router as analyze_router
from app.routes.ai import router as ai_router

app = FastAPI(
    title="DebugYourCode (DYC) API",
    description="Backend execution, tracing, complexity analysis, and AI tutor for DebugYourCode.",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(execute_router)
app.include_router(analyze_router)
app.include_router(ai_router)

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "service": "DebugYourCode",
        "version": "1.0.0",
        "environment": "isolated-wsl2-gdb",
        "supported_languages": ["cpp"],
        "supported_models": ["gemma-4", "open-llm"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
