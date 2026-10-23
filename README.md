# FORM & FABLE INTERIORS

A responsive, single-page interior design studio website built with React, Vite, TypeScript, Tailwind CSS, Framer Motion, React Router, Lucide, React Hook Form, and Zod.

> This is a fictional demonstration brand. Project details, testimonials, portfolio photography, and package prices are illustrative placeholders and must be reviewed or replaced before publication.

## Local development

```sh
npm install
npm run dev
```

## Production build

```sh
npm run build
npm run preview
```

## Studio configuration

Update `src/data/site.ts` before launch:

- `whatsAppNumber`: international digits only (for example, country code + number without `+`). The demo placeholder falls back to WhatsApp's recipient chooser.
- `email`, `phone`, `address`, `serviceAreas`, and `hours`: replace demo contact details with verified information.
- `social`: replace generic social profile destinations.
- `projects`, `testimonials`, `packages`, `kitchenFinishes`, `kitchenRates`, `kitchenLayoutFactors`, and `kitchenCeilingAdjustmentPerFoot`: update illustrative demo data and pricing assumptions.

The kitchen planner provides a preliminary editable estimate, not a quotation. The inquiry form does not store submissions. It opens a prefilled WhatsApp message and the visitor must press **Send** in WhatsApp to transmit it. No backend or map integration is configured.

## Deployment

Run `npm run build`, then deploy the generated `dist/` directory to any static hosting provider configured to serve the SPA entry point for nested routes. Review all demo content, contact information, canonical metadata, and image licensing before launch.
