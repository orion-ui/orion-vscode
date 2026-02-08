## ADDED Requirements

### Requirement: Normalize service names for template variables
The system SHALL convert the user-provided service name into a PascalCase form and a camelCase form. The PascalCase form SHALL end with a single "Service" suffix, and the camelCase form SHALL mirror the PascalCase value with a lowercase first letter.

#### Scenario: Normalize arbitrary input
- **WHEN** the user enters a service name in any string format
- **THEN** the system computes `{ServiceName}` in PascalCase with a single "Service" suffix and `{serviceName}` in camelCase

### Requirement: Prevent duplicate Service suffix
The system SHALL avoid duplicating the "Service" suffix when the user input already ends with "Service" in any casing.

#### Scenario: Input already ends with Service
- **WHEN** the user enters "billing service" or "BillingService"
- **THEN** the system produces `{ServiceName}` ending with a single "Service" suffix

### Requirement: Generate service file from selected template
The system SHALL create a new service file by substituting supported template variables with the normalized service name values.

#### Scenario: Create file with variable replacement
- **WHEN** the user confirms service creation
- **THEN** the system writes a new file with `{ServiceName}` and `{serviceName}` replaced by the normalized values