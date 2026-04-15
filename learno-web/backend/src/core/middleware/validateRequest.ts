import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const formatted = result.error.format();
            const flatErrors = Object.values(formatted)
                .flat()
                .filter(Boolean)
                .map((err: any) => err._errors)
                .flat();
            console.log(flatErrors);
            res.status(400).json({ message: flatErrors.join(", ") });
            return;
        }
        next();
    };
};