import * as z from "zod";

export const US_STATES = [
  {value: "AL", label: "Alabama"},
  {value: "AK", label: "Alaska"},
  {value: "AZ", label: "Arizona"},
  {value: "AR", label: "Arkansas"},
  {value: "CA", label: "California"},
  {value: "CO", label: "Colorado"},
  {value: "CT", label: "Connecticut"},
  {value: "DE", label: "Delaware"},
  {value: "DC", label: "District of Columbia"},
  {value: "FL", label: "Florida"},
  {value: "GA", label: "Georgia"},
  {value: "HI", label: "Hawaii"},
  {value: "ID", label: "Idaho"},
  {value: "IL", label: "Illinois"},
  {value: "IN", label: "Indiana"},
  {value: "IA", label: "Iowa"},
  {value: "KS", label: "Kansas"},
  {value: "KY", label: "Kentucky"},
  {value: "LA", label: "Louisiana"},
  {value: "ME", label: "Maine"},
  {value: "MD", label: "Maryland"},
  {value: "MA", label: "Massachusetts"},
  {value: "MI", label: "Michigan"},
  {value: "MN", label: "Minnesota"},
  {value: "MS", label: "Mississippi"},
  {value: "MO", label: "Missouri"},
  {value: "MT", label: "Montana"},
  {value: "NE", label: "Nebraska"},
  {value: "NV", label: "Nevada"},
  {value: "NH", label: "New Hampshire"},
  {value: "NJ", label: "New Jersey"},
  {value: "NM", label: "New Mexico"},
  {value: "NY", label: "New York"},
  {value: "NC", label: "North Carolina"},
  {value: "ND", label: "North Dakota"},
  {value: "OH", label: "Ohio"},
  {value: "OK", label: "Oklahoma"},
  {value: "OR", label: "Oregon"},
  {value: "PA", label: "Pennsylvania"},
  {value: "RI", label: "Rhode Island"},
  {value: "SC", label: "South Carolina"},
  {value: "SD", label: "South Dakota"},
  {value: "TN", label: "Tennessee"},
  {value: "TX", label: "Texas"},
  {value: "UT", label: "Utah"},
  {value: "VT", label: "Vermont"},
  {value: "VA", label: "Virginia"},
  {value: "WA", label: "Washington"},
  {value: "WV", label: "West Virginia"},
  {value: "WI", label: "Wisconsin"},
  {value: "WY", label: "Wyoming"},
] as const;

const US_STATE_CODES: string[] = US_STATES.map((s) => s.value);

const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
const cityRegex = /^[a-zA-ZÀ-ÿ\s.'-]+$/;
const zipRegex = /^\d{5}(-\d{4})?$/;

export const createCustomerSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or less")
    .regex(nameRegex, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be 50 characters or less")
    .regex(nameRegex, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (val) => {
        const digits = val.replace(/\D/g, "");
        return (
          digits.length === 10 ||
          (digits.length === 11 && digits.startsWith("1"))
        );
      },
      "Please enter a valid 10-digit phone number",
    ),
  dateOfBirth: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date <= new Date();
      },
      "Please enter a valid date that is not in the future",
    ),
  additionalNote: z
    .string()
    .max(500, "Note must be 500 characters or less")
    .optional()
    .or(z.literal("")),
  address: z.object({
    line1: z
      .string()
      .min(1, "Address line 1 is required")
      .max(100, "Address must be 100 characters or less"),
    line2: z
      .string()
      .max(100, "Address must be 100 characters or less")
      .optional()
      .or(z.literal("")),
    city: z
      .string()
      .min(1, "City is required")
      .max(50, "City must be 50 characters or less")
      .regex(cityRegex, "Please enter a valid city name"),
    state: z
      .string()
      .min(1, "State is required")
      .refine(
        (val) => US_STATE_CODES.includes(val),
        "Please select a valid US state",
      ),
    zip: z
      .string()
      .min(1, "ZIP code is required")
      .regex(zipRegex, "Please enter a valid ZIP code (e.g., 12345 or 12345-6789)"),
    country: z
      .string()
      .min(1, "Country is required")
      .max(50, "Country must be 50 characters or less"),
  }),
});

export type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;
