import * as z from "zod"

export const riderSchema = z.object({
  // Step 1
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  phone: z.string().regex(/^0[0-9]{9}$/, "Must be a valid 10-digit Ghana number"),
  
  // Step 2
  town: z.string().min(1, "Please select a town"),
  licensePlate: z.string().min(4, "Invalid license plate"),
})

export type RiderFormValues = z.infer<typeof riderSchema>