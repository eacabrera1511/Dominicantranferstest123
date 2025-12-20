import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function generateEmbedding(text: string, supabaseUrl: string, supabaseKey: string): Promise<number[]> {
  const response = await fetch(`${supabaseUrl}/functions/v1/generate-embedding`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate embedding: ${await response.text()}`);
  }

  const { embedding } = await response.json();
  return embedding;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { query, match_count = 5, match_threshold = 0.7 } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating embedding for query:', query);
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query, supabaseUrl, supabaseKey);

    console.log('Searching knowledge base...');

    // Search using the vector similarity function
    const { data: results, error: searchError } = await supabase
      .rpc('search_knowledge_base', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold,
        match_count,
      });

    if (searchError) {
      console.error('Search error:', searchError);
      return new Response(
        JSON.stringify({ error: 'Search failed', details: searchError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format results for easy consumption
    const formattedResults = results.map((result: any) => ({
      content: result.content,
      similarity: result.similarity,
      metadata: result.metadata,
    }));

    // Also create a context string (useful for AI assistants)
    const contextString = results
      .map((r: any) => `[Similarity: ${(r.similarity * 100).toFixed(1)}%] ${r.content}`)
      .join('\n\n---\n\n');

    console.log(`Found ${results.length} results`);

    return new Response(
      JSON.stringify({
        query,
        results: formattedResults,
        context: contextString,
        count: results.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});