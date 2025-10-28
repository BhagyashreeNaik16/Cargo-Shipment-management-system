mermaid
graph TD
    A[User Books Shipment] --> B{System Processes Booking};
    B --> C[Booking Details Stored];
    B --> D{AI Predicts Delivery Time};
    C --> E[Shipment Created];
    D --> E;
    E --> F{Management Modules};
    F --> G[Assign Driver/Vehicle];
    E --> H{Third-Party Integrations};
    H --> I[Send Notification];
    H --> J[Process Payment];
    G --> K[Shipment in Transit];
    K --> I;
    K --> L[Shipment Delivered];
    L --> I;
    L --> M[Update Status];
    M --> F;