from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., min_length=1, max_length=2000)
    timestamp: Optional[datetime] = None

class ChatProductCard(BaseModel):
    id: str
    title: str
    price: float
    category: str
    image: str
    sizes: List[str] = Field(default_factory=list)
    colors: List[str] = Field(default_factory=list)
    match_reason: str = Field(..., description="Why this item matches the customer's request")

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    history: List[ChatMessage] = Field(default_factory=list, description="Recent conversation turns for context")

class ChatResponse(BaseModel):
    reply: str
    recommended_products: List[ChatProductCard] = Field(default_factory=list)
    suggested_queries: List[str] = Field(default_factory=list)
    model_used: str = "llama-3.3-70b-versatile"
    is_mock: bool = False
