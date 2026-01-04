# Design Documents Index

> **Purpose:** This document lists all major functionalities that have design documents, following RFC/Design Doc best practices.  
> **Last Updated:** 2025-01-23

## Overview

This project uses design documents to document major functionalities, architectural decisions, and system designs. Each design doc follows a structured format inspired by industry best practices (Google, Sourcegraph, HashiCorp, etc.).

All design documents are located in the [`docs/design-docs/`](./design-docs/) directory and are numbered sequentially (001-013) for easy reference.

## Design Documents

### Core Systems

1. **[Household Configuration & Calculation System](./design-docs/001-household-configuration.md)**
   - Household size configuration (adults, children)
   - Supply duration settings
   - Multiplier calculation formulas
   - Recommended quantity calculations

2. **[Inventory Management System](./design-docs/002-inventory-management.md)**
   - Item CRUD operations
   - Item status calculation (OK/Warning/Critical)
   - Expiration tracking
   - Quantity management

3. **[Recommended Items System](./design-docs/003-recommended-items.md)**
   - Built-in 70-item recommendations
   - Custom recommendations import/export
   - Item scaling rules (scaleWithPeople, scaleWithDays)
   - Multi-language support

4. **[Dashboard & Preparedness Score](./design-docs/004-dashboard-preparedness.md)**
   - Overall preparedness percentage
   - Category status aggregation
   - Visual indicators and progress bars
   - Quick actions

5. **[Alert System](./design-docs/005-alert-system.md)**
   - Alert types (expired, expiring, missing, low quantity)
   - Alert dismissal and management
   - Backup reminders
   - Hidden alerts reactivation

### Data Management

6. **[Data Import/Export System](./design-docs/006-data-import-export.md)**
   - JSON data format
   - Import validation
   - Export functionality
   - Shopping list export (TXT/Markdown/CSV)
   - Recommendations import/export

7. **[LocalStorage Persistence Architecture](./design-docs/007-localstorage-persistence.md)**
   - Data structure and schema
   - Storage operations
   - Migration strategy
   - Error handling and recovery

### User Experience

8. **[Onboarding Flow](./design-docs/008-onboarding-flow.md)**
   - Multi-step onboarding process
   - Household preset selection
   - Quick setup options
   - First-time user guidance

9. **[Settings Management](./design-docs/009-settings-management.md)**
   - Household configuration UI
   - Advanced features toggles
   - Language and theme selection
   - Disabled recommendations management

### Supporting Systems

10. **[Product Templates System](./design-docs/010-product-templates.md)**
    - Built-in templates
    - Custom template creation
    - Barcode support
    - Template-based item creation

11. **[Category Management](./design-docs/011-category-management.md)**
    - Standard 9 categories
    - Custom category creation
    - Category icons and metadata
    - Category-based filtering

12. **[Status Calculation System](./design-docs/012-status-calculation.md)**
    - Item status logic (OK/Warning/Critical)
    - Expiration-based status
    - Quantity-based status
    - Category status aggregation

13. **[Internationalization (i18n) System](./design-docs/013-internationalization.md)**
    - Translation file structure
    - Language switching
    - URL parameter support
    - Multi-language recommendations

## Design Doc Template

Each design document follows this structure:

- **Status**: Draft | Proposed | Published | Deprecated
- **Summary**: Brief overview of the functionality
- **Background**: Context and problem statement
- **Goals and Non-Goals**: What we're solving and what we're not
- **Design**: Detailed technical design
- **Alternatives Considered**: Other approaches evaluated
- **Implementation Details**: Code structure and patterns
- **Risks and Mitigations**: Potential issues and solutions
- **Open Questions**: Unresolved decisions

## When to Create a Design Doc

Create a design doc for:

- ✅ New major features or functionalities
- ✅ Significant architectural changes
- ✅ Complex business logic or calculations
- ✅ Data model changes
- ✅ Cross-cutting concerns affecting multiple features
- ✅ User-facing workflows with multiple steps

**Do NOT create a design doc for:**

- ❌ Simple bug fixes
- ❌ UI-only changes (unless major UX overhaul)
- ❌ Minor refactorings
- ❌ Documentation updates

## Quick Reference

**Total Design Documents:** 13

**By Category:**

- Core Systems: 5 documents
- Data Management: 2 documents
- User Experience: 2 documents
- Supporting Systems: 4 documents

**All documents are marked as "Published"** and reflect the current implementation as of 2025-01-23.

## References

- [RFCs and Design Docs - The Pragmatic Engineer](https://blog.pragmaticengineer.com/rfcs-and-design-docs/)
- [Engineering Planning with RFCs, Design Document and ADRs](https://blog.pragmaticengineer.com/engineering-planning/)

## Related Documentation

- [FUNCTIONAL_SPEC.md](./FUNCTIONAL_SPEC.md) - Functional requirements and user workflows
- [DATA_SCHEMA.md](./DATA_SCHEMA.md) - Data structure definitions and types
- [COMPONENT_ARCHITECTURE.md](./COMPONENT_ARCHITECTURE.md) - React component structure
- [APPLICATION_ARCHITECTURE.md](./APPLICATION_ARCHITECTURE.md) - System architecture overview
