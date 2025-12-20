# RAG Knowledge Base Setup Guide

## What is RAG?

RAG (Retrieval-Augmented Generation) is a powerful AI technique that allows your ElevenLabs voice agent to search through your knowledge base intelligently using semantic search. Instead of reading through the entire knowledge base, the AI can quickly find the most relevant information based on what the customer is asking.

## System Architecture

Your RAG system consists of:

1. **PostgreSQL with pgvector** - Stores text chunks with vector embeddings
2. **OpenAI Embeddings API** - Converts text into 1536-dimensional vectors
3. **Semantic Search** - Finds similar content using cosine similarity
4. **Edge Functions** - Serverless API endpoints for searching

## Database Tables Created

### `knowledge_base_documents`
Stores document metadata:
- `id` - Unique document identifier
- `title` - Document title (e.g., "Pricing - PUJ to Zone A")
- `category` - Category (vehicles, pricing, destinations, policies, etc.)
- `source` - Source name
- `metadata` - Additional JSON data
- `created_at`, `updated_at` - Timestamps

### `knowledge_base_chunks`
Stores text chunks with embeddings:
- `id` - Unique chunk identifier
- `document_id` - Reference to parent document
- `content` - The actual text content
- `embedding` - 1536-dimensional vector (pgvector)
- `chunk_index` - Order within document
- `metadata` - Additional JSON data
- `created_at` - Timestamp

## How to Use

### Step 1: Seed the Knowledge Base

Call the seed function to populate your knowledge base:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/seed-knowledge-base \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

This will:
- Clear existing knowledge base data
- Create 30+ documents covering all aspects of your service
- Generate embeddings for each chunk
- Store everything in the database

**Wait time:** About 2-3 minutes (generating embeddings takes time)

### Step 2: Test the Search

Search your knowledge base:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/rag-search \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How much from PUJ to Hard Rock Hotel?",
    "match_count": 5,
    "match_threshold": 0.7
  }'
```

Response:
```json
{
  "query": "How much from PUJ to Hard Rock Hotel?",
  "results": [
    {
      "content": "Zone A - Bavaro/Punta Cana: Hotels include Hard Rock Hotel...",
      "similarity": 0.89,
      "metadata": {
        "category": "destinations",
        "title": "Zone A - Bavaro and Punta Cana Hotels"
      }
    },
    {
      "content": "PUJ Airport to Bavaro/Punta Cana (Zone A) pricing: Sedan $25...",
      "similarity": 0.87,
      "metadata": {
        "category": "pricing",
        "title": "Pricing - PUJ to Zone A"
      }
    }
  ],
  "context": "[Similarity: 89.0%] Zone A - Bavaro/Punta Cana...\n\n---\n\n[Similarity: 87.0%] PUJ Airport to Bavaro...",
  "count": 5
}
```

### Step 3: Configure ElevenLabs

#### Option A: Direct API Integration (Recommended)

Configure your ElevenLabs agent to call the RAG search endpoint:

1. Go to ElevenLabs Agent Settings
2. Add a Custom Tool/Function:
   - **Name:** `search_knowledge_base`
   - **Description:** "Search the Dominican Transfers knowledge base for information about pricing, vehicles, destinations, policies, and services"
   - **Endpoint:** `https://YOUR_PROJECT.supabase.co/functions/v1/rag-search`
   - **Method:** POST
   - **Headers:**
     - `Authorization: Bearer YOUR_ANON_KEY`
     - `Content-Type: application/json`
   - **Body Schema:**
     ```json
     {
       "query": "string (required) - The search query",
       "match_count": "number (optional, default: 5) - Number of results",
       "match_threshold": "number (optional, default: 0.7) - Minimum similarity (0-1)"
     }
     ```

3. Train your agent to use this tool:
   - "When a customer asks about pricing, use the search_knowledge_base tool"
   - "When a customer mentions a hotel name, search the knowledge base"
   - "For any policy questions, search the knowledge base first"

#### Option B: Pre-loaded Knowledge Base

Alternatively, upload the static knowledge base file:

1. Download: `public/elevenlabs-knowledge-base.html`
2. Go to ElevenLabs Knowledge Base section
3. Upload the HTML file
4. ElevenLabs will automatically index it

**Note:** Option A (API) is more flexible and always up-to-date. Option B (static) is simpler but requires manual updates.

## Knowledge Base Content

The system includes 30+ documents covering:

### Company Information (1 document)
- Contact details, services offered

### Vehicle Fleet (5 documents)
- Sedan, Minivan, Suburban VIP, Sprinter, Mini Bus
- Capacity, luggage, pricing, features

### Destinations (5 documents)
- Zone A: Bavaro/Punta Cana (28 hotels)
- Zone B: Cap Cana (7 hotels)
- Zone C: Uvero Alto (8 hotels)
- Zone D: Bayahibe/La Romana (7 hotels)
- Zone E: Santo Domingo (8 hotels)

### Pricing (6 documents)
- PUJ to each zone (5 routes)
- Round trip calculations

### Airports (1 document)
- PUJ, SDQ, LRM, POP details

### Booking & Policies (7 documents)
- Booking process
- Payment methods
- Cancellation policy
- Flight tracking
- Luggage policy
- Waiting time

### Services (4 documents)
- Meet & Greet
- Child seats
- Extra stops
- Service hours

### FAQs (3 documents)
- General questions
- Hotel finding guide
- Vehicle selection guide

## Example Queries

### Pricing Queries
```
"How much from PUJ to Hard Rock Hotel?"
→ Returns: Zone A pricing, Sedan $25, Minivan $45

"What's the cost for 6 people to Hyatt Zilara?"
→ Returns: Zone B, Cap Cana, Minivan $50

"Round trip price to Uvero Alto"
→ Returns: Zone C pricing, round trip formula
```

### Vehicle Queries
```
"Do you have a vehicle for 8 people with lots of luggage?"
→ Returns: Sprinter (12 pax, 14 luggage) $110+

"What's your most luxurious vehicle?"
→ Returns: Suburban VIP, black car service, $65 base
```

### Hotel/Destination Queries
```
"Where is Excellence Punta Cana?"
→ Returns: Zone C, Uvero Alto, 45-60 min from PUJ

"Hotels near airport"
→ Returns: Zone B (Cap Cana), 15-20 minutes
```

### Policy Queries
```
"Can I cancel my booking?"
→ Returns: Free cancellation 24 hours before

"What if my flight is delayed?"
→ Returns: Flight tracking included, no extra charge

"Do you have child seats?"
→ Returns: Free child seats, types available
```

## API Reference

### Endpoint: `/functions/v1/rag-search`

**Method:** POST

**Request Body:**
```json
{
  "query": "string (required)",
  "match_count": "number (optional, default: 5)",
  "match_threshold": "number (optional, default: 0.7)"
}
```

**Response:**
```json
{
  "query": "original query string",
  "results": [
    {
      "content": "text content",
      "similarity": 0.89,
      "metadata": {
        "category": "pricing",
        "title": "Pricing - PUJ to Zone A"
      }
    }
  ],
  "context": "formatted string with all results",
  "count": 5
}
```

**Parameters:**
- `match_count`: How many results to return (1-20 recommended)
- `match_threshold`: Minimum similarity score (0.0-1.0)
  - 0.7 = Good match (recommended)
  - 0.8 = Very good match
  - 0.9 = Excellent match

## Maintenance

### Adding New Content

1. Update the `knowledgeBase` array in `/supabase/functions/seed-knowledge-base/index.ts`
2. Redeploy the function (automatic in your setup)
3. Re-run the seed endpoint to update embeddings

### Monitoring

Check the logs:
```bash
supabase functions logs seed-knowledge-base
supabase functions logs rag-search
```

### Database Queries

View all documents:
```sql
SELECT title, category, created_at
FROM knowledge_base_documents
ORDER BY category, title;
```

View chunk count by category:
```sql
SELECT
  d.category,
  COUNT(c.id) as chunk_count
FROM knowledge_base_documents d
LEFT JOIN knowledge_base_chunks c ON d.id = c.document_id
GROUP BY d.category;
```

Search directly (requires vector):
```sql
SELECT * FROM search_knowledge_base(
  '[0.1, 0.2, ...]'::vector(1536),
  0.7,
  5
);
```

## Troubleshooting

### Issue: "pgvector extension not found"
**Solution:** The migration automatically enables it. Run the migration again.

### Issue: "OpenAI API key not configured"
**Solution:** OpenAI key is automatically configured in Supabase environment.

### Issue: "No results found"
**Solution:**
- Lower the `match_threshold` (try 0.6 or 0.5)
- Increase `match_count`
- Check if knowledge base is seeded: `SELECT COUNT(*) FROM knowledge_base_chunks;`

### Issue: "Slow search performance"
**Solution:** The HNSW index is created automatically. If still slow, check:
```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'knowledge_base_chunks';
```

## Cost Considerations

### OpenAI Embeddings Pricing
- Model: `text-embedding-ada-002`
- Cost: $0.0001 per 1K tokens
- Seeding 30 documents (~15K tokens): ~$0.0015
- Per search query (~50 tokens): ~$0.000005

### Supabase Database
- Vector storage: Minimal (embeddings compressed)
- Queries: Covered by free tier for most usage

**Total monthly cost for typical usage:** < $1

## Advanced Features

### Custom Similarity Thresholds by Category

Adjust thresholds based on query type:
- Pricing queries: 0.75 (exact match needed)
- General FAQs: 0.65 (more flexible)
- Hotel searches: 0.70 (balanced)

### Multi-language Support

Add translations to the knowledge base:
```typescript
{
  title: "Vehicle Fleet - Sedan (Spanish)",
  category: "vehicles",
  chunks: [
    "Sedán (Traslado Privado Estándar): Perfecto para parejas..."
  ]
}
```

### Analytics Integration

Track popular queries:
```sql
CREATE TABLE knowledge_base_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  results_count int,
  avg_similarity float,
  created_at timestamptz DEFAULT now()
);
```

## Support

For questions or issues:
- Email: support@dominicantransfers.com
- Phone: +31625584645
- Documentation: This file

## Quick Start Summary

1. **Seed:** `curl -X POST .../seed-knowledge-base`
2. **Test:** `curl -X POST .../rag-search -d '{"query":"test"}'`
3. **Configure ElevenLabs:** Add custom tool pointing to `/rag-search`
4. **Done!** Your AI agent can now search intelligently

Your RAG system is production-ready and fully functional!
