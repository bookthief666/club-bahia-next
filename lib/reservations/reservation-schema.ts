import { z } from 'zod';

const phoneRegex = /^(?:\+?1[-.\s]?)?(?:\(?[2-9]\d{2}\)?[-.\s]?)[2-9]\d{2}[-.\s]?\d{4}$/;
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

function isFridayOrSaturday(value: string) {
  if (!value || !isoDateRegex.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  return weekday === 5 || weekday === 6;
}

const reservationFields = {
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters.'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .regex(phoneRegex, 'Enter a valid US phone number.'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  date: z.string().min(1, 'Date is required.').regex(isoDateRegex, 'Choose a valid date.'),
  guests: z.coerce
    .number({ message: 'Number of guests is required.' })
    .int('Guests must be a whole number.')
    .min(1, 'At least 1 guest is required.')
    .max(30, 'Reservations are limited to 30 guests.'),
  occasion: z
    .string()
    .trim()
    .max(80, 'Occasion must be 80 characters or fewer.')
    .optional()
    .or(z.literal('')),
  note: z
    .string()
    .trim()
    .max(500, 'Note must be 500 characters or fewer.')
    .optional()
    .or(z.literal('')),
  consent: z.boolean().refine(Boolean, {
    message: 'Confirm that Club Bahia may contact you about this request.',
  }),
};

export function createReservationSchema(eventDate?: string) {
  return z.object(reservationFields).superRefine((values, context) => {
    if (eventDate) {
      if (values.date !== eventDate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['date'],
          message: 'Use the date assigned to this event.',
        });
      }
      return;
    }

    if (!isFridayOrSaturday(values.date)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['date'],
        message:
          'General reservations are currently available for Friday and Saturday nights only.',
      });
    }
  });
}

export const reservationSchema = createReservationSchema();

export type ReservationFormValues = z.output<typeof reservationSchema>;
export type ReservationFormInput = z.input<typeof reservationSchema>;
