import { NextRequest, NextResponse } from 'next/server';

// Cette route proxy est utilisée uniquement quand NEXT_PUBLIC_API_URL n'est pas défini
// ou pour le développement local. Elle permet d'éviter les problèmes CORS.
// Pour les déploiements avec domaines différents, définissez NEXT_PUBLIC_API_URL
// et le client fera les requêtes directement (nécessite CORS configuré sur le backend).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5550';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params, 'POST');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params, 'DELETE');
}

async function proxyRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    const path = params.path.join('/');
    const url = new URL(request.url);
    const queryString = url.search;
    
    const targetUrl = `${API_BASE_URL}/api/v1/${path}${queryString}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Forward authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const options: RequestInit = {
      method,
      headers,
    };
    
    // Add body for POST, PATCH, PUT requests
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        const body = await request.json();
        options.body = JSON.stringify(body);
      } catch {
        // No body or invalid JSON, continue without body
      }
    }
    
    const response = await fetch(targetUrl, options);
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la requête API' },
      { status: 500 }
    );
  }
}

