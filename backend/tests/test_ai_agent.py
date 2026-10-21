import pytest
from httpx import AsyncClient
from pydantic_ai import models
from pydantic_ai.models.test import TestModel
from app.ai.agent import clothing_agent
from app.ai.tools import AgentDependencies, execute_search_products

# Safety guard: ensure no real external API requests occur during unit tests
models.ALLOW_MODEL_REQUESTS = False

@pytest.mark.asyncio
async def test_chat_message_endpoint_grounded_retrieval(
    client: AsyncClient, seeded_products
):
    """Tests natural language query resolution with deterministic grounded assistant."""
    payload = {
        "message": "I need a waterproof jacket under $120 in size L",
        "history": [],
    }
    response = await client.post("/api/v1/chat/message", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "reply" in data
    assert len(data["recommended_products"]) > 0
    # The waterproof jacket is $95 and has size L
    found_titles = [p["title"] for p in data["recommended_products"]]
    assert "Waterproof Outdoor Rain Jacket" in found_titles

    first_item = data["recommended_products"][0]
    assert first_item["price"] <= 120.00
    assert "id" in first_item
    assert "match_reason" in first_item
    assert len(data["suggested_queries"]) >= 1

@pytest.mark.asyncio
async def test_chat_message_no_results_handled_gracefully(client: AsyncClient):
    """Tests response when query matches nothing in catalog."""
    payload = {
        "message": "Do you sell spacesuits with rocket thrusters?",
        "history": [],
    }
    response = await client.post("/api/v1/chat/message", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert isinstance(data["suggested_queries"], list)

@pytest.mark.asyncio
async def test_pydantic_ai_agent_with_test_model(mock_db, seeded_products):
    """Directly unit-tests Pydantic AI agent control flow and tools using TestModel."""
    test_model = TestModel()
    deps = AgentDependencies(db=mock_db)

    with clothing_agent.override(model=test_model):
        result = await clothing_agent.run(
            "Find me warm winter coats under $200",
            deps=deps,
        )

    # Introspect TestModel request parameters
    assert test_model.last_model_request_parameters is not None
    tool_names = [t.name for t in test_model.last_model_request_parameters.function_tools]

    # Verify registered tools are exposed to the LLM
    assert "search_catalog" in tool_names
    assert "get_product_details" in tool_names
    assert "get_available_categories" in tool_names
    assert result.output is not None
