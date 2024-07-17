import { ZodError, z } from 'zod';

export const contact = z.object({
    name: z.string(),
    email: z.string().email(),
    reason: z.enum(['support', 'features', 'pricing']),
    query: z.string().max(200),
});

export const user = z.object({
    email: z.string().email({ message: 'Invalid email' }),
    password: z.string().min(12, 'Password must be no less than 12 characters').max(24, 'Password must have no more than 24 characters'),
})

export const constructErrorObj = (err: ZodError): { [error: string]: string } | null => {
    if(err.isEmpty) {
        return null;
    };
    let msgs = {};
    err.issues.forEach((error) => {
        msgs = { ...msgs, [error.path[0]]: error.message };
    })
    console.log(msgs);
    return msgs;
}