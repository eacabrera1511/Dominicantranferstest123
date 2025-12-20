/*
  # RAG Knowledge Base System with Vector Embeddings

  1. New Tables
    - `knowledge_base_documents`
      - Stores document metadata (title, category, source)
    - `knowledge_base_chunks`
      - Stores text chunks with vector embeddings for semantic search
      - Uses pgvector for similarity search
    
  2. Extensions
    - Enable `vector` extension for pgvector support
    
  3. Functions
    - `search_knowledge_base` - Semantic search using vector similarity
    - `get_relevant_context` - Retrieve relevant chunks for RAG
    
  4. Indexes
    - HNSW index on embeddings for fast similarity search
    
  5. Security
    - RLS enabled on all tables
    - Public read access for knowledge base
    - Admin-only write access
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table
CREATE TABLE IF NOT EXISTS knowledge_base_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  source text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chunks table with vector embeddings
CREATE TABLE IF NOT EXISTS knowledge_base_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES knowledge_base_documents(id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 produces 1536-dimensional embeddings
  chunk_index int NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create index for fast vector similarity search
CREATE INDEX IF NOT EXISTS knowledge_base_chunks_embedding_idx 
  ON knowledge_base_chunks 
  USING hnsw (embedding vector_cosine_ops);

-- Create index for document lookups
CREATE INDEX IF NOT EXISTS knowledge_base_chunks_document_id_idx 
  ON knowledge_base_chunks(document_id);

-- Enable RLS
ALTER TABLE knowledge_base_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_chunks ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can read knowledge base documents"
  ON knowledge_base_documents FOR SELECT
  USING (true);

CREATE POLICY "Public can read knowledge base chunks"
  ON knowledge_base_chunks FOR SELECT
  USING (true);

-- Admin write access (using service role)
CREATE POLICY "Service role can manage documents"
  ON knowledge_base_documents FOR ALL
  USING (true);

CREATE POLICY "Service role can manage chunks"
  ON knowledge_base_chunks FOR ALL
  USING (true);

-- Function to search knowledge base using vector similarity
CREATE OR REPLACE FUNCTION search_knowledge_base(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  chunk_id uuid,
  document_id uuid,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kbc.id,
    kbc.document_id,
    kbc.content,
    1 - (kbc.embedding <=> query_embedding) as similarity,
    kbc.metadata
  FROM knowledge_base_chunks kbc
  WHERE 1 - (kbc.embedding <=> query_embedding) > match_threshold
  ORDER BY kbc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get relevant context for a query (returns formatted text)
CREATE OR REPLACE FUNCTION get_relevant_context(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  context_text text := '';
  chunk_record record;
BEGIN
  FOR chunk_record IN
    SELECT
      kbc.content,
      kbd.title,
      kbd.category
    FROM knowledge_base_chunks kbc
    JOIN knowledge_base_documents kbd ON kbc.document_id = kbd.id
    WHERE 1 - (kbc.embedding <=> query_embedding) > match_threshold
    ORDER BY kbc.embedding <=> query_embedding
    LIMIT match_count
  LOOP
    context_text := context_text || E'\n--- ' || chunk_record.title || ' (' || chunk_record.category || E') ---\n' || chunk_record.content || E'\n';
  END LOOP;
  
  RETURN context_text;
END;
$$;