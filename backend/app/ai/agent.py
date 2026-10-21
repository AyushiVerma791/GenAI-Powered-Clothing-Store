import os
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic_ai import Agent, RunContext
from app.core.config import settings
from app.core.logging import logger
from app.schemas.chat import ChatMessage, ChatProductCard, ChatResponse
from app.ai.tools import (
    AgentDependencies,
    execute_search_products,
    execute_get_product_by_id,
    execute_get_categories,
)

# Set dummy key for provider initialization if none is present in environment
if not os.environ.get("GROQ_API_KEY") and settings.GROQ_API_KEY:
    os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY
elif not os.environ.get("GROQ_API_KEY"):
    os.environ["GROQ_API_KEY"] = "gsk_placeholder_for_local_init"

# Disable banner in logs
os.environ["PYDANTIC_AI_NO_BANNER"] = "1"

class AgentRecommendation(BaseModel):
    id: str = Field(description="Exact product ID from catalog")
    title: str = Field(description="Exact product title")
    price: float = Field(description="Exact product price in USD")
    category: str = Field(description="Category of the clothing item")
    image: str = Field(description="Product image path or URL")
    sizes: List[str] = Field(default_factory=list, description="Available sizes")
    colors: List[str] = Field(default_factory=list, description="Available colors")
    match_reason: str = Field(description="Direct explanation of why this product fits the customer's request")

class AgentStructuredResponse(BaseModel):
    reply: str = Field(description="Conversational, helpful, and concise response to the customer")
    recommended_products: List[AgentRecommendation] = Field(
        default_factory=list,
        description="Grounded list of products retrieved from tools (maximum 4 items)"
    )
    suggested_queries: List[str] = Field(
        default_factory=list,
        description="2-3 relevant follow-up questions the customer can ask next"
    )

SYSTEM_PROMPT = """
You are 'Aura', a chic, knowledgeable GenAI personal stylist and shopping assistant for our premium clothing boutique.
Your mission is to help shoppers find clothes that fit their style, occasion, budget, and size preferences.

STRICT OPERATIONAL RULES:
1. GROUNDING MANDATE: Never invent or hallucinate products, prices, sizes, or IDs.
2. ALWAYS use the `search_catalog` tool whenever the shopper is searching for clothes, asking for recommendations, or specifying styles, occasions, colors, or budgets.
3. If the user asks for item details or comparisons, use `get_product_details` with the exact product ID.
4. Ground your `recommended_products` array ONLY in the actual results returned by the tools. Copy the exact `id`, `title`, `price`, and `image` from the tool data.
5. In your `reply`, explain in a warm, fashion-forward tone why each recommended item fits their request.
6. If no products are found in the catalog matching their exact criteria, politely explain this, mention available categories, and suggest realistic alternatives or broader filters.
7. Recommend at most 4 items at a time to avoid overwhelming the shopper.
8. Suggest 2 to 3 natural follow-up queries that the customer might want to ask next.
"""

# Initialize the Pydantic AI Agent
clothing_agent = Agent(
    f"groq:{settings.GROQ_MODEL}",
    deps_type=AgentDependencies,
    output_type=AgentStructuredResponse,
    system_prompt=SYSTEM_PROMPT,
)

@clothing_agent.tool
async def search_catalog(
    ctx: RunContext[AgentDependencies],
    query: Optional[str] = None,
    category: Optional[str] = None,
    max_price: Optional[float] = None,
    min_price: Optional[float] = None,
    size: Optional[str] = None,
    color: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Searches the clothing store's live database for active products in stock.

    Args:
        query: Keywords, styles (e.g. 'casual', 'formal', 'trench', 'cotton', 'summer')
        category: Clothing category (e.g. 'Jackets & Coats', 'Dresses', 'Shirts & Tops', 'Sweaters & Knits', 'Pants & Trousers')
        max_price: Maximum price budget in USD
        min_price: Minimum price in USD
        size: Clothing size variant ('XS', 'S', 'M', 'L', 'XL', 'XXL')
        color: Desired color ('Black', 'Beige', 'Navy', 'White', 'Blue', etc.)
    """
    logger.info("Agent tool calling search_catalog with query='%s', category='%s', max_price=%s, size=%s", query, category, max_price, size)
    return await execute_search_products(
        db=ctx.deps.db,
        query=query,
        category=category,
        max_price=max_price,
        min_price=min_price,
        size=size,
        color=color,
        limit=6,
    )

@clothing_agent.tool
async def get_product_details(
    ctx: RunContext[AgentDependencies],
    product_id: str,
) -> Optional[Dict[str, Any]]:
    """Retrieves full details, available sizes, colors, and stock for a specific product ID."""
    logger.info("Agent tool calling get_product_details for id=%s", product_id)
    return await execute_get_product_by_id(db=ctx.deps.db, product_id=product_id)

@clothing_agent.tool
async def get_available_categories(ctx: RunContext[AgentDependencies]) -> List[str]:
    """Retrieves all distinct active clothing categories in the catalog."""
    return await execute_get_categories(db=ctx.deps.db)


async def run_deterministic_assistant(
    db: AsyncIOMotorDatabase,
    message: str,
    history: List[ChatMessage],
) -> ChatResponse:
    """Deterministic, grounded fallback/development mode.
    Extracts constraints using regex & heuristics, queries MongoDB, and returns valid ChatResponse.
    """
    msg_lower = message.lower()

    # Extract price constraints: e.g. "under $100", "below 120", "< 50", "under 150 dollars"
    max_price = None
    price_match = re.search(r"(?:under|below|less than|max|budget)\s*(?:\$)?\s*(\d+(?:\.\d+)?)", msg_lower)
    if price_match:
        max_price = float(price_match.group(1))

    # Extract sizes: XS, S, M, L, XL, XXL
    size = None
    size_match = re.search(r"\b(xs|xl|xxl|[smlx])\b", msg_lower)
    if size_match and size_match.group(1).upper() in ["XS", "S", "M", "L", "XL", "XXL"]:
        size = size_match.group(1).upper()

    # Extract colors
    colors = ["black", "white", "navy", "beige", "blue", "grey", "gray", "red", "green", "brown"]
    found_color = None
    for c in colors:
        if re.search(rf"\b{c}\b", msg_lower):
            found_color = c.capitalize()
            break

    # Extract potential category (supporting stem/partial matching e.g. "jacket" matches "Jackets & Coats")
    categories = await execute_get_categories(db)
    found_category = None
    for cat in categories:
        cat_lower = cat.lower()
        if cat_lower in msg_lower:
            found_category = cat
            break
        # Check individual words in category title
        for word in cat_lower.split():
            clean_word = re.sub(r"[^a-zA-Z]", "", word)
            if len(clean_word) >= 4:
                stem = clean_word.rstrip("s")
                if stem in msg_lower:
                    found_category = cat
                    break
        if found_category:
            break

    # Search products from MongoDB
    products = await execute_search_products(
        db=db,
        query=message if not found_category else None,
        category=found_category,
        max_price=max_price,
        size=size,
        color=found_color,
        limit=4,
    )

    if not products:
        # Fallback search without strict price/size if initial search had no hits
        products = await execute_search_products(db=db, query=message, limit=3)

    cards: List[ChatProductCard] = []
    for p in products[:4]:
        reason = f"Matches your interest in {found_category or 'our collection'}"
        if max_price and p["price"] <= max_price:
            reason += f" within your ${max_price:.0f} budget"
        if size and size in p.get("sizes", []):
            reason += f" in size {size}"

        cards.append(
            ChatProductCard(
                id=p["id"],
                title=p["title"],
                price=p["price"],
                category=p["category"],
                image=p["image"],
                sizes=p.get("sizes", []),
                colors=p.get("colors", []),
                match_reason=reason,
            )
        )

    if cards:
        reply_text = (
            f"Here are {len(cards)} stylish option{'s' if len(cards) > 1 else ''} I handpicked for you from our catalog! "
            f"Each piece features premium fabrics and tailored fits."
        )
        suggestions = [
            f"Show me more items under ${max_price or 100}",
            "What sizes are available?",
            "Can you recommend matching accessories?",
        ]
    else:
        all_cats = ", ".join(categories[:4])
        reply_text = (
            f"I couldn't find an exact match for '{message}' in our current stock. "
            f"We have great selections in {all_cats}. Would you like to explore one of those?"
        )
        suggestions = [
            f"Show me {categories[0]}" if categories else "Browse all jackets",
            "What are your bestsellers?",
            "Items on sale under $80",
        ]

    return ChatResponse(
        reply=reply_text,
        recommended_products=cards,
        suggested_queries=suggestions,
        model_used="deterministic-grounded-catalog",
        is_mock=True,
    )


async def process_chat_message(
    db: AsyncIOMotorDatabase,
    message: str,
    history: Optional[List[ChatMessage]] = None,
) -> ChatResponse:
    """Orchestrates AI shopping assistant requests using Pydantic AI with Groq or graceful grounded fallback."""
    history = history or []

    # Check if mock mode is requested or Groq API key is not configured
    is_placeholder_key = (
        not settings.GROQ_API_KEY
        or settings.GROQ_API_KEY.startswith("gsk_placeholder")
        or settings.GROQ_API_KEY == "mock_dev_key"
    )

    if settings.AI_MOCK_MODE or is_placeholder_key:
        logger.info("Running deterministic grounded assistant (AI_MOCK_MODE=%s, placeholder_key=%s)", settings.AI_MOCK_MODE, is_placeholder_key)
        return await run_deterministic_assistant(db, message, history)

    try:
        # Build prompt incorporating recent turns for conversational continuity
        formatted_prompt = ""
        if history:
            formatted_prompt += "Recent conversation:\n"
            for turn in history[-4:]:
                formatted_prompt += f"{turn.role.upper()}: {turn.content}\n"
            formatted_prompt += f"\nCURRENT USER REQUEST: {message}"
        else:
            formatted_prompt = message

        logger.info("Sending request to Pydantic AI Groq agent...")
        deps = AgentDependencies(db=db)
        result = await clothing_agent.run(formatted_prompt, deps=deps)

        agent_out: AgentStructuredResponse = result.output

        cards = [
            ChatProductCard(
                id=r.id,
                title=r.title,
                price=r.price,
                category=r.category,
                image=r.image,
                sizes=r.sizes,
                colors=r.colors,
                match_reason=r.match_reason,
            )
            for r in agent_out.recommended_products
        ]

        return ChatResponse(
            reply=agent_out.reply,
            recommended_products=cards,
            suggested_queries=agent_out.suggested_queries or [
                "Tell me more about the first item",
                "Show matching shoes or accessories",
                "What is your return policy?"
            ],
            model_used=settings.GROQ_MODEL,
            is_mock=False,
        )

    except Exception as e:
        logger.error("Live Groq model call failed: %s. Falling back to grounded catalog assistant.", e, exc_info=True)
        # Fail gracefully by falling back to deterministic catalog search
        fallback_res = await run_deterministic_assistant(db, message, history)
        fallback_res.reply = f"(Live AI inference temporarily unavailable: {type(e).__name__}. Here are matching items from catalog): " + fallback_res.reply
        return fallback_res
