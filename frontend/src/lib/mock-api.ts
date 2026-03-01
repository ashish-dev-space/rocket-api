import { HttpRequest, HttpResponse } from '@/types'

// Mock service for demonstration when backend is not available
class MockApiService {
  async sendRequest(request: HttpRequest): Promise<HttpResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))
    
    // Handle form-data uploads
    if (request.body.type === 'form-data' && request.body.formData) {
      const fields = request.body.formData.filter(f => f.enabled)
      return {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'X-Rocket-Mock': 'true'
        },
        body: JSON.stringify({
          message: 'Form data received (mock)',
          fields: fields.map(f => ({
            key: f.key,
            type: f.type,
            value: f.type === 'file' ? `[File: ${f.fileName}]` : f.value
          })),
          timestamp: new Date().toISOString()
        }),
        size: 200,
        time: 345
      }
    }
    
    // Handle binary uploads
    if (request.body.type === 'binary' && request.body.fileName) {
      return {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'X-Rocket-Mock': 'true'
        },
        body: JSON.stringify({
          message: 'Binary file received (mock)',
          fileName: request.body.fileName,
          size: request.body.content.length,
          timestamp: new Date().toISOString()
        }),
        size: 150,
        time: 456
      }
    }
    
    // Mock responses based on URL patterns
    if (request.url.includes('httpbin.org')) {
      return {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'Server': 'nginx',
          'Date': new Date().toUTCString()
        },
        body: JSON.stringify({
          "args": {},
          "headers": {
            "Accept": "*/*",
            "Host": "httpbin.org",
            "User-Agent": "Rocket-API-Client",
            "X-Amzn-Trace-Id": "Root=1-6789abcd-ef012345"
          },
          "origin": "192.168.1.1",
          "url": request.url
        }),
        size: 342,
        time: 456
      }
    } else if (request.url.includes('jsonplaceholder.typicode.com')) {
      if (request.method === 'GET') {
        return {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=14400'
          },
          body: JSON.stringify([
            {
              "userId": 1,
              "id": 1,
              "title": "delectus aut autem",
              "completed": false
            },
            {
              "userId": 1,
              "id": 2,
              "title": "quis ut nam facilis et officia qui",
              "completed": false
            }
          ]),
          size: 156,
          time: 234
        }
      }
    } else if (request.url.includes('api.github.com')) {
      return {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '59'
        },
        body: JSON.stringify({
          "login": "octocat",
          "id": 1,
          "node_id": "MDQ6VXNlcjE=",
          "avatar_url": "https://github.com/images/error/octocat_happy.gif",
          "gravatar_id": "",
          "url": "https://api.github.com/users/octocat",
          "html_url": "https://github.com/octocat"
        }),
        size: 245,
        time: 678
      }
    }
    
    // Generic mock response for other URLs
    return {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
        'Server': 'Rocket-API-Mock'
      },
      body: JSON.stringify({
        "message": "This is a mock response from Rocket API",
        "request": {
          "method": request.method,
          "url": request.url,
          "timestamp": new Date().toISOString()
        },
        "data": {
          "id": Math.floor(Math.random() * 1000),
          "name": "Sample Data",
          "value": "Hello from Rocket API!"
        }
      }),
      size: 200 + Math.floor(Math.random() * 100),
      time: 300 + Math.floor(Math.random() * 500)
    }
  }

  async getCollections(): Promise<unknown[]> {
    return [
      {
        id: '1',
        name: 'Sample Collection',
        path: '/collections/sample',
        requests: [],
        folders: []
      }
    ]
  }

  async createCollection(name: string): Promise<unknown> {
    return {
      id: 'new-' + Date.now(),
      name: name,
      path: `/collections/${name.toLowerCase().replace(/\s+/g, '-')}`
    }
  }

  async getEnvironments(): Promise<unknown[]> {
    return [
      {
        id: '1',
        name: 'Development',
        variables: [
          { key: 'baseUrl', value: 'http://localhost:3000', enabled: true },
          { key: 'apiKey', value: 'dev-key-123', enabled: true }
        ]
      },
      {
        id: '2',
        name: 'Production',
        variables: [
          { key: 'baseUrl', value: 'https://api.production.com', enabled: true },
          { key: 'apiKey', value: 'prod-key-456', enabled: true }
        ]
      }
    ]
  }
}

export const mockApiService = new MockApiService()