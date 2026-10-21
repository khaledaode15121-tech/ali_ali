# ERD for the Bridal Boutique Project

This project is modeled around a boutique e-commerce and admin system for bridal, engagement, and evening dresses.

```mermaid
erDiagram
    ADMIN ||--o{ CATEGORY : manages
    ADMIN ||--o{ PRODUCT : controls
    ADMIN ||--o{ ORDER : monitors

    CUSTOMER ||--o{ ORDER : places
    CUSTOMER ||--o{ REVIEW : writes

    CATEGORY ||--o{ SUBCATEGORY : contains
    SUBCATEGORY ||--o{ PRODUCT : includes
    PRODUCT ||--o{ PRODUCT_MEDIA : has
    PRODUCT ||--o{ OFFER : has
    PRODUCT ||--o{ REVIEW : receives
    PRODUCT ||--o{ ORDER : is_in

    ORDER ||--|| RESERVATION : schedules

    ADMIN {
        string id PK
        string full_name
        string email
        string role
    }

    CUSTOMER {
        string id PK
        string full_name
        string phone
        string email
        string preferred_style
    }

    CATEGORY {
        string id PK
        string name
        string slug
        text description
    }

    SUBCATEGORY {
        string id PK
        string category_id FK
        string name
        string slug
    }

    PRODUCT {
        string id PK
        string subcategory_id FK
        string code
        string name
        decimal price
        decimal rental_price
        string stock_status
        boolean is_featured
        boolean is_active
    }

    PRODUCT_MEDIA {
        string id PK
        string product_id FK
        string url
        string type
        boolean is_primary
    }

    OFFER {
        string id PK
        string product_id FK
        string title
        int discount_percent
        date starts_at
        date ends_at
    }

    ORDER {
        string id PK
        string customer_id FK
        string product_id FK
        string order_type
        string status
        int quantity
        decimal total_price
        datetime created_at
    }

    RESERVATION {
        string id PK
        string order_id FK
        date appointment_date
        string pickup_method
        text note
    }

    REVIEW {
        string id PK
        string product_id FK
        string customer_id FK
        int rating
        text comment
    }
```

## Main relationships

- One category contains many subcategories.
- One subcategory contains many products.
- One product can have many media files and offers.
- One customer can place many orders and create many reviews.
- One order can have one reservation.
- Admin users manage categories, products, and orders.

## Notes for implementation

This structure matches the storefront and admin dashboard already present in the project, including:

- main categories
- subcategories
- products / dresses
- rental and purchase flows
- customer orders and reservations
- promotional offers
- admin control panels
