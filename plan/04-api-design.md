# API Design Specification

## API Principles

1. **RESTful Design**: Predictable, resource-oriented URLs
2. **Consistency**: Uniform response formats, error handling, naming
3. **Versioning**: `/api/v1/...` from day one
4. **Documentation**: OpenAPI/Swagger spec
5. **Security**: Authentication on all endpoints (except public health checks)

---

## Base URL

**Development:** `http://localhost:3000/api/v1`
**Production:** `https://api.scleorg.com/v1`

---

## Authentication

### Method: Bearer Token (JWT)

**Header:**
```
Authorization: Bearer <jwt_token>
```

**Token Source:** Clerk or Supabase Auth

**Token Payload:**
```json
{
  "sub": "user_abc123",  // User ID
  "email": "user@example.com",
  "iat": 1701234567,
  "exp": 1701321000
}
```

### Public Endpoints

- `GET /health` - Health check
- `GET /docs` - API documentation

All other endpoints require authentication.

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2025-11-29T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Department field is required",
    "details": {
      "field": "department",
      "provided": null
    }
  },
  "metadata": {
    "timestamp": "2025-11-29T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total_pages": 5,
    "total_items": 234
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_INPUT` | 400 | Validation error |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Temporary outage |

---

## Endpoints

### 1. Health & Meta

#### `GET /health`

**Description:** Service health check

**Authentication:** None

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-11-29T12:00:00Z"
}
```

---

### 2. User Management

#### `GET /users/me`

**Description:** Get current user profile

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_abc123",
    "email": "user@example.com",
    "company_name": "Acme Corp",
    "industry": "saas_b2b",
    "company_size": "100-250",
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

#### `PATCH /users/me`

**Description:** Update user profile

**Request Body:**
```json
{
  "company_name": "Acme Inc",
  "industry": "fintech",
  "company_size": "250-500"
}
```

**Response:** Updated user object

---

### 3. Datasets

#### `POST /datasets`

**Description:** Create new dataset (initiate upload)

**Request Body:**
```json
{
  "name": "Q1 2025 Headcount",
  "description": "Complete org structure as of March 2025",
  "company_name": "Acme Corp",
  "total_revenue": 50000000,
  "fiscal_year_start": "2025-01-01",
  "currency": "EUR"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "dataset_abc123",
    "name": "Q1 2025 Headcount",
    "status": "awaiting_upload",
    "upload_url": "https://r2.scleorg.com/upload/signed_url...",
    "upload_expires_at": "2025-11-29T13:00:00Z",
    "created_at": "2025-11-29T12:00:00Z"
  }
}
```

#### `POST /datasets/{id}/upload`

**Description:** Upload file to existing dataset

**Content-Type:** `multipart/form-data`

**Request:**
```
POST /api/v1/datasets/dataset_abc123/upload
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="employees.xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

[binary file content]
--boundary--
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "dataset_abc123",
    "status": "processing",
    "file_name": "employees.xlsx",
    "file_size_bytes": 45678,
    "estimated_processing_time_seconds": 30
  }
}
```

#### `GET /datasets/{id}/status`

**Description:** Check dataset processing status

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "dataset_abc123",
    "status": "processing",  // 'processing', 'mapping_required', 'ready', 'failed'
    "progress": 65,  // Percentage
    "message": "Parsing employee records...",
    "errors": []
  }
}
```

**Status Flow:**
```
awaiting_upload → processing → [mapping_required] → calculating → ready
                              ↓
                           failed
```

#### `POST /datasets/{id}/mapping`

**Description:** Confirm column mapping (if auto-detection was ambiguous)

**Request Body:**
```json
{
  "mapping": {
    "employee_id": "EmpID",
    "name": "Full Name",
    "department": "Dept",
    "role": "Job Title",
    "manager_id": "Manager EmpID",
    "annual_salary": "Base Salary",
    "total_compensation": "Total Comp"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "dataset_abc123",
    "status": "processing",
    "message": "Mapping applied, resuming processing"
  }
}
```

#### `GET /datasets`

**Description:** List all datasets for current user

**Query Parameters:**
- `page` (default: 1)
- `page_size` (default: 50, max: 100)
- `status` (filter: 'ready', 'processing', 'failed')
- `sort` (default: 'created_at', options: 'name', 'updated_at')
- `order` (default: 'desc')

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dataset_abc123",
      "name": "Q1 2025 Headcount",
      "status": "ready",
      "employee_count": 234,
      "total_cost": 28500000,
      "created_at": "2025-11-29T12:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### `GET /datasets/{id}`

**Description:** Get dataset details

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "dataset_abc123",
    "name": "Q1 2025 Headcount",
    "status": "ready",
    "file_name": "employees.xlsx",
    "company_name": "Acme Corp",
    "total_revenue": 50000000,
    "currency": "EUR",
    "employee_count": 234,
    "open_roles_count": 12,
    "total_cost": 28500000,
    "created_at": "2025-11-29T12:00:00Z",
    "processed_at": "2025-11-29T12:01:30Z"
  }
}
```

#### `DELETE /datasets/{id}`

**Description:** Delete dataset and all associated data

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Dataset and 234 employee records deleted"
  }
}
```

---

### 4. Employees

#### `GET /datasets/{dataset_id}/employees`

**Description:** List employees in dataset

**Query Parameters:**
- `page`, `page_size`
- `department` (filter)
- `employment_type` (filter)
- `search` (search by name, role)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "emp_xyz789",
      "employee_id": "E001",
      "name": "Jane Doe",
      "department": "Engineering",
      "role": "Senior Software Engineer",
      "employment_type": "FTE",
      "fte_factor": 1.0,
      "annual_salary": 120000,
      "total_compensation": 150000,
      "start_date": "2023-03-15"
    }
  ],
  "pagination": { ... }
}
```

#### `GET /datasets/{dataset_id}/employees/{id}`

**Description:** Get single employee details

**Response:** Single employee object

---

### 5. Metrics & Benchmarks

#### `GET /datasets/{id}/metrics`

**Description:** Get all calculated metrics for dataset

**Response:**
```json
{
  "success": true,
  "data": {
    "dataset_id": "dataset_abc123",
    "calculated_at": "2025-11-29T12:01:30Z",

    "summary": {
      "total_fte": 234.5,
      "total_cost": 28500000,
      "cost_per_fte": 121534,
      "revenue_per_fte": 213219  // If revenue provided
    },

    "departments": {
      "R&D": {
        "fte": 120,
        "cost": 18000000,
        "avg_compensation": 150000,
        "percentage": 51.2
      },
      "GTM": {
        "fte": 80,
        "cost": 8000000,
        "avg_compensation": 100000,
        "percentage": 34.1
      },
      "G&A": {
        "fte": 34.5,
        "cost": 2500000,
        "avg_compensation": 72464,
        "percentage": 14.7
      }
    },

    "ratios": {
      "rd_gtm": 1.5,
      "manager_ic": 0.12,
      "avg_span_of_control": 6.3
    },

    "outliers": {
      "high_cost_employees": [
        {
          "employee_id": "E042",
          "department": "Sales",
          "total_compensation": 450000,
          "z_score": 3.2
        }
      ]
    }
  }
}
```

#### `GET /datasets/{id}/benchmarks`

**Description:** Compare dataset to industry benchmarks

**Query Parameters:**
- `industry` (override auto-detected)
- `company_size` (override auto-detected)

**Response:**
```json
{
  "success": true,
  "data": {
    "dataset_metrics": {
      "rd_gtm_ratio": 1.5,
      "revenue_per_fte": 213219,
      "span_of_control": 6.3
    },

    "benchmarks": {
      "industry": "saas_b2b",
      "company_size": "100-250",
      "source": "openview_2024",

      "rd_gtm_ratio": {
        "min": 0.8,
        "p25": 0.9,
        "median": 1.0,
        "p75": 1.2,
        "max": 1.5,
        "dataset_percentile": 95
      },

      "revenue_per_fte": {
        "p25": 150000,
        "median": 200000,
        "p75": 300000,
        "dataset_percentile": 55
      }
    },

    "comparison": {
      "rd_gtm_ratio": {
        "status": "above",  // 'below', 'within', 'above'
        "delta_pct": 50,
        "severity": "high"
      }
    }
  }
}
```

---

### 6. Scenarios

#### `POST /scenarios`

**Description:** Create new scenario

**Request Body:**
```json
{
  "dataset_id": "dataset_abc123",
  "name": "Hiring Freeze Q2",
  "description": "What if we freeze all hiring?",
  "type": "freeze_hiring",
  "parameters": {}
}
```

**Alternative (Cost Reduction):**
```json
{
  "dataset_id": "dataset_abc123",
  "name": "10% Cost Reduction",
  "type": "cost_reduction",
  "parameters": {
    "reduction_pct": 10,
    "target_departments": ["R&D", "G&A"]  // Optional
  }
}
```

**Alternative (Target Ratio):**
```json
{
  "dataset_id": "dataset_abc123",
  "name": "Balance R&D:GTM to 1.0",
  "type": "target_ratio",
  "parameters": {
    "target_rd_gtm_ratio": 1.0
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "scenario_xyz789",
    "dataset_id": "dataset_abc123",
    "name": "Hiring Freeze Q2",
    "type": "freeze_hiring",
    "status": "calculated",
    "created_at": "2025-11-29T12:30:00Z"
  }
}
```

#### `GET /scenarios/{id}`

**Description:** Get scenario details and results

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "scenario_xyz789",
    "name": "Hiring Freeze Q2",
    "type": "freeze_hiring",
    "status": "calculated",

    "baseline": {
      "total_fte": 234.5,
      "total_cost": 28500000,
      "rd_gtm_ratio": 1.5
    },

    "scenario": {
      "total_fte": 224.5,
      "total_cost": 27300000,
      "rd_gtm_ratio": 1.52
    },

    "delta": {
      "fte_change": -10,
      "cost_savings": 1200000,
      "cost_savings_pct": 4.2,
      "ratio_change": 0.02
    }
  }
}
```

#### `GET /datasets/{dataset_id}/scenarios`

**Description:** List all scenarios for a dataset

**Response:** Array of scenario objects with summaries

#### `DELETE /scenarios/{id}`

**Description:** Delete scenario

---

### 7. Insights

#### `GET /datasets/{id}/insights`

**Description:** Get AI-generated insights for dataset

**Query Parameters:**
- `category` (filter: 'cost', 'structure', 'efficiency', 'risk')
- `severity` (filter: 'low', 'medium', 'high', 'critical')

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "insight_abc123",
      "category": "structure",
      "severity": "high",
      "title": "R&D:GTM ratio significantly above benchmark",
      "description": "Your R&D:GTM ratio is 1.5, which is 50% above the industry median of 1.0. This suggests potential over-investment in R&D relative to go-to-market functions.",
      "metrics": {
        "current_ratio": 1.5,
        "benchmark_median": 1.0,
        "delta_pct": 50
      },
      "suggested_actions": [
        "Increase GTM headcount by 20 FTE",
        "Reduce open R&D roles",
        "Shift budget allocation toward sales and marketing"
      ],
      "confidence_score": 0.92,
      "generated_by": "hybrid"
    }
  ]
}
```

#### `GET /scenarios/{id}/insights`

**Description:** Get insights specific to a scenario

**Response:** Similar to dataset insights, but scenario-specific

#### `POST /datasets/{id}/insights/regenerate`

**Description:** Force regeneration of insights (e.g., after benchmark update)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Insights regenerated",
    "count": 7
  }
}
```

---

### 8. Exports

#### `POST /datasets/{id}/export`

**Description:** Generate export (PDF, Excel, etc.)

**Request Body:**
```json
{
  "format": "pdf",  // 'pdf', 'xlsx', 'csv'
  "include": ["metrics", "benchmarks", "insights", "org_chart"],
  "email": "user@example.com"  // Optional: send via email
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "export_id": "export_abc123",
    "status": "processing",
    "estimated_completion_seconds": 15
  }
}
```

#### `GET /exports/{id}`

**Description:** Check export status and get download URL

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "export_abc123",
    "status": "ready",  // 'processing', 'ready', 'failed'
    "download_url": "https://r2.scleorg.com/exports/abc123.pdf",
    "expires_at": "2025-11-30T12:00:00Z"
  }
}
```

---

## Rate Limiting

**Limits (MVP):**
- Authenticated users: **100 requests/minute**
- File uploads: **10 uploads/hour**
- Export generation: **20 exports/hour**

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1701234600
```

**Error Response (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 34 seconds.",
    "details": {
      "retry_after_seconds": 34
    }
  }
}
```

---

## Webhooks (Post-MVP)

**Events:**
- `dataset.processing_complete`
- `dataset.processing_failed`
- `scenario.calculated`
- `insights.generated`

**Webhook Payload:**
```json
{
  "event": "dataset.processing_complete",
  "data": {
    "dataset_id": "dataset_abc123",
    "status": "ready",
    "employee_count": 234
  },
  "timestamp": "2025-11-29T12:01:30Z"
}
```

---

## OpenAPI Specification

Generate using:
- **Swagger/OpenAPI 3.0**
- **Tools:** Swagger UI, Redoc
- **Auto-generate** from code comments (FastAPI does this automatically)

**Documentation URL:** `https://api.scleorg.com/docs`

---

## API Versioning Strategy

### Version 1 (MVP)
- `/api/v1/...`
- All endpoints listed above

### Future Versions
- `/api/v2/...` - Breaking changes only
- **Deprecation period:** 6 months minimum
- **Support policy:** Support N and N-1 versions

**Breaking Changes:**
- Remove/rename fields
- Change response structure
- Change authentication method

**Non-Breaking Changes:**
- Add new endpoints
- Add optional fields
- Add new query parameters

---

## Testing the API

### Example cURL Requests

**Upload Flow:**

```bash
# 1. Create dataset
curl -X POST https://api.scleorg.com/v1/datasets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 2025 Headcount",
    "company_name": "Acme Corp",
    "total_revenue": 50000000
  }'

# 2. Upload file
curl -X POST https://api.scleorg.com/v1/datasets/dataset_abc123/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@employees.xlsx"

# 3. Check status
curl https://api.scleorg.com/v1/datasets/dataset_abc123/status \
  -H "Authorization: Bearer $TOKEN"

# 4. Get metrics
curl https://api.scleorg.com/v1/datasets/dataset_abc123/metrics \
  -H "Authorization: Bearer $TOKEN"
```

---

## Client SDKs (Future)

**Languages:**
- JavaScript/TypeScript (Priority 1)
- Python (Priority 2)
- Go (Priority 3)

**Example (TypeScript):**
```typescript
import { ScleorgClient } from '@scleorg/sdk';

const client = new ScleorgClient({
  apiKey: process.env.SCLEORG_API_KEY
});

const dataset = await client.datasets.create({
  name: 'Q1 2025 Headcount',
  companyName: 'Acme Corp'
});

await dataset.upload('employees.xlsx');

const metrics = await dataset.getMetrics();
console.log(metrics.summary.rd_gtm_ratio);
```

---

**API Version**: v1
**Last Updated**: 2025-11-29
**Spec Format**: OpenAPI 3.0
**Change Log**: [Link to changelog]
