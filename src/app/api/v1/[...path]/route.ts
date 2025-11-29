import { NextRequest, NextResponse } from 'next/server';

// Cette route proxy est utilisée uniquement quand NEXT_PUBLIC_API_URL n'est pas défini
// ou pour le développement local. Elle permet d'éviter les problèmes CORS.
// Pour les déploiements avec domaines différents, définissez NEXT_PUBLIC_API_URL
// et le client fera les requêtes directement (nécessite CORS configuré sur le backend).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5550';

// Solution 4 : Désactiver la vérification SSL en développement uniquement
// ⚠️ ATTENTION : À utiliser UNIQUEMENT en développement, JAMAIS en production
// Définissez DISABLE_SSL_VERIFICATION=true dans votre .env.local pour l'activer
const DISABLE_SSL_VERIFICATION = 
  process.env.NODE_ENV === 'development' && 
  process.env.DISABLE_SSL_VERIFICATION === 'true';

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
    
    // Solution 4 : Désactiver la vérification SSL en développement uniquement
    // ⚠️ ATTENTION : À utiliser UNIQUEMENT en développement, JAMAIS en production
    // Pour les requêtes HTTPS avec SSL désactivé, on modifie temporairement NODE_TLS_REJECT_UNAUTHORIZED
    let originalRejectUnauthorized: string | undefined;
    if (DISABLE_SSL_VERIFICATION && targetUrl.startsWith('https://')) {
      originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    
    try {
      const response = await fetch(targetUrl, options);
      const data = await response.json();
      
      // Restaurer la valeur originale après la requête
      if (originalRejectUnauthorized !== undefined) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
      } else if (DISABLE_SSL_VERIFICATION && targetUrl.startsWith('https://')) {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
      
      return NextResponse.json(data, { status: response.status });
    } catch (fetchError: any) {
      // Restaurer la valeur originale en cas d'erreur
      if (originalRejectUnauthorized !== undefined) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
      } else if (DISABLE_SSL_VERIFICATION && targetUrl.startsWith('https://')) {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la requête API' },
      { status: 500 }
    );
  }
}

